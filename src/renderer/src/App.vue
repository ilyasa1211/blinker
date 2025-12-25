<script setup lang="ts">

import { ref } from "vue";
import Camera from "./components/Camera.vue";

const THRESHOLD_EYES_CLOSE = 0.3; // eyes open

function showOverlay() {
  window.api?.showOverlay();
}

function hideOverlay() {
  window.api?.hideOverlay();
}

const timeoutId = ref<number | undefined | NodeJS.Timeout>(undefined);
const blinkCount = ref<number>(0);
const isEyesCloseRef = ref<boolean>(false);
const isActive = ref<boolean>(false);
const timeoutSinceLastBlinkSecond = ref<number>(0.5); // 0.5 seconds

const removeTimeout = () => {
  clearTimeout(timeoutId.value);
}

const resetTimeout = (callback: () => void) => {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(
    callback,
    timeoutSinceLastBlinkSecond.value * 1000,
  );
}

const incrementBlinkCounter = () => {
  blinkCount.value = blinkCount.value++
}

const handleEyesClose = () => {
  if (isEyesCloseRef.value == false) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!isActive) return;

  hideOverlay();
  removeTimeout();
}

const handleEyesOpen = () => {
  if (isEyesCloseRef.value == true) {
    isEyesCloseRef.value = false;

    if (!isActive) return;

    resetTimeout(showOverlay);
  }
}

const handleActivation = () => {
  if (isActive) {
    hideOverlay();
    removeTimeout();
  } else {
    resetTimeout(showOverlay);
  }

  isActive.value = !isActive;
};

const handleTimeoutChange = (e: Event) => {
  timeoutSinceLastBlinkSecond.value = Number((e.target as HTMLInputElement).value);
};

</script>

<template>
  <main>
    <Camera v-on:eyesClose="handleEyesClose" v-on:EyesOpen="handleEyesOpen" :thresholdEyesClose="THRESHOLD_EYES_CLOSE" :style='{
      backgroundColor: "dimgray",
    }' />
    <div :style='{ padding: "1rem", fontSize: "1.5rem", color: "white", backgroundColor: "rgba(0, 0, 0, 0.5)", }'>
      <p>Blink count: {{blinkCount}}</p>
    </div>
    <div v-on:click="handleActivation">
      <input type="checkbox" name="Active" id="activate_checkbox" :checked="isActive" :style='{ padding: "1rem", }' />
      <label htmlFor="activated_checkbox" :style='{ padding: "1rem", fontSize: "1.5rem", }'>
        Active
      </label>
    </div>
    <div>
      <input :style='{ padding: "1rem", fontSize: "1.5rem", }' type="number" name="timeout"
        id="timeout_since_last_blink" min="0.2" max="2" step="0.1" :value="timeoutSinceLastBlinkSecond"
        v-on:change="handleTimeoutChange" />
      <label htmlFor="timeout_since_last_blink" :style='{ padding: "1rem", fontSize: "1.5rem", }'>
        Blink Timeout (Second)
      </label>
    </div>
  </main>
</template>