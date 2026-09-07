import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LazyStore } from "@tauri-apps/plugin-store";

const OVERLAY_WINDOW_LABEL = "overlay";
const START_BREAK_EVENT = "break:start";
const STOP_BREAK_EVENT = "break:stop";

export function getStore() {
  return new LazyStore("settings.json");
}

let _overlayWindow: WebviewWindow | null = null;

async function getOverlayWindow() {
  if (_overlayWindow) {
    return _overlayWindow;
  }

  const window = await WebviewWindow.getByLabel(OVERLAY_WINDOW_LABEL);

  if (!window) {
    console.error(`failed to get window with label: ${OVERLAY_WINDOW_LABEL}`);
  }

  _overlayWindow = window;

  return window;
}

export async function showOverlay() {
  const overlay = await getOverlayWindow();

  if (overlay) {
    await overlay.show();
    await overlay.setFocus();
    await overlay.setAlwaysOnTop(true);
  }
}

export async function hideOverlay() {
  const overlay = await getOverlayWindow();

  if (overlay) {
    await overlay.hide();
  }
}

export function stopBreak() {
  emitTo(OVERLAY_WINDOW_LABEL, STOP_BREAK_EVENT);
  hideOverlay();
}

export async function onBreakStop(callback: (...args: any[]) => any): Promise<() => void> {
  const appWebview = getCurrentWebviewWindow();

  return appWebview.listen<void>(STOP_BREAK_EVENT, (event) => {
    callback(event.payload);
  });
}

export function startBreak(ms: number) {
  emitTo(OVERLAY_WINDOW_LABEL, START_BREAK_EVENT, ms);
  showOverlay();
}

export async function onBreakStart(callback: (...args: any[]) => any): Promise<() => void> {
  const appWebview = getCurrentWebviewWindow();

  return appWebview.listen<number>(START_BREAK_EVENT, (event) => {
    callback(event.payload);
  });
}
