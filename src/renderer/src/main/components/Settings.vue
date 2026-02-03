<script setup lang="ts">
import { settings } from '../settings.js';
</script>
<template>
  <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
    <h3 class="text-indigo-400 font-bold uppercase text-xs tracking-widest mb-6">Configuration</h3>
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-400 mb-2">Blink Timeout (Seconds)</label>
        <input type="number" v-model="settings.blinkTimeout" min="0.2" max="2" step="0.1"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-400 mb-2">Threshold Eyes Closed (higher)</label>
        <input type="number" v-model="settings.thresholdEyesClosed" min="0.1" max="1" step="0.05"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-400 mb-2">Threshold Eyes Opened (smaller)</label>
        <input type="number" v-model="settings.thresholdEyesOpened" min="0.2" max="1" step="0.05"
          class="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" />
      </div>
    </div>
  </div>
</template>