<script setup lang="ts">

import { ref } from "vue";
import Camera from "./components/Camera.vue";

/**
 * Show overlay window
 */
function showOverlay() {
  window.api?.showOverlay();
}

/**
 * Hide overlay window
 */
function hideOverlay() {
  window.api?.hideOverlay();
}
// State
const THRESHOLD_EYES_CLOSE = 0.3;
const active = ref(false);
const blinkCount = ref(0);
const blinkTimeout = ref(0.5);
const breakpoints = ref([
  { interval: 60, duration: 5 }
]);
const timeoutId = ref<number | undefined | NodeJS.Timeout>(undefined);
const isEyesCloseRef = ref<boolean>(false);

// Methods
const addBreakpoint = () => {
  breakpoints.value.push({ interval: 0, duration: 0 });
};

const removeBreakpoint = (index) => {
  breakpoints.value.splice(index, 1);
};

const removeTimeout = () => {
  clearTimeout(timeoutId.value);
}

const resetTimeout = (callback: () => void) => {
  clearTimeout(timeoutId.value);
  timeoutId.value = setTimeout(
    callback,
    blinkTimeout.value * 1000,
  );
}

const incrementBlinkCounter = () => {
  blinkCount.value++;
}

const handleEyesClose = () => {
  if (!isEyesCloseRef.value) {
    isEyesCloseRef.value = true;
    incrementBlinkCounter();
  }

  if (!active.value) return;

  hideOverlay();
  removeTimeout();
}

const handleEyesOpen = () => {
  if (isEyesCloseRef.value) {
    isEyesCloseRef.value = false;

    if (!active.value) return;

    resetTimeout(showOverlay);
  }
}

const handleActivation = () => {
  if (active.value) {
    hideOverlay();
    removeTimeout();
  } else {
    resetTimeout(showOverlay);
  }

  active.value = !active.value;
};

</script>

<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

      <div class="lg:col-span-8 space-y-6">
        <div
          class="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-slate-700 shadow-2xl flex items-center justify-center">
          <div class="text-slate-600 text-center">
            <div class="text-6xl mb-4">🎭</div>
            <p class="text-sm tracking-widest uppercase">Video Feed Canvas</p>
          </div>
          <!-- <div class="absolute top-5 left-5 z-10">
            <div
              :class="active ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'"
              class="px-4 py-1.5 rounded-full border backdrop-blur-md text-sm font-bold flex items-center gap-2">
              <span class="relative flex h-2 w-2">
                <span v-if="active"
                  class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2"
                  :class="active ? 'bg-green-500' : 'bg-red-500'"></span>
              </span>
              {{ active ? 'LIVE TRACKING' : 'SYSTEM PAUSED' }}
            </div>
          </div> -->

          <Camera v-on:eyes-close="handleEyesClose" v-on:eyes-open="handleEyesOpen" :threshold-eyes-close="THRESHOLD_EYES_CLOSE" />
        </div>

        <div
          class="bg-slate-800/50 border border-slate-700 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div class="text-center md:text-left">
            <p class="text-slate-400 text-xs uppercase tracking-[0.2em] font-bold mb-1">Total Blinks Detected</p>
              <h2 :key="blinkCount" class="text-7xl font-black text-white tabular-nums">
                {{ blinkCount }}
              </h2>
          </div>
          <button @click="handleActivation"
            :class="active ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20'"
            class="w-full md:w-auto px-10 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl">
            {{ active ? 'Stop Session' : 'Start Session' }}
          </button>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-6">
        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
          <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-6">Configuration</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-400 mb-2">Blink Timeout (Seconds)</label>
              <input type="number" step="0.1" v-model="blinkTimeout" 
                class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
            </div>
          </div>
        </div>

        <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl h-fit">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest">Breakpoints</h3>
            <button @click="addBreakpoint"
              class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors">
              + Add New
            </button>
          </div>

          <div class="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div v-for="(bp, index) in breakpoints" :key="index" class="flex gap-2 items-center group">
              <div class="grid grid-cols-2 gap-2 flex-1">
                <div class="relative">
                  <input type="number" v-model="bp.interval" placeholder="Int"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" />
                  <span class="absolute right-2 top-2 text-[10px] text-slate-500">sec</span>
                </div>
                <div class="relative">
                  <input type="number" v-model="bp.duration" placeholder="Dur"
                    class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm focus:border-indigo-500 outline-none" />
                  <span class="absolute right-2 top-2 text-[10px] text-slate-500">sec</span>
                </div>
              </div>
              <button @click="removeBreakpoint(index)"
                class="p-2 text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>

            <p v-if="breakpoints.length === 0" class="text-center text-slate-500 text-sm py-4 italic">
              No breakpoints added yet.
            </p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Scrollbar Styling */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 10px;
}
</style>
