<script setup lang="ts">
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { onMounted, onUnmounted, ref } from "vue";
import { drawLandmark, setupLandmarker } from "./common/landmark.js";
import { resizeCanvas } from "./common/util.js";

/**
 * Show overlay window
 */
function showOverlay() {
  window.api?.showOverlay();
}

/**
 * Hide overlay window
 */
function hideOverlay() {
  window.api?.hideOverlay();
}

interface Breakpoint {
  /**
   * Repeat every x (minute/second).
   */
  interval: number;
  intervalUnit: "second" | "minute";

  /**
   * How long this break will last (minute/second).
   */
  duration: number;
  durationUnit: "second" | "minute";
}
// State
const THRESHOLD_EYES_CLOSE = 0.3;
const activeSession = ref<boolean>(false);
const activeCamera = ref<boolean>(false);
const blinkCount = ref<number>(0);
const blinkTimeout = ref<number>(0.5);
const breakpoints = ref<Breakpoint[]>([
  {
    // 20-20-20 rule
    interval: 20,
    intervalUnit: "minute",
    duration: 20,
    durationUnit: "second",
  },
]);
const timeoutId = ref<number | undefined | NodeJS.Timeout>(undefined);
const isEyesCloseRef = ref<boolean>(false);
const videoElement = ref<HTMLVideoElement>();
const canvasElement = ref<HTMLCanvasElement>();
const devices = ref<MediaDeviceInfo[]>([]);
const selectedDeviceId = ref<string>("");

let requestAnimationFrameId: number | undefined;
let faceLandmarker: FaceLandmarker | undefined;
let lastVideoTime = -1;

// Methods
const addBreakpoint = () => {
  breakpoints.value.push({
    interval: 60,
    intervalUnit: "minute",
    duration: 30,
    durationUnit: "minute",
  });
};

const removeBreakpoint = (index: number) => {
  breakpoints.value.splice(index, 1);
};

const removeTimeout = () => {
  clearTimeout(timeoutId.value);
};

const resetTimeout = (callback: () => void) => {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(callback, blinkTimeout.value * 1000);
};

const incrementBlinkCounter = () => {
  blinkCount.value++;
};

const handleEyesClose = () => {
  if (!isEyesCloseRef.value) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!activeSession.value) return;

  hideOverlay();
  removeTimeout();
};

const handleEyesOpen = () => {
  if (isEyesCloseRef.value) {
    isEyesCloseRef.value = false;

    if (!activeSession.value) return;

    resetTimeout(showOverlay);
  }
};

const toggleSession = () => {
  if (activeSession.value) {
    hideOverlay();
    removeTimeout();
  } else {
    resetTimeout(showOverlay);
  }

  activeSession.value = !activeSession.value;
};

const predictWebcam = () => {
  const canvas = canvasElement.value;
  const ctx = canvas?.getContext("2d");
  (() => {
    if (
      !canvas ||
      !ctx ||
      !faceLandmarker ||
      !videoElement.value ||
      lastVideoTime === videoElement.value.currentTime
    )
      return;
    resizeCanvas(
      canvas,
      videoElement.value.videoWidth,
      videoElement.value.videoHeight,
    );

    lastVideoTime = videoElement.value.currentTime;
    const results = faceLandmarker.detectForVideo(
      videoElement.value,
      performance.now(),
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results) {
      drawLandmark(results, ctx);
    }

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blinkEyes = results.faceBlendshapes
        .at(0)
        ?.categories.filter(
          (cat) =>
            cat.categoryName === "eyeBlinkLeft" ||
            cat.categoryName === "eyeBlinkRight",
        );

      // is eye's closing
      if (
        blinkEyes?.every((blinkEye) => blinkEye.score >= THRESHOLD_EYES_CLOSE)
      ) {
        handleEyesClose();
      }

      // is eye's opening
      if (
        blinkEyes?.every((blinkEye) => blinkEye.score < THRESHOLD_EYES_CLOSE)
      ) {
        handleEyesOpen();
      }
    }
  })();

  requestAnimationFrameId = requestAnimationFrame(predictWebcam);
};

// 2. Start Camera
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: selectedDeviceId.value
        ? { exact: selectedDeviceId.value }
        : undefined,
    },
  });
  if (!videoElement.value) throw new Error("video element is undefined");

  videoElement.value.srcObject = stream;
  videoElement.value.addEventListener("loadeddata", predictWebcam);
  // active.value = true;
};

const stopCamera = () => {
  if (!videoElement.value) return;

  const stream = videoElement.value.srcObject as MediaStream;

  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
  videoElement.value.srcObject = null;
  activeCamera.value = false;
  activeSession.value = false; // Force stop session if camera is off
};

