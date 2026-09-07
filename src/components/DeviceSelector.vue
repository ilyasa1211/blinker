<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const emit = defineEmits<{
  (e: "deviceChange", value: string): void;
}>();


const devicesRef = ref<MediaDeviceInfo[]>([]);
const selectedValue = ref<string>("");

const handleValueChange = (value: any) => {
  console.log("SHSSSOULD WORK: ", value)
  if (value !== null && value !== undefined) {
    const stringValue = String(value);
    selectedValue.value = stringValue;
    emit("deviceChange", stringValue);
  }
};

async function getCameras() {
  const allDevices = await navigator.mediaDevices.enumerateDevices();

  return allDevices.filter((device) => device.kind === "videoinput");
}

async function requestCameraPermission() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  stream.getVideoTracks().forEach(t => t.stop());
}

onMounted(async () => {
  await requestCameraPermission();
  devicesRef.value = await getCameras();

  if (devicesRef.value.length > 0) {
    handleValueChange(devicesRef.value[0].deviceId);
  }
});

</script>

<template>
  <!-- <div class="flex flex-col gap-3"> -->
    <Card>
      <CardHeader>
        <CardTitle>Device Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Label for="camera-device">Camera Device</Label>
        <Select :model-value="selectedValue" @update:model-value="handleValueChange">
          <SelectTrigger id="camera-device">
            <SelectValue :placeholder="`Camera (${devicesRef.length} found)`" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="device in devicesRef" :key="device.deviceId" :value="device.deviceId">
              {{ device.label || `Camera ${device.deviceId.slice(0, 5)}` }}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  <!-- </div> -->
</template>
