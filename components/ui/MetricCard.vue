<template>
  <div class="metric">
    <div class="metric-label">{{ label }}</div>
    <div class="metric-value">{{ value }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>()
</script>

<style scoped>
.metric {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 18px 20px;
  transition: border-color 0.15s;
}

.metric:hover {
  border-color: var(--border-light);
}

.metric-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.metric-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -1px;
  margin-bottom: 6px;
  color: var(--text);
}
</style>
