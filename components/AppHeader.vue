<template>
  <header class="header">
    <h1 class="page-title">{{ title }}</h1>
    <div class="header-right">
      <button class="icon-btn" title="Export to Excel" @click="exportForCurrentPage">
        <span class="mi" style="font-size:18px">download</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()

const { exportForCurrentPage } = useExport()
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  flex-shrink: 0;
}

.page-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.01em;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text);
  border-color: var(--border-light);
}
</style>
