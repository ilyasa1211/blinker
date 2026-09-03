<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  isSessionActive: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "toggle-session"): void;
}>();
</script>

<template>
  <Card class="p-6">
    <CardContent class="flex justify-center p-0">
      <Button
        size="lg"
        :variant="isSessionActive ? 'destructive' : 'default'"
        @click="emit('toggle-session')"
      >
        {{ isSessionActive ? "Stop" : "Start" }}
      </Button>
    </CardContent>
  </Card>
</template>
