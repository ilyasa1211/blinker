import "./main.css";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import MainView from "./MainView.vue";
import OverlayView from "./OverlayView.vue";
import { loadSettings } from "./settings.js";
import { hydrateSettings } from "./settings.js";
import { applyTheme } from "./lib/theme.js";

const routes = [
  { path: "/", component: MainView },
  { path: "/overlay", component: OverlayView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App).use(router);

// Load settings from store before mounting
loadSettings().then((settings: any) => {
  hydrateSettings(settings);
  applyTheme(settings.theme);
  app.mount("#app");
});
