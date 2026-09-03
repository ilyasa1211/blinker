<script setup lang="ts">
import { ref } from "vue";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  devices: MediaDeviceInfo[];
  modelValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "change", value: string): void;
}>();

const selectedValue = ref(props.modelValue);

const handleValueChange = (value: any) => {
  if (value !== null && value !== undefined) {
    const stringValue = String(value);
    selectedValue.value = stringValue;
    emit("update:modelValue", stringValue);
    emit("change", stringValue);
  }
};
</script>

<template>
  <div class="flex flex-col gap-3">
    <Label for="camera-device">Camera Device</Label>
    <Select :model-value="selectedValue" @update:model-value="handleValueChange">
      <SelectTrigger id="camera-device">
        <SelectValue :placeholder="`Camera (${devices.length} found)`" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="device in devices" :key="device.deviceId" :value="device.deviceId">
          {{ device.label || `Camera ${device.deviceId.slice(0, 5)}` }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
