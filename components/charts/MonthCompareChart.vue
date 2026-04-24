<template>
  <div class="panel">
    <div class="panel-header">
      <div class="panel-header-left">
        <div class="panel-title">Monthly Comparison</div>
        <div class="panel-sub">Current vs previous month</div>
      </div>
      <div class="legend">
        <span class="legend-item current"><span class="legend-dot"></span> This month</span>
        <span class="legend-item prev"><span class="legend-dot"></span> Last month</span>
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
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const props = defineProps<{ currentData: any[]; prevData: any[] }>()

const labels = computed(() => {
  const len = Math.max(props.currentData.length, props.prevData.length)
  return Array.from({ length: len }, (_, i) => String(i + 1))
})

function makeGradient(ctx: any, color: string) {
  const { chart } = ctx
  const { chartArea } = chart
  if (!chartArea) return 'transparent'
  const g = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  g.addColorStop(0, color + '20')
  g.addColorStop(1, color + '00')
  return g
}

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'This month',
      data: props.currentData.map((d: any) => d.revenue),
      borderColor: '#4ADE80',
      backgroundColor: (ctx: any) => makeGradient(ctx, '#4ADE80'),
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.5,
    },
    {
      label: 'Last month',
      data: props.prevData.map((d: any) => d.revenue),
      borderColor: '#666666',
      backgroundColor: (ctx: any) => makeGradient(ctx, '#666666'),
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 1.5,
      borderDash: [4, 3],
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString('en-US')}`,
      },
    },
  },
  scales: {
    y: {
      grid: { color: '#1E1E1E' },
      ticks: { font: { family: "'IBM Plex Mono'", size: 11 }, color: '#555' },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { font: { family: "'IBM Plex Sans'", size: 11 }, color: '#555', maxTicksLimit: 10 },
      border: { display: false },
    },
  },
}
</script>

<style scoped>
.panel {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-top: 20px;
  transition: border-color 0.15s;
}
.panel:hover {
  border-color: var(--border-light);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 2px;
}

.panel-sub {
  font-size: 10px;
  color: var(--text-3);
}

.legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-3);
}

.legend-item .legend-dot {
  width: 20px;
  height: 2px;
  border-radius: 1px;
}

.legend-item.current .legend-dot {
  background: #4ADE80;
}

.legend-item.prev .legend-dot {
  background: #555;
}

.chart-wrap {
  height: 180px;
  position: relative;
}
</style>
