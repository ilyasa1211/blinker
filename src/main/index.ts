import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import icon from "../../resources/icon.png?asset";

function createWindow({
  onClose = () => void 0,
}: {
  onClose?: () => void;
} = {}): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.on("close", onClose);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

function createOverlay() {
  const overlayWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    // alwaysOnTop: true,
    show: false,
    skipTaskbar: true,
    resizable: false,
    transparent: false, // set true if you want transparent overlay
  });

  overlayWindow.on("ready-to-show", () => {
    overlayWindow.hide();
  });

  overlayWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    overlayWindow?.loadURL(
      `${process.env["ELECTRON_RENDERER_URL"]}/overlay.html`,
    );
  } else {
    overlayWindow?.loadFile(join(__dirname, "../renderer/overlay.html"));
  }

  return {
    hide: () => overlayWindow?.hide(),
    show: () => overlayWindow?.show(),
    exit: () => overlayWindow?.close(),
  };
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId("com.blinker");

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  const { hide, show, exit } = createOverlay();
  createWindow({ onClose: exit });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));
  ipcMain.on("hide-overlay", hide);
  ipcMain.on("show-overlay", show);

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
