import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      showOverlay(): void;
      hideOverlay(): void;
      startBreak(durationMs: number): void;
      stopBreak(): void;
      startBreak(): void;
      onBreakStart(cb: (durationMs: number) => void): void;
      onBreakStop(cb: () => void): void;
    };
  }
}
