<script setup lang="ts">
import { computed, ref } from "vue";

const isBreak = ref<boolean>(false);
const progress = ref(0);
const timeLeftMs = ref(0);

// Computed to show seconds formatted nicely (e.g. 5s)
const secondsRemaining = computed(() => Math.ceil(timeLeftMs.value / 1000));

function startCountdown(durationMs: number) {
  const start = performance.now();
  timeLeftMs.value = durationMs;

  function frame(now: number) {
    const elapsed = now - start;
    timeLeftMs.value = Math.max(durationMs - elapsed, 0);

    // Smooth progress calculation
    progress.value = Math.min((elapsed / durationMs) * 100, 100);

    if (progress.value < 100) {
      requestAnimationFrame(frame);
    } else {
      isBreak.value = false;
      progress.value = 0;
      window.api?.hideOverlay();
    }
  }

  requestAnimationFrame(frame);
}

window.api?.onBreak((durationMs: number) => {
  isBreak.value = true;
  startCountdown(durationMs);
});
</script>

<template>
  <div
    class="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center relative overflow-hidden font-sans">

    <div v-if="isBreak" class="absolute inset-0 bg-indigo-600/5 animate-pulse"></div>

    <div class="w-full max-w-5xl px-12 z-10">
      <transition name="fade-up" mode="out-in">
        <div v-if="isBreak" class="flex flex-col items-center gap-16">

          <div class="text-center space-y-4">
            <h1 class="text-7xl md:text-9xl font-black tracking-tighter text-white animate-soft-pulse">
              Take a break
            </h1>
            <p class="text-indigo-400/60 text-xl md:text-2xl font-light tracking-[0.4em] uppercase">
              Rest your eyes
            </p>
          </div>

          <div class="w-full space-y-8">
            <div class="relative h-4 bg-slate-900 rounded-full border border-white/5 shadow-2xl overflow-hidden">
              <div
                class="h-full bg-linear-to-r from-indigo-600 via-blue-400 to-indigo-600 bg-[length:200%_auto] animate-shimmer"
                :style="{ width: progress + '%' }"></div>
            </div>

            <div class="flex justify-center items-center gap-4 font-mono text-sm">
              <div class="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl">
                <span class="text-slate-500 mr-2">PROGRESS</span>
                <span class="text-white tabular-nums">{{ Math.round(progress) }}%</span>
              </div>

              <div class="bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 rounded-2xl shadow-xl">
                <span class="text-indigo-400 mr-2">REMAINING</span>
                <span class="text-indigo-300 tabular-nums">{{ secondsRemaining }}s</span>
              </div>
            </div>
          </div>

        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* Shimmering effect on the bar fill */
@keyframes shimmer {
  to {
    background-position: 200% center;
  }
}

.animate-shimmer {
  animation: shimmer 2.5s linear infinite;
}

/* Soft scale pulse for the heading */
@keyframes soft-pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.015);
  }
}

.animate-soft-pulse {
  animation: soft-pulse 4s ease-in-out infinite;
}

/* Transition for the whole UI appearing/disappearing */
.fade-up-enter-active {
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(60px) scale(0.98);
}

</style>