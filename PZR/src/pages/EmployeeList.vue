<template>
  <div>
    <div class="metrics">
      <MetricCard label="Total Staff"   :value="allStaff.length" />
      <MetricCard label="Online Now"    :value="onlineCount" />
      <MetricCard label="Total Sales"   :value="totalSales.toLocaleString('en-US')" />
      <MetricCard label="Total Revenue" :value="fmt(totalRevenue)" />
    </div>

    <div class="tbl-wrap">
      <div class="tbl-header">
        <div class="tbl-title">All Employees</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Sales</th>
            <th>Revenue</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in allStaff" :key="s.id">
            <td>
              <div class="cell-ava-row">
                <div class="cell-ava">{{ s.initials }}</div>
                <span class="cell-name">{{ s.name }}</span>
              </div>
            </td>
            <td class="mono">{{ s.sales.toLocaleString('en-US') }}</td>
            <td class="mono">{{ fmt(s.revenue) }}</td>
            <td>
              <span class="tag" :class="s.online ? 'tag-on' : 'tag-off'">
                {{ s.online ? 'Online' : 'Offline' }}
              </span>
            </td>
            <td class="cell-action">
              <RouterLink :to="`/dashboard/employees/${s.id}`" class="row-btn">View →</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import MetricCard from '../components/ui/MetricCard.vue'
import { useStaff } from '../composables/useStaff.js'

const { allStaff } = useStaff()

const onlineCount  = computed(() => allStaff.value.filter(s => s.online).length)
const totalSales   = computed(() => allStaff.value.reduce((sum, s) => sum + s.sales, 0))
const totalRevenue = computed(() => allStaff.value.reduce((sum, s) => sum + s.revenue, 0))

function fmt(n) {
  return '$' + n.toLocaleString('en-US')
}
</script>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.tbl-wrap {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 28px;
}

.tbl-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tbl-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

table { width: 100%; border-collapse: collapse; }

th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-3);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 10px 20px;
  font-size: 13px;
  color: var(--text-2);
  border-bottom: 1px solid rgba(37,37,37,0.6);
}

tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--bg-hover); }

.mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
}

.cell-ava-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cell-ava {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-light);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; font-weight: 500;
  color: var(--text-2);
  flex-shrink: 0;
}

.cell-name { font-weight: 500; color: var(--text); }
.cell-action { text-align: right; }

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tag-on  { background: rgba(74,222,128,0.1); color: var(--green); }
.tag-off { background: rgba(85,85,85,0.2);   color: var(--text-3); }

.row-btn {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  transition: all 0.15s;
  text-decoration: none;
  font-family: inherit;
}

.row-btn:hover { color: var(--text-2); border-color: var(--border-light); }
</style>
