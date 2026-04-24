<template>
  <div class="panel">
    <div class="panel-header">
      <div class="panel-title">Earnings by Type</div>
    </div>

    <div v-if="total === 0" class="empty">No data</div>

    <div v-else class="body">
      <div class="donut-wrap">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="donut-center">
          <span class="donut-total">{{ fmt(total) }}</span>
        </div>
      </div>

      <div class="legend">
        <div v-for="item in items" :key="item.label" class="legend-row">
          <span class="legend-dot" :style="{ background: item.color }"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ fmt(item.value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js'

ChartJS.register(ArcElement, Tooltip)

const props = defineProps<{ items: { label: string; value: number; color: string }[] }>()

const total = computed(() => props.items.reduce((s, i) => s + i.value, 0))

const chartData = computed(() => ({
  labels: props.items.map(i => i.label),
  datasets: [{
    data: props.items.map(i => i.value),
    backgroundColor: props.items.map(i => i.color),
    borderColor: 'transparent',
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx: any) => ` $${ctx.parsed.toLocaleString('en-US')}` },
    },
  },
}

function fmt(n: number) {
  return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n
}
</script>

<style scoped>
.panel {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.panel:hover {
  border-color: var(--border-light);
}

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.empty {
  padding: 24px 16px;
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
}

.body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.donut-wrap {
  position: relative;
  width: 130px;
  height: 130px;
  flex-shrink: 0;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.donut-total {
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
}

.legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  font-size: 12px;
  color: var(--text-2);
  flex: 1;
  text-transform: capitalize;
}

.legend-value {
  font-size: 11px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-3);
}
</style>
