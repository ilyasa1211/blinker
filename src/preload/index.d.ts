import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      showOverlay(): void;
      hideOverlay(): void;
      startBreak(durationMs: number): void;
      onBreak(cb: (durationMs: number) => void): void;
    };
  }
}
