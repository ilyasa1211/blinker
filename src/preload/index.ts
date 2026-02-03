import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

console.log("Preload loaded for window:", location.href);

// Custom APIs for renderer
const api = {
  showOverlay() {
    ipcRenderer.send("overlay:show");
  },
  hideOverlay() {
    ipcRenderer.send("overlay:hide");
  },
  startBreak(durationMs: number) {
    ipcRenderer.send("break:start", durationMs);
  },
  stopBreak() {
    ipcRenderer.send("break:stop");
  },
  onBreakStart(cb: (durationMs: number) => void) {
    ipcRenderer.on("break:start", (_event, value: number) => cb(value));
  },
  onBreakStop(cb: () => void) {
    ipcRenderer.on("break:stop", () => cb());
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.electron = electronAPI;
  // @ts-expect-error (define in dts)
  window.api = api;
}
