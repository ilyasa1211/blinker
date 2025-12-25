<script setup lang="ts">
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import { CSSProperties, onMounted, onUnmounted, ref } from "vue";
import { drawLandmark, getLandmarker } from "../common/landmark.js";
import { resizeCanvas } from "../common/util.js";

interface Props {
  onEyesOpen: () => void;
  onEyesClose: () => void;
  thresholdEyesClose: number;
  style: CSSProperties
}

const props = defineProps<Props>();

const { onEyesClose, onEyesOpen, thresholdEyesClose, style = {} } = props;

const videoRef = ref<HTMLVideoElement>();
const canvasRef = ref<HTMLCanvasElement>();

let rafId: number | undefined = undefined;

function detectFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  faceLandmarker: FaceLandmarker,
  thresholdEyesClose: number,
  onEyesClose: () => void,
  onEyesOpen: () => void,
): void {
  const canvasRenderingContext = canvas.getContext("2d");

  if (canvasRenderingContext == null) {
    return;
  }

  // faceLandmarker.setOptions({
  //   runningMode: "VIDEO"
  // });

  const faceLandmarkerResult = faceLandmarker.detectForVideo(
    video,
    performance.now(),
  );

  canvasRenderingContext.clearRect(0, 0, canvas.width, canvas.height);
  drawLandmark(faceLandmarkerResult, canvasRenderingContext);

  const blinkEyes = faceLandmarkerResult.faceBlendshapes
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

let handleLoadedMetadata: () => void;
let faceLandmarker: FaceLandmarker | undefined = undefined;

onMounted(async () => {
  const video = videoRef.value;
  const canvas = canvasRef.value;

  if (!video || !canvas) {
    throw new Error("canvas or video element was not found");
  }

  faceLandmarker = await getLandmarker();

  const update = () => {
    (()  => {
      resizeCanvas(canvas, video.videoWidth, video.videoHeight);

      if (typeof faceLandmarker === "undefined") return;

      detectFrame(
        video,
        canvas,
        faceLandmarker,
        thresholdEyesClose,
        onEyesClose,
        onEyesOpen,
      );
    })()

    rafId = requestAnimationFrame(update);
  }

  handleLoadedMetadata = () => update();

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((mediaStream) => (video.srcObject = mediaStream));

  video?.addEventListener("loadedmetadata", handleLoadedMetadata);
});

onUnmounted(() => {
  const video = videoRef.value;

  video?.removeEventListener("loadedmetadata", handleLoadedMetadata);
  faceLandmarker?.close()

  if (typeof rafId !== "undefined") {
    cancelAnimationFrame(rafId);
  }
})

</script>

<template>
  <div className="container" :style='{ position: "relative", ...style, }'>
    <video ref="videoRef" autoPlay :style='{ display: "block", visibility: "hidden" }' />
    <canvas ref="canvasRef" :style='{ position: "absolute", top: "0px", left: "0px", }'></canvas>
  </div>
</template>