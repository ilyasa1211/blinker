<script setup lang="ts">
import { drawLandmark, setupLandmarker } from "../landmark.js";
import { resizeCanvas } from "../common/utils.js";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { onMounted, onUnmounted, ref } from "vue";
import { hideOverlay, showOverlay } from "../common/api.js";
import { settings } from "../settings.js";
import { state } from "../state.js";

const activeSession = ref<boolean>(false);
const activeCamera = ref<boolean>(false);

const timeoutId = ref<number | undefined | NodeJS.Timeout>(undefined);
const isEyesCloseRef = ref<boolean>(false);

const blinkCount = ref<number>(0);

const devices = ref<MediaDeviceInfo[]>([]);
const selectedDeviceId = ref<string>("");

let lastVideoTime = -1;

const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const gpuCanvasElement = ref<HTMLCanvasElement | null>(null);
let requestAnimationFrameId: number | undefined;
let faceLandmarker: FaceLandmarker | undefined;

function stopSession() {
  hideOverlay();
  removeTimeout();
  activeSession.value = false;
};

function startSession() {
  resetTimeout(showOverlay);
  activeSession.value = true;
};

function toggleSession() {
  if (activeSession.value) {
    stopSession();
  } else {
    startSession();
  }
};

function handleEyesClose(){
  if (!isEyesCloseRef.value) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!activeSession.value || state.isBreak) return;

  hideOverlay();
  removeTimeout();
};

function handleEyesOpen() {
  if (isEyesCloseRef.value) {
    isEyesCloseRef.value = false;

    if (!activeSession.value || state.isBreak) return;

    resetTimeout(showOverlay);
  }
};

function removeTimeout() {
  clearTimeout(timeoutId.value);
};

function resetTimeout(callback: () => void) {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(callback, settings.blinkTimeout * 1000);
};

function incrementBlinkCounter() {
  blinkCount.value++;
};

function predictWebcam() {
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
        blinkEyes?.every((blinkEye) => blinkEye.score >= settings.thresholdEyesClosed)
      ) {
        handleEyesClose();
      }

      // is eye's opening
      if (
        blinkEyes?.every((blinkEye) => blinkEye.score <= settings.thresholdEyesOpened)
      ) {
        handleEyesOpen();
      }
    }
  })();

  requestAnimationFrameId = requestAnimationFrame(predictWebcam);
};

// 2. Start Camera
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: selectedDeviceId.value
        ? { exact: selectedDeviceId.value }
        : undefined,
    },
  }).catch(err => err);

  if (stream instanceof Error) {
    console.error(stream)
    return
  }

  if (!videoElement.value) throw new Error("video element is undefined");

  activeCamera.value = true;
  videoElement.value.srcObject = stream;
  videoElement.value.addEventListener("loadeddata", predictWebcam);
  // active.value = true;
};

function stopCamera () {
  if (!videoElement.value) return;

  const stream = videoElement.value.srcObject as MediaStream;

  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
  activeCamera.value = false;
  videoElement.value.srcObject = null;
  activeCamera.value = false;
  stopSession();
};

async function getCameras() {
  const allDevices = await navigator.mediaDevices.enumerateDevices();

  devices.value = allDevices.filter((device) => device.kind === "videoinput");

  if (devices.value.length > 0) {
    selectedDeviceId.value = devices.value[0].deviceId;
  }
};

async function toggleCamera () {
  if (activeCamera.value) {
    stopCamera();
  } else {
    await startCamera();
  }
};

function handleCameraChange() {
  stopCamera();
  startCamera();
};

onMounted(async () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  const gpuCanvas = gpuCanvasElement.value;

  if (!video || !canvas || !gpuCanvas) {
    throw new Error("canvas or video element was not found");
  }
  await getCameras();
  faceLandmarker = await setupLandmarker(gpuCanvas);
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
      <div class="lg:col-span-8 space-y-6">
        <div
          class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-slate-700 shadow-2xl flex items-center justify-center">
          <div class="text-slate-600 text-center">
            <div class="text-6xl mb-4">🎭</div>
            <p class="text-sm tracking-widest uppercase">Video Feed Canvas</p>
          </div>


          <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover invisible" autoplay muted
            playsinline></video>

          <canvas ref="gpuCanvasElement"
            class="absolute inset-0 w-full h-full object-cover z-10 mirror"></canvas>

          <canvas ref="canvasElement"
            class="absolute inset-0 w-full h-full object-cover z-10 mirror"></canvas>

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
            <button @click="toggleSession" :disabled="!activeCamera" :class="[
              activeSession ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20',
              !activeCamera ? 'opacity-30 cursor-not-allowed' : ''
            ]"
              class="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl">
              {{ activeSession ? 'Stop Session' : 'Start Session' }}
            </button>
          </div>
        </div>
      </div>
</template>

<style scoped>
.mirror {
  transform: scaleX(-1);
}
</style>
