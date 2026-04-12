<template>
  <div class="panel">
    <div class="panel-header">
      <div class="panel-header-left">
        <div class="panel-title">Revenue</div>
        <div class="panel-sub">Sales dynamics</div>
      </div>
      <div class="chart-toggle">
        <button
          v-for="p in periods"
          :key="p.key"
          class="chart-toggle-btn"
          :class="{ active: activePeriod === p.key }"
          @click="activePeriod = p.key"
        >{{ p.label }}</button>
      </div>
    </div>

    <div class="chart-wrap">
      <Bar
        v-if="activePeriod === 'week'"
        :key="'week'"
        :data="chartData"
        :options="barOptions"
      />
      <Line
        v-else
        :key="activePeriod"
        :data="chartData"
        :options="lineOptions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip)

const props = defineProps({
  weekData:  { type: Array, default: () => [] },
  monthData: { type: Array, default: () => [] },
  yearData:  { type: Array, default: () => [] },
  color:     { type: String, default: '#60A5FA' },
})

const periods = [
  { key: 'week',  label: 'Week'  },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year'  },
]

const activePeriod = ref('year')

const activeData = computed(() => {
  if (activePeriod.value === 'week')  return props.weekData
  if (activePeriod.value === 'month') return props.monthData
  return props.yearData
})

// gradient called per-render by Chart.js
function makeGradient(context) {
  const { ctx, chartArea } = context.chart
  if (!chartArea) return 'transparent'
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  g.addColorStop(0, props.color + '18')
  g.addColorStop(1, props.color + '00')
  return g
}

const chartData = computed(() => ({
  labels: activeData.value.map(d => d.label),
  datasets: [
    activePeriod.value === 'week'
      ? {
          data: activeData.value.map(d => d.revenue),
          backgroundColor: props.color + '66',
          hoverBackgroundColor: props.color + 'AA',
          borderRadius: 3,
          borderSkipped: false,
          maxBarThickness: 24,
        }
      : {
          data: activeData.value.map(d => d.revenue),
          borderColor: props.color,
          backgroundColor: makeGradient,
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 1.5,
        },
  ],
}))

const sharedScales = {
  y: {
    grid: { color: '#1E1E1E' },
    ticks: { font: { family: "'IBM Plex Mono'", size: 11 }, color: '#555' },
    border: { display: false },
  },
  x: {
    grid: { display: false },
    ticks: { font: { family: "'IBM Plex Sans'", size: 11 }, color: '#555' },
    border: { display: false },
  },
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: sharedScales,
}

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: sharedScales,
}
</script>

<style scoped>
.panel {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 28px;
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

.chart-toggle {
  display: flex;
  gap: 1px;
  background: var(--border);
  border-radius: 5px;
  overflow: hidden;
}

.chart-toggle-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-3);
  background: var(--bg);
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s, background 0.15s;
}

.chart-toggle-btn:hover  { color: var(--text-2); }
.chart-toggle-btn.active { color: var(--text); background: var(--bg-hover); }

.chart-wrap {
  height: 220px;
  position: relative;
}
</style>
