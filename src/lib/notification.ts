import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

async function permissionGranted() {
  const granted = await isPermissionGranted();

  if (!granted) {
    const permission = await requestPermission();
    return permission === "granted";
  }

  return granted;
}

function showNotification(title: string, body: string) {
  sendNotification({
    title,
    body,
  });
}

export { permissionGranted, showNotification };
