<script setup lang="ts">
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HTMLAttributes } from "vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

const unitOptions = ["second", "minute"] as const;

const emit = defineEmits<{
  (e: "update:value", payload: number): void;
  (e: "update:unit", payload: (typeof unitOptions)[number]): void;
}>();
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
        class="flex-1 rounded-r-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      <Select
        :default-value="unit"
        @update:model-value="(value) => emit('update:unit', value as (typeof unitOptions)[number])"
      >
        <SelectTrigger>
          <SelectValue placeholder="Sec" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in unitOptions" :key="opt" :value="opt">
            {{ opt === "second" ? "Sec" : "Min" }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
