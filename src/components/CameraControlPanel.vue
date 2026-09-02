<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { defaultSettings as settings } from "../settings.js";

interface Props {
  blinkCount: number;
  isSessionActive: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "toggle-session"): void;
}>();
</script>

<template>
  <Card class="p-8">
    <CardContent class="flex flex-col md:flex-row justify-between items-center gap-6 p-0">
      <!-- Blink Counter -->
      <div class="text-center md:text-left">
        <p class="text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold mb-1">
          Total Blinks Detected
        </p>
        <h2 :key="blinkCount" class="text-7xl font-black text-foreground tabular-nums">
          {{ blinkCount }}
        </h2>
      </div>

      <div class="flex flex-col items-center gap-3">
        <!-- Single Control Button -->
        <Button
          size="lg"
          :variant="isSessionActive ? 'destructive' : 'default'"
          @click="emit('toggle-session')"
        >
          {{ isSessionActive ? "Stop" : "Start" }}
        </Button>

        <!-- Auto-start toggle -->
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <Checkbox
            :checked="settings.autoStartSession"
            @update:checked="(v: boolean) => settings.autoStartSession = v"
          />
          <span class="text-xs text-muted-foreground">Auto-start on launch</span>
        </label>
      </div>
    </CardContent>
  </Card>
</template>
