<script setup lang="ts">
import { onMounted, onUnmounted, watch, reactive, computed } from "vue";
import audioSrc from "../assets/sounds/solemn-522.ogg";
import { startBreak as callBreak, stopBreak as callStopBreak } from "../common/api.js";
import type { Breakpoint } from "../common/types.js";
import { getRandomId, toMs } from "../common/utils.js";
import { defaultSettings as settings } from "../settings.js";
import { permissionGranted, showNotification } from "@/lib/notification.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import BreakpointItem from "./BreakpointItem.vue";

const breakIntervals = new Map<string, number>();
const notificationIntervals = new Map<string, number>();
const state = reactive({ isBreak: false });

const allEnabled = computed({
  get: () => settings.breakpoints.length > 0 && settings.breakpoints.every((bp) => bp.enabled),
  set: (value: boolean) => {
    settings.breakpoints.forEach((bp) => {
      bp.enabled = value;
    });
  },
});

function addBreakpoint() {
  settings.breakpoints.push({
    id: getRandomId(),
    interval: 60,
    intervalUnit: "minute",
    duration: 30,
    durationUnit: "minute",
    enabled: true,
  });
}

function showBreakNotification(sec: number) {
  const title = "Break is coming!";
  const body = `Break in ${sec}s`;

  showNotification(title, body);
}

function removeBreakpoint(index: number) {
  const bp = settings.breakpoints.splice(index, 1).at(0);
  if (bp) {
    stopBreakpoint(bp.id);
  }
}

function startBreak(ms: number) {
  state.isBreak = true;
  callBreak(ms);
}

function playAudio() {
  new Audio(audioSrc).play();
}

function stopBreak() {
  playAudio();
  callStopBreak();
}

function startBreakpoint(bp: Breakpoint) {
  // 1. Clear any existing logic for this ID
  stopBreakpoint(bp.id);

  const intervalMs = toMs(bp.interval, bp.intervalUnit);
  const durationMs = toMs(bp.duration, bp.durationUnit);
  const notifyBeforeSecond = settings.notifyBeforeSecond;

  // 2. Define the recursive "loop"
  const runCycle = () => {
    state.isBreak = false;

    // only notify if interval is greater than notificationBeforeSecond
    if (intervalMs > notifyBeforeSecond * 1000) {
      const notificationTimeoutId = window.setTimeout(
        () => showBreakNotification(notifyBeforeSecond),
        intervalMs - notifyBeforeSecond * 1000,
      );

      notificationIntervals.set(bp.id, notificationTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      // A. Trigger the break UI
      startBreak(durationMs);

      // B. Schedule the NEXT work interval ONLY after the break duration is finished
      // This effectively "pauses" the tracking during the break
      const pauseId = window.setTimeout(() => {
        stopBreak();
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
    notificationIntervals.delete(id);
  }
}

watch(
  () => settings.breakpoints,
  (newBps, oldBps) => {
    const newIds = new Set(newBps.map((b: Breakpoint) => b.id));

    newBps.forEach((bp: Breakpoint) => {
      if (bp.enabled) {
        startBreakpoint(bp);
      } else {
        stopBreakpoint(bp.id);
      }
    });

    oldBps?.forEach((bp: Breakpoint) => {
      if (!newIds.has(bp.id)) {
        stopBreakpoint(bp.id);
      }
    });
  },
  { deep: true, immediate: true },
);
onMounted(async () => {
  const isGranted = await permissionGranted();

  if (!isGranted) {
    console.error("Failed to have notification permission");
  }
});

onUnmounted(() => {
  for (const bp of settings.breakpoints) {
    stopBreakpoint(bp.id);
  }
});
</script>

<template>
  <Card class="h-fit">
    <CardHeader>
      <div class="flex justify-between items-center">
        <CardTitle>Breakpoints</CardTitle>
        <div class="flex items-center gap-3">
          <Switch
            v-model:model-value="allEnabled"
          />
          <Button
            @click="addBreakpoint"
            variant="outline"
            size="sm"
            class="text-xs"
          >
            + Add New
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="space-y-3 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
        <BreakpointItem
          v-for="(bp, index) in settings.breakpoints"
          :key="bp.id"
          :breakpoint="bp"
          :index="index"
          @delete="removeBreakpoint"
          @update:interval="bp.interval = $event"
          @update:intervalUnit="bp.intervalUnit = $event"
          @update:duration="bp.duration = $event"
          @update:durationUnit="bp.durationUnit = $event"
          @update:enabled="bp.enabled = $event"
        />

        <p
          v-if="settings.breakpoints.length === 0"
          class="text-center text-muted-foreground text-sm py-4 italic"
        >
          No breakpoints added yet.
        </p>
      </div>
    </CardContent>
  </Card>
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
  background: var(--border);
  border-radius: 10px;
}
</style>
