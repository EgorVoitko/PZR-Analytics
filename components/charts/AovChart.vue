<template>
  <div class="panel">
    <div class="panel-header">
      <div>
        <div class="panel-title">Avg Order Value</div>
        <div class="panel-sub">Per month trend</div>
      </div>
    </div>
    <div class="chart-wrap">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, LineElement, PointElement, LinearScale,
  CategoryScale, Tooltip, Filler,
} from 'chart.js'

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler)

const props = defineProps<{
  data: { label: string; aov: number; count: number }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.label),
  datasets: [{
    data:            props.data.map(d => d.aov),
    borderColor:     '#C084FC',
    backgroundColor: 'rgba(192,132,252,0.08)',
    borderWidth:     2,
    pointRadius:     3,
    pointHoverRadius: 5,
    tension:         0.4,
    fill:            true,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` $${ctx.parsed.y.toLocaleString('en-US')} avg`,
        afterLabel: (ctx: any) => `  ${props.data[ctx.dataIndex].count} orders`,
      },
    },
  },
  scales: {
    x: {
      grid:  { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#555', font: { size: 11 } },
    },
    y: {
      grid:  { color: 'rgba(255,255,255,0.04)' },
      ticks: { color: '#555', font: { size: 11 }, callback: (v: any) => '$' + v },
    },
  },
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
.panel:hover { border-color: var(--border-light); }

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.panel-sub {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

.chart-wrap {
  padding: 12px 16px 16px;
  height: 180px;
}
</style>
