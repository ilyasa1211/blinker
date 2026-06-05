import "./main.css";
import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import MainView from "./MainView.vue";
import OverlayView from "./OverlayView.vue";

const routes = [
  { path: "/", component: MainView },
  { path: "/overlay", component: OverlayView },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

createApp(App).use(router).mount("#app");
