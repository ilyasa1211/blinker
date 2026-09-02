<script setup lang="ts">
import type { Breakpoint } from "@/common/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import DurationInputPair from "./DurationInputPair.vue";

interface Props {
  breakpoint: Breakpoint;
  index: number;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "delete", index: number): void;
  (e: "update:interval", value: number): void;
  (e: "update:intervalUnit", value: "second" | "minute"): void;
  (e: "update:duration", value: number): void;
  (e: "update:durationUnit", value: "second" | "minute"): void;
  (e: "update:enabled", value: boolean): void;
}>();
</script>

<template>
  <Card class="p-3 space-y-2" :class="{ 'opacity-60': !breakpoint.enabled }">
    <div class="flex items-center justify-between">
      <Switch
        :checked="breakpoint.enabled"
        @update:checked="(v: boolean) => emit('update:enabled', v)"
      />
      <Button
        @click="emit('delete', index)"
        variant="destructive"
        size="icon"
        class="h-7 w-7"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </Button>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <DurationInputPair
        label="Interval"
        :value="breakpoint.interval"
        :unit="breakpoint.intervalUnit"
        :min-value="breakpoint.intervalUnit === 'second' ? 10 : undefined"
        @update:value="emit('update:interval', $event)"
        @update:unit="emit('update:intervalUnit', $event)"
      />
      <DurationInputPair
        label="Duration"
        :value="breakpoint.duration"
        :unit="breakpoint.durationUnit"
        :min-value="1"
        @update:value="emit('update:duration', $event)"
        @update:unit="emit('update:durationUnit', $event)"
      />
    </div>
  </Card>
</template>
