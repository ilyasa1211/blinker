<script setup lang="ts">
import { ref } from "vue";
import Breakpoint from "./components/Breakpoint.vue";
import Camera from "./components/Camera.vue";
import DeviceSelector from "./components/DeviceSelector.vue";
import Settings from "./components/Settings.vue";

const selectedDeviceIdRef = ref("");
</script>

<template>
  <div class="min-h-screen bg-background text-foreground p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div class="lg:col-span-8 space-y-6">
        <Camera :selected-device-id="selectedDeviceIdRef" />
        <DeviceSelector @device-change="(value) => (selectedDeviceIdRef = value)" />
      </div>

      <div class="lg:col-span-4 space-y-6">
        <Settings />
        <Breakpoint />
      </div>
    </div>
  </div>
</template>
