<script setup lang="ts">
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { onMounted, onUnmounted, ref } from "vue";
import { drawLandmark, setupLandmarker } from "../common/landmark.js";
import { resizeCanvas } from "../common/util.js";

interface Props {
  onEyesOpen: () => void;
  onEyesClose: () => void;
  thresholdEyesClose: number;
}

const props = defineProps<Props>();

const { onEyesClose, onEyesOpen, thresholdEyesClose } = props;

const videoElement = ref<HTMLVideoElement>();
const canvasElement = ref<HTMLCanvasElement>();

let requestAnimationFrameId: number | undefined = undefined;
let faceLandmarker: FaceLandmarker | undefined = undefined;
let lastVideoTime = -1;

const predictWebcam = (
) => {
  const canvas = canvasElement.value;
  const ctx = canvas?.getContext("2d");

  (() => {
    if (!canvas || !ctx || !faceLandmarker || !videoElement.value || lastVideoTime === videoElement.value.currentTime) return;
    resizeCanvas(canvas, videoElement.value.videoWidth, videoElement.value.videoHeight);

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
      if (blinkEyes?.every((blinkEye) => blinkEye.score >= thresholdEyesClose)) {
        onEyesClose();
      }

      // is eye's opening
      if (blinkEyes?.every((blinkEye) => blinkEye.score < thresholdEyesClose)) {
        onEyesOpen();
      }

    }
  })()

  requestAnimationFrameId = requestAnimationFrame(predictWebcam);
}

// 2. Start Camera
const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  if (!videoElement.value) throw new Error("video element is undefined");

  videoElement.value.srcObject = stream;
  videoElement.value.addEventListener("loadeddata", predictWebcam);
  // active.value = true;
};

onMounted(async () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;

  if (!video || !canvas) {
    throw new Error("canvas or video element was not found");
  }

  faceLandmarker = await setupLandmarker();
  await startCamera();

  video?.addEventListener("loadeddata", predictWebcam);
});

onUnmounted(() => {
  const video = videoElement.value;

  video?.removeEventListener("loadeddata", predictWebcam);
  faceLandmarker?.close()

  if (typeof requestAnimationFrameId !== "undefined") {
    cancelAnimationFrame(requestAnimationFrameId);
  }
})

</script>

<template>
  <video ref="videoElement" class="absolute inset-0 w-full h-full object-cover invisible" autoplay muted playsinline>
  </video>

  <canvas ref="canvasElement" class="absolute inset-0 w-full h-full object-cover z-10 bg-slate-800">
  </canvas>
</template>