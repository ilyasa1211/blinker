import {
  DrawingUtils,
  FaceLandmarker,
  type FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import task from "/task-vision/face_landmarker.task?url";

let landmarker: FaceLandmarker | undefined = undefined;

export async function setupLandmarker() {
  if (typeof landmarker !== "undefined") return landmarker;

  const resolver = await FilesetResolver.forVisionTasks(
    import.meta.env.BASE_URL + "task-vision/wasm",
  );

  landmarker = await FaceLandmarker.createFromOptions(resolver, {
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

export function drawLandmark(
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