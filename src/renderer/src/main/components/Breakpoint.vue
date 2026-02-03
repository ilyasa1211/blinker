<script setup lang="ts">
import { watch } from 'vue';
import { Breakpoint } from '../common/types.js';
import { getRandomId, toMs, startBreak as callBreak, stopBreak } from '../common/utils.js';
import { state } from '../state.js';

const breakIntervals = new Map<string, number>();
const notificationIntervals = new Map<string, number>();
const notificationBeforeSecond = 20; // notify 30s before the break

function addBreakpoint() {
  state.breakpoints.push({
    id: getRandomId(),
    interval: 60,
    intervalUnit: "minute",
    duration: 30,
    durationUnit: "minute",
  });
};

function showBreakNotification() {
  new Notification("Break is coming!", {
    body: `Break in ${notificationBeforeSecond}s`
  });
}

function removeBreakpoint(index: number) {
  const bp = state.breakpoints.splice(index, 1).at(0);
  if (bp) {
    stopBreakpoint(bp.id);
  }
};

function startBreak(ms: number) {
  state.isBreak = true;
  callBreak(ms)
}

function startBreakpoint(bp: Breakpoint) {
  // 1. Clear any existing logic for this ID
  stopBreakpoint(bp.id);

  const intervalMs = toMs(bp.interval, bp.intervalUnit);
  const durationMs = toMs(bp.duration, bp.durationUnit);

  // 2. Define the recursive "loop"
  const runCycle = () => {
    state.isBreak = false;

    // only notify if interval is greater than notificationBeforeSecond
    if (intervalMs > notificationBeforeSecond * 1000) {
      const notificationTimeoutId = window.setTimeout(() => showBreakNotification(), intervalMs - notificationBeforeSecond * 1000);

      notificationIntervals.set(bp.id, notificationTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      // A. Trigger the break UI
      startBreak(durationMs);

      // B. Schedule the NEXT work interval ONLY after the break duration is finished
      // This effectively "pauses" the tracking during the break
      const pauseId = window.setTimeout(() => {
        stopBreak()
        runCycle();
      }, durationMs);

      // Track the pause timeout so we can cancel it if needed
      breakIntervals.set(bp.id, pauseId);
    }, intervalMs);

    // Track the work timeout
    breakIntervals.set(bp.id, timeoutId);
  };

  // 3. Kick off the first cycle
  runCycle();
}

function stopBreakpoint(id: string) {
  const timeoutId = breakIntervals.get(id);
  const notificationTimeoutId = notificationIntervals.get(id);

  if (timeoutId) {
    window.clearTimeout(timeoutId); // Works for both work and pause timeouts
    breakIntervals.delete(id);
  }

  if (notificationTimeoutId) {
    window.clearTimeout(notificationTimeoutId);
    notificationIntervals.delete(id)
  }
}

watch(
  () => state.breakpoints,
  (newBps, oldBps) => {
    const newIds = new Set(newBps.map((b) => b.id));

    // start or update
    newBps.forEach((bp) => {
      startBreakpoint(bp);
    });

    // stop removed breakpoints
    oldBps?.forEach((bp) => {
      if (!newIds.has(bp.id)) {
        stopBreakpoint(bp.id);
      }
    });
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl h-fit">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest">Breakpoints</h3>
      <button @click="addBreakpoint"
        class="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-colors">
        + Add New
      </button>
    </div>

    <div class="space-y-3 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
      <div v-for="(bp, index) in state.breakpoints" :key="index"
        class="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 space-y-3 group relative">

        <button @click="removeBreakpoint(index)"
          class="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg z-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" />
          </svg>
        </button>

        <div>
          <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Interval</label>
          <div class="flex">
            <input type="number" v-model="bp.interval" :min="bp.intervalUnit === 'second' ? 10 : undefined"
              class="flex-1 bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
            <select v-model="bp.intervalUnit"
              class="bg-slate-700 border border-slate-700 rounded-r-xl px-2 py-2 text-xs font-semibold text-indigo-300 outline-none cursor-pointer border-l-0">
              <option value="second">Sec</option>
              <option value="minute">Min</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Duration</label>
          <div class="flex">
            <input type="number" v-model="bp.duration" min="1"
              class="flex-1 bg-slate-800 border border-slate-700 rounded-l-xl px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
            <select v-model="bp.durationUnit"
              class="bg-slate-700 border border-slate-700 rounded-r-xl px-2 py-2 text-xs font-semibold text-emerald-300 outline-none cursor-pointer border-l-0">
              <option value="second">Sec</option>
              <option value="minute">Min</option>
            </select>
          </div>
        </div>
      </div>

      <p v-if="state.breakpoints.length === 0" class="text-center text-slate-500 text-sm py-4 italic">
        No breakpoints added yet.
      </p>
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
