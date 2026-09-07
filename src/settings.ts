import { reactive, watch } from "vue";
import { DEFAULT_SETTINGS, saveSettings, type Settings } from "./common/settings-manager.js";

// Initialize with defaults; will be hydrated on app startup
export const defaultSettings = reactive<Settings>(structuredClone(DEFAULT_SETTINGS));

/**
 * Watch for changes to settings and save them to the store (debounced)
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

watch(
  defaultSettings,
  (newSettings) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveSettings(newSettings);
    }, 500); // Debounce saves by 500ms
  },
  { deep: true },
);

/**
 * Hydrate settings from the store
 */
export async function hydrateSettings(loadedSettings: Settings) {
  Object.assign(defaultSettings, loadedSettings);
}

// Re-export for main.ts
export { loadSettings } from "./common/settings-manager.js";
