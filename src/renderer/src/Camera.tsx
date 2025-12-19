import {
  DrawingUtils,
  FaceLandmarker,
  type FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { JSX, useEffect, useRef, useState } from "react";
import task from "/task-vision/face_landmarker.task?url";

async function loadModel() {
  const resolver = await FilesetResolver.forVisionTasks(
    import.meta.env.BASE_URL + "task-vision/wasm",
  );
  const landmarker = await FaceLandmarker.createFromOptions(resolver, {
    baseOptions: {
      delegate: "GPU",
      modelAssetPath: task,
    },
    runningMode: "VIDEO",
    outputFaceBlendshapes: true,
    numFaces: 1,
  });

  return landmarker;
}

function drawLandMark(
  results: FaceLandmarkerResult,
  context: CanvasRenderingContext2D | null,
) {
  if (!context) return;

  const drawingUtils = new DrawingUtils(context);
  for (const landmarks of results.faceLandmarks) {
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      {
        color: "#C0C0C070",
        lineWidth: 1,
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
      {
        color: "#FF3030",
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
      {
        color: "#FF3030",
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
      {
        color: "#30FF30",
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
      {
        color: "#30FF30",
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
      {
        color: "#E0E0E0",
      },
    );
    drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, {
      color: "#E0E0E0",
    });
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
      {
        color: "#FF3030",
      },
    );
    drawingUtils.drawConnectors(
      landmarks,
      FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
      {
        color: "#30FF30",
      },
    );
  }
}

function detectFrame(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  faceLandmarker: FaceLandmarker,
  minThresholdBeforeEyesOpen: number,
  maxThresholdBeforeEyesClose: number,
  onEyesClose: () => void,
  onEyesOpen: () => void,
): void {
  const canvasRenderingContext = canvas.getContext("2d");

  if (canvasRenderingContext == null) {
    return;
  }

  const faceLandmarkerResult = faceLandmarker.detectForVideo(
    video,
    performance.now(),
  );

  canvasRenderingContext.clearRect(0, 0, canvas.width, canvas.height);
  drawLandMark(faceLandmarkerResult, canvasRenderingContext);

  const blinkEyes = faceLandmarkerResult.faceBlendshapes
    .at(0)
    ?.categories.filter(
      (cat) =>
        cat.categoryName === "eyeBlinkLeft" ||
        cat.categoryName === "eyeBlinkRight",
    );

  // is eye's closing
  if (blinkEyes?.every((eye) => eye.score > maxThresholdBeforeEyesClose)) {
    onEyesClose();
  }

  // is eye's opening
  if (blinkEyes?.every((eye) => eye.score < minThresholdBeforeEyesOpen)) {
    onEyesOpen();
  }
}

export function Camera({
  onEyesClose,
  onEyesOpen,
  maxThresholdBeforeEyesClose,
  minThresholdBeforeEyesOpen,
}: {
  onEyesOpen: () => void;
  onEyesClose: () => void;
  maxThresholdBeforeEyesClose: number;
  minThresholdBeforeEyesOpen: number;
}): JSX.Element {
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(
    null,
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      console.error("canvas or video element was not found");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((mediaStream) => (video.srcObject = mediaStream));

    let isCanvasReady = false;
    let rafId: number | undefined = undefined;

    const resizeCanvas = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      isCanvasReady = true;
    };

    const detectVideo = () => {
      if (isCanvasReady && faceLandmarker !== null) {
        detectFrame(
          video,
          canvas,
          faceLandmarker,
          minThresholdBeforeEyesOpen,
          maxThresholdBeforeEyesClose,
          onEyesClose,
          onEyesOpen,
        );
      }

      rafId = requestAnimationFrame(detectVideo);
    };

    const handleLoadedMetadata = () => {
      resizeCanvas();
      rafId = requestAnimationFrame(detectVideo);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return function () {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      if (typeof rafId !== "undefined") {
        cancelAnimationFrame(rafId);
      }
    };
  }, [
    faceLandmarker,
    minThresholdBeforeEyesOpen,
    maxThresholdBeforeEyesClose,
    onEyesClose,
    onEyesOpen,
  ]);

  useEffect(() => {
    loadModel().then((m) => setFaceLandmarker(m));
  }, []);

  return (
    <div
      className="container"
      style={{
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        style={{
          display: "block",
          visibility: "hidden",
        }}
      />
      <canvas
        style={{
          position: "absolute",
          top: "0px",
          left: "0px",
        }}
        ref={canvasRef}
      ></canvas>
    </div>
  );
}
