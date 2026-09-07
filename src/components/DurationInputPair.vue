<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HTMLAttributes } from "vue";

interface Props {
  label: string;
  value: number;
  unit: "second" | "minute";
  minValue?: number;
  step?: number;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  minValue: 1,
  step: 1,
});

const emit = defineEmits<{
  (e: "update:value", payload: number): void;
  (e: "update:unit", payload: "second" | "minute"): void;
}>();

const unitOptions = ["second", "minute"] as const;
</script>

<template>
  <div :class="props.class">
    <Label>{{ label }}</Label>
    <div class="flex mt-2">
      <Input
        type="number"
        :model-value="value"
        @update:model-value="(val) => emit('update:value', Number(val))"
        :min="minValue"
        :step="step"
        class="flex-1 rounded-r-none"
      />
      <select
        :value="unit"
        @change="
          (e) => emit('update:unit', (e.target as HTMLSelectElement).value as 'second' | 'minute')
        "
        class="bg-background border-border rounded-r-xl px-2 py-2 text-xs font-semibold text-foreground outline-none cursor-pointer border-l-0"
      >
        <option v-for="opt in unitOptions" :key="opt" :value="opt">
          {{ opt === "second" ? "Sec" : "Min" }}
        </option>
      </select>
    </div>
  </div>
</template>
