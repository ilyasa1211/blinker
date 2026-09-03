<script setup lang="ts">
import { computed, ref } from "vue";
import { defaultSettings as settings } from "../settings.js";
import { resetToDefaults } from "../common/settings-manager.js";
import { showNotification } from "../lib/notification.js";
import { applyTheme, setStoredTheme } from "../lib/theme.js";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { hydrateSettings } from "../settings.js";

const showResetDialog = ref(false);

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

const selectedTheme = computed({
  get: () => settings.theme,
  set: (val) => {
    settings.theme = val;
    applyTheme(val);
    setStoredTheme(val);
  },
});

async function handleReset() {
  const freshSettings = await resetToDefaults();
  await hydrateSettings(freshSettings);
  applyTheme(freshSettings.theme);
  setStoredTheme(freshSettings.theme);
  showResetDialog.value = false;
  showNotification(
    "Settings Reset",
    "All settings have been restored to their default values."
  );
}
</script>

<template>
  <Card class="p-5">
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h3 class="text-primary font-bold uppercase text-xs tracking-widest">Configuration</h3>
        <AlertDialog v-model:open="showResetDialog">
          <AlertDialogTrigger as-child>
            <Button variant="destructive" size="sm" class="text-xs">Reset to Default</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Settings to Default?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will restore all settings to their default values. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div class="flex gap-3 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction @click="handleReset" class="bg-destructive hover:bg-destructive/90">
                Reset
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <!-- Form Fields -->
      <div class="space-y-4">
        <!-- Theme -->
        <div class="space-y-1.5">
          <Label for="theme" class="text-xs text-muted-foreground">Theme</Label>
          <Select v-model:model-value="selectedTheme">
            <SelectTrigger id="theme">
              <SelectValue :placeholder="`Theme (${settings.theme})`" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Numeric inputs in 2-col grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <Label for="blink-timeout" class="text-xs text-muted-foreground">Blink Timeout</Label>
            <Input
              id="blink-timeout"
              type="number"
              :model-value="settings.blinkTimeout"
              @update:model-value="(v) => settings.blinkTimeout = Number(v)"
              min="0.2"
              max="2"
              step="0.1"
            />
          </div>

          <div class="space-y-1">
            <Label for="notify-before" class="text-xs text-muted-foreground">Notify Before</Label>
            <Input
              id="notify-before"
              type="number"
              :model-value="settings.notifyBeforeSecond"
              @update:model-value="(v) => settings.notifyBeforeSecond = Number(v)"
              min="5"
              max="300"
              step="1"
            />
          </div>

          <div class="space-y-1">
            <Label for="eyes-closed" class="text-xs text-muted-foreground">Threshold Closed</Label>
            <Input
              id="eyes-closed"
              type="number"
              :model-value="settings.thresholdEyesClosed"
              @update:model-value="(v) => settings.thresholdEyesClosed = Number(v)"
              :min="settings.thresholdEyesOpened"
              max="1"
              step="0.05"
            />
          </div>

          <div class="space-y-1">
            <Label for="eyes-opened" class="text-xs text-muted-foreground">Threshold Opened</Label>
            <Input
              id="eyes-opened"
              type="number"
              :model-value="settings.thresholdEyesOpened"
              @update:model-value="(v) => settings.thresholdEyesOpened = Number(v)"
              min="0.2"
              :max="settings.thresholdEyesClosed"
              step="0.05"
            />
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
