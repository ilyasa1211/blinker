<script setup lang="ts">
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { onMounted, onUnmounted, ref, reactive } from "vue";
import { hideOverlay, showOverlay } from "../common/api.js";
import { resizeCanvas } from "../common/utils.js";
import { drawLandmark, setupLandmarker } from "../landmark.js";
import { defaultSettings as settings } from "../settings.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CameraStatusBadge from "./CameraStatusBadge.vue";
import DeviceSelector from "./DeviceSelector.vue";
import CameraControlPanel from "./CameraControlPanel.vue";

const state = reactive({ isBreak: false });

const isRunning = ref<boolean>(false);

const timeoutId = ref<number | undefined>(undefined);
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
let autoStarted = false;

function stopSession() {
  hideOverlay();
  removeTimeout();
  isRunning.value = false;
}

function startSession() {
  resetTimeout(showOverlay);
}

function toggleRunning() {
  if (isRunning.value) {
    stopSession();
    stopCamera();
  } else {
    startCamera();
    startSession();
  }
}

function handleEyesClose() {
  if (!isEyesCloseRef.value) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!isRunning.value || state.isBreak) return;

  hideOverlay();
  removeTimeout();
}

function handleEyesOpen() {
  if (isEyesCloseRef.value) {
    isEyesCloseRef.value = false;

    if (!isRunning.value || state.isBreak) return;

    resetTimeout(showOverlay);
  }
}

function removeTimeout() {
  clearTimeout(timeoutId.value);
}

function resetTimeout(callback: () => void) {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(callback, settings.blinkTimeout * 1000);
}

function incrementBlinkCounter() {
  blinkCount.value++;
}

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
    resizeCanvas(canvas, videoElement.value.videoWidth, videoElement.value.videoHeight);

    lastVideoTime = videoElement.value.currentTime;
    const results = faceLandmarker.detectForVideo(videoElement.value, performance.now());

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results) {
      drawLandmark(results, ctx);
    }

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blinkEyes = results.faceBlendshapes
        .at(0)
        ?.categories.filter(
          (cat) => cat.categoryName === "eyeBlinkLeft" || cat.categoryName === "eyeBlinkRight",
        );

      // is eye's closing
      if (blinkEyes?.every((blinkEye) => blinkEye.score >= settings.thresholdEyesClosed)) {
        handleEyesClose();
      }

      // is eye's opening
      if (blinkEyes?.every((blinkEye) => blinkEye.score <= settings.thresholdEyesOpened)) {
        handleEyesOpen();
      }
    }
  })();

  requestAnimationFrameId = requestAnimationFrame(predictWebcam);
}

// 2. Start Camera
async function startCamera() {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      video: {
        deviceId: selectedDeviceId.value ? { exact: selectedDeviceId.value } : undefined,
      },
    })
    .catch((err) => err);

  if (stream instanceof Error) {
    console.error(stream);
    return;
  }

  if (!videoElement.value) throw new Error("video element is undefined");

  isRunning.value = true;
  videoElement.value.srcObject = stream;
  videoElement.value.addEventListener("loadeddata", predictWebcam);
  // active.value = true;
}

function stopCamera() {
  if (!videoElement.value) return;

  const stream = videoElement.value.srcObject as MediaStream;

  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
  videoElement.value.srcObject = null;
}

async function getCameras() {
  const allDevices = await navigator.mediaDevices.enumerateDevices();

  devices.value = allDevices.filter((device) => device.kind === "videoinput");

  if (devices.value.length > 0) {
    selectedDeviceId.value = devices.value[0].deviceId;
  }
}

function handleCameraChange() {
  stopCamera();
  startCamera();
}

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

  if (!autoStarted && settings.autoStartSession && !isRunning.value) {
    autoStarted = true;
    try {
      await startCamera();
      startSession();
    } catch (e) {
      console.error("Auto-start failed:", e);
    }
  }
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
    <Card class="aspect-video relative">
      <CardHeader>
        <CameraStatusBadge :is-active="isRunning" />
      </CardHeader>
      <CardContent>
        <div class="text-muted-foreground text-center">
          <div class="text-6xl mb-4">🎭</div>
          <p class="text-sm tracking-widest uppercase">Video Feed Canvas</p>
        </div>

        <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover invisible" autoplay muted
          playsinline></video>

        <canvas ref="gpuCanvasElement" class="absolute inset-0 w-full h-full object-cover z-10 mirror"></canvas>

        <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-10 mirror"></canvas>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Device Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <DeviceSelector v-model="selectedDeviceId" :devices="devices" @change="handleCameraChange" />
      </CardContent>
    </Card>

    <CameraControlPanel :blink-count="blinkCount" :is-session-active="isRunning"
      @toggle-session="toggleRunning" />
  </div>
</template>

<style scoped>
.mirror {
  transform: scaleX(-1);
}
</style>
