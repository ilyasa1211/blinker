<script setup lang="ts">
import { Badge } from "@/components/ui/badge";

interface Props {
  isActive: boolean;
}

defineProps<Props>();
</script>

<template>
  <Badge :variant="isActive ? 'default' : 'secondary'" class="flex items-center gap-2">
    <span :class="['w-2 h-2 rounded-full', isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground']"></span>
    {{ isActive ? "LIVE TRACKING" : "SYSTEM PAUSED" }}
  </Badge>
</template>
