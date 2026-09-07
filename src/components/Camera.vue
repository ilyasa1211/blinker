<script setup lang="ts">
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import { onMounted, onUnmounted, ref, computed, useTemplateRef, watch } from "vue";
import { Play, Pause } from "@lucide/vue";
import { hideOverlay, showOverlay } from "../common/api.js";
import { resizeCanvas } from "../common/utils.js";
import { drawLandmark, setupLandmarker } from "../landmark.js";
import { defaultSettings as settings } from "../settings.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import CameraStatusBadge from "./CameraStatusBadge.vue";

const props = defineProps<{
  selectedDeviceId: string,
}>();

const isBreakRef = ref(false);
const isRunningRef = ref(false);
const blinkCountRef = ref(0);
const isEyesCloseRef = ref(false);
const timeoutIdRef = ref<number | undefined>(undefined);
const videoElementRef = useTemplateRef("videoElement");
const canvasElementRef = useTemplateRef("canvasElement");
const gpuCanvasElementRef = useTemplateRef("gpuCanvasElement");
const canvasContextCompt = computed(() => canvasElementRef.value?.getContext("2d"));

let lastVideoTime = -1;
let requestAnimationFrameId: number | undefined;
let faceLandmarker: FaceLandmarker | undefined;

watch(() => props.selectedDeviceId, async (newID) => {
  console.log("CHANGED HAHA", newID)
  if (newID && settings.autoStartSession && !isRunningRef.value) {
    try {
      await startCamera(newID);
      startSession();
    } catch (e) {
      console.error("Auto-start failed:", e);
    }
  }
});

function stopSession() {
  hideOverlay();
  removeTimeout();
  isRunningRef.value = false;
}

function startSession() {
  resetTimeout(showOverlay);
}

function toggleRunning() {
  if (isRunningRef.value) {
    stopSession();
    stopCamera();
  } else {
    startCamera(props.selectedDeviceId);
    startSession();
  }
}

function handleEyesClose() {
  if (!isEyesCloseRef.value) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!isRunningRef.value || isBreakRef.value) return;

  hideOverlay();
  removeTimeout();
}

function handleEyesOpen() {
  if (isEyesCloseRef.value) {
    isEyesCloseRef.value = false;

    if (!isRunningRef.value || isBreakRef.value) return;

    resetTimeout(showOverlay);
  }
}

function removeTimeout() {
  clearTimeout(timeoutIdRef.value);
}

function resetTimeout(callback: () => void) {
  clearTimeout(timeoutIdRef.value);
  timeoutIdRef.value = setTimeout(callback, settings.blinkTimeout * 1000);
}

function incrementBlinkCounter() {
  blinkCountRef.value++;
}

function predictWebcam() {
  const canvas = canvasElementRef.value;
  const ctx = canvasContextCompt.value;

  (() => {
    if (
      !canvas ||
      !ctx ||
      !faceLandmarker ||
      !videoElementRef.value ||
      lastVideoTime === videoElementRef.value.currentTime
    )
      return;

    resizeCanvas(canvas, videoElementRef.value.videoWidth, videoElementRef.value.videoHeight);

    lastVideoTime = videoElementRef.value.currentTime;
    const results = faceLandmarker.detectForVideo(videoElementRef.value, performance.now());

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

async function startCamera(deviceId: string) {
  const stream = await navigator.mediaDevices
    .getUserMedia({
      video: {
        deviceId
      },
    })
    .catch((err) => err) as MediaStream | Error;

  if (stream instanceof Error) {
    console.error(stream);
    return;
  }

  if (!videoElementRef.value) throw new Error("video element is undefined");

  isRunningRef.value = true;
  videoElementRef.value.srcObject = stream;
  videoElementRef.value.addEventListener("loadeddata", predictWebcam);
}

function stopCamera() {
  if (!videoElementRef.value) return;

  const stream = videoElementRef.value.srcObject as MediaStream | null;

  if (!stream) return;

  stream.getTracks().forEach((track) => track.stop());
  videoElementRef.value.srcObject = null;
}

onMounted(async () => {
  const video = videoElementRef.value;
  const canvas = canvasElementRef.value;
  const gpuCanvas = gpuCanvasElementRef.value;

  if (!video || !canvas || !gpuCanvas) {
    throw new Error("canvas or video element was not found");
  }

  faceLandmarker = await setupLandmarker(gpuCanvas);

  video?.addEventListener("loadeddata", predictWebcam);
});

onUnmounted(async () => {
  const video = videoElementRef.value;

  video?.removeEventListener("loadeddata", predictWebcam);
  faceLandmarker?.close();

  if (typeof requestAnimationFrameId !== "undefined") {
    cancelAnimationFrame(requestAnimationFrameId);
  }
});
</script>

<template>
    <Card class="aspect-video relative">
      <CardHeader>
        <div class="flex justify-between items-center">
          <CameraStatusBadge :is-active="isRunningRef" />
          <div class="text-right">
            <p class="text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
              Total Blinks Detected
            </p>
            <p class="text-2xl font-black text-foreground tabular-nums">{{ blinkCountRef }}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <video
          ref="videoElement"
          class="absolute inset-0 w-full h-full object-cover invisible"
          autoplay
          muted
          playsinline
        ></video>

        <canvas
          ref="gpuCanvasElement"
          class="absolute inset-0 w-full h-full object-cover z-10 mirror"
        ></canvas>

        <canvas
          ref="canvasElement"
          class="absolute inset-0 w-full h-full object-cover z-10 mirror"
        ></canvas>

        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-0 m-auto size-16 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm z-20"
          @click="toggleRunning"
        >
          <Play v-if="!isRunningRef" class="size-8" />
          <Pause v-else class="size-8" />
        </Button>
      </CardContent>
    </Card>
</template>

<style scoped>
.mirror {
  transform: scaleX(-1);
}
</style>
