export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  canvas.width = width;
  canvas.height = height;
}

export function getRandomId() {
  return Math.random().toString();
}

export function toMs(value: number, unit: "minute" | "second") {
  return unit === "minute" ? value * 60 * 1000 : value * 1_000;
}
