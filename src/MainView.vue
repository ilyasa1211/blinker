<script setup lang="ts">
import Breakpoint from "./components/Breakpoint.vue";
import Camera from "./components/Camera.vue";
import Settings from "./components/Settings.vue";
</script>
<template>
  <div class="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8 font-sans">
    <div class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Camera />

      <div class="lg:col-span-4 space-y-6">
        <Settings />
        <Breakpoint />
      </div>
    </div>
  </div>
</template>
