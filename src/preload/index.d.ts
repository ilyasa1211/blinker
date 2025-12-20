import { ElectronAPI } from "@electron-toolkit/preload";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      showOverlay(): void;
      hideOverlay(): void;
    };
  }
}