const getCameras = async () => {
  const allDevices = await navigator.mediaDevices.enumerateDevices();

  devices.value = allDevices.filter((device) => device.kind === "videoinput");

  if (devices.value.length > 0) {
    selectedDeviceId.value = devices.value[0].deviceId;
  }
};

const toggleCamera = async () => {
  if (activeCamera.value) {
    stopCamera();
    activeCamera.value = false;
  } else {
    await startCamera();
    activeCamera.value = true;
  }
};

const handleCameraChange = () => {
  stopCamera();
  startCamera();
};

onMounted(async () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;

  if (!video || !canvas) {
    throw new Error("canvas or video element was not found");
  }
  await getCameras();
  faceLandmarker = await setupLandmarker();
  // await startCamera();

  video?.addEventListener("loadeddata", predictWebcam);
});

onUnmounted(async () => {
  const video = videoElement.value;

  video?.removeEventListener("loadeddata", predictWebcam);
  faceLandmarker?.close();

  if (typeof requestAnimationFrameId !== "undefined") {
    cancelAnimationFrame(requestAnimationFrameId);
  }
});
</script>


<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

      <div class="lg:col-span-8 space-y-6">
        <div
          class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-slate-700 shadow-2xl flex items-center justify-center">
          <div class="text-slate-600 text-center">
            <div class="text-6xl mb-4">🎭</div>
            <p class="text-sm tracking-widest uppercase">Video Feed Canvas</p>
          </div>


          <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover invisible" autoplay muted
            playsinline></video>

          <canvas ref="canvasElement"
            class="absolute inset-0 w-full h-full object-cover z-10 bg-slate-800 mirror"></canvas>

          <div class="absolute top-5 left-5 z-10">
            <div
              :class="activeCamera ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'"
              class="px-4 py-1.5 rounded-full border backdrop-blur-md text-sm font-bold flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span v-if="activeCamera"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2"
                  :class="activeCamera ? 'bg-green-500' : 'bg-red-500'"></span>
              </span>
              {{ activeCamera ? 'LIVE TRACKING' : 'SYSTEM PAUSED' }}
            </div>
          </div>
        </div>

        <div
          class="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-center md:text-left">
            <p class="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold mb-1">Total Blinks Detected</p>
            <h2 :key="blinkCount" class="text-7xl font-black text-white tabular-nums">
              {{ blinkCount }}
            </h2>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button @click="toggleCamera"
              :class="activeCamera ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'"
              class="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl">
              {{ activeCamera ? 'Stop Camera' : 'Start Camera' }}
            </button>
            <button @click="toggleSession" :class="[
              activeSession ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20',
              !activeCamera ? 'opacity-30 cursor-not-allowed' : ''
            ]"
              class="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl">
              {{ activeSession ? 'Stop Session' : 'Start Session' }}
            </button>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-6">
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-6">Device Settings</h3>
          <div class="space-y-4">
            <label class="block text-sm font-medium text-slate-400 mb-2">Select Input Source</label>
            <select v-model="selectedDeviceId" @change="handleCameraChange"
              class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition">
              <option v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `Camera ${devices.indexOf(device) + 1}` }}
              </option>
            </select>
          </div>
        </div>

        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-6">Configuration</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">Blink Timeout (Seconds)</label>
              <input type="number" step="0.1" v-model="blinkTimeout"
                class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl h-fit">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest">Breakpoints</h3>
            <button @click="addBreakpoint"
              class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors">
              + Add New
            </button>
          </div>

          <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="(bp, index) in breakpoints" :key="index"
              class="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 space-y-3 group relative">

              <button @click="removeBreakpoint(index)"
                class="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>

              <div>
                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Interval</label>
                <div class="flex">
                  <input type="number" v-model="bp.interval"
                    class="flex-1 bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <select v-model="bp.intervalUnit"
                    class="bg-slate-700 border border-slate-700 rounded-r-xl px-2 py-2 text-xs font-semibold text-indigo-300 outline-none cursor-pointer border-l-0">
                    <option value="second">Sec</option>
                    <option value="minute">Min</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Duration</label>
                <div class="flex">
                  <input type="number" v-model="bp.duration"
                    class="flex-1 bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                  <select v-model="bp.durationUnit"
                    class="bg-slate-700 border border-slate-700 rounded-r-xl px-2 py-2 text-xs font-semibold text-emerald-300 outline-none cursor-pointer border-l-0">
                    <option value="second">Sec</option>
                    <option value="minute">Min</option>
                  </select>
                </div>
              </div>
            </div>

            <p v-if="breakpoints.length === 0" class="text-center text-slate-500 text-sm py-4 italic">
              No breakpoints added yet.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Scrollbar Styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
}

.mirror {
  transform: scaleX(-1);
}
</style>
