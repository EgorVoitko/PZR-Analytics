<template>
  <div v-if="staff">
    <!-- employee header bar -->
    <div class="emp-bar">
      <div class="emp-ava">{{ staff.initials }}</div>
      <div class="emp-info">
        <div class="emp-name">{{ staff.name }}</div>
        <div class="emp-meta">
          <span class="tag" :class="staff.online ? 'tag-on' : 'tag-off'">
            {{ staff.online ? 'Online' : 'Offline' }}
          </span>
          &ensp;Employee
        </div>
      </div>
      <RouterLink to="/dashboard/employees" class="back-btn">← Back</RouterLink>
    </div>

    <!-- metrics -->
    <div class="metrics">
      <MetricCard label="Sales"    :value="salesCount.toLocaleString('en-US')" />
      <MetricCard label="Revenue"  :value="fmt(totalRevenue)" />
      <MetricCard label="Today"    :value="fmt(todayRevenue)" />
      <MetricCard label="Avg Sale" :value="fmt(avgSale)" />
    </div>

    <!-- chart -->
    <RevenueChart
      :week-data="revenueByWeek"
      :month-data="revenueByMonth"
      :year-data="revenueByYear"
      color="#60A5FA"
    />

    <!-- recent sales -->
    <LiveFeed :sales="feedSales" :limit="8" />
  </div>

  <div v-else class="not-found">Employee not found.</div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import MetricCard   from '../components/ui/MetricCard.vue'
import RevenueChart from '../components/charts/RevenueChart.vue'
import LiveFeed     from '../components/ui/LiveFeed.vue'
import { useStaff }    from '../composables/useStaff.js'
import { useProducts } from '../composables/useProducts.js'
import { useSales }    from '../composables/useSales.js'

const route   = useRoute()
const staffId = computed(() => Number(route.params.id))

const { getById }    = useStaff()
const { allProducts } = useProducts()

const staff = computed(() => getById(staffId.value))

const {
  sales,
  totalRevenue,
  salesCount,
  todayRevenue,
  revenueByWeek,
  revenueByMonth,
  revenueByYear,
  recentSales,
} = useSales(staffId)

const avgSale = computed(() =>
  salesCount.value > 0 ? Math.round(totalRevenue.value / salesCount.value) : 0
)

const feedSales = computed(() =>
  recentSales(8).map(s => ({
    id:          s.id,
    date:        s.date,
    productName: allProducts.value[s.productIdx]?.name ?? '—',
    staffName:   staff.value?.name.split(' ')[0] ?? '—',
    total:       s.total,
  }))
)

function fmt(n) {
  return '$' + n.toLocaleString('en-US')
}
</script>

<style scoped>
.emp-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding: 16px 20px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.emp-ava {
  width: 40px; height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px; font-weight: 600;
  color: var(--text-2);
  flex-shrink: 0;
}

.emp-info { flex: 1; }

.emp-name { font-size: 15px; font-weight: 600; color: var(--text); }
.emp-meta { font-size: 11px; color: var(--text-3); margin-top: 3px; }

.tag {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tag-on  { background: rgba(74,222,128,0.1); color: var(--green); }
.tag-off { background: rgba(85,85,85,0.2);   color: var(--text-3); }

.back-btn {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-3);
  cursor: pointer;
  border: 1px solid var(--border);
  padding: 6px 14px;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
  font-weight: 500;
  transition: all 0.15s;
  text-decoration: none;
}

.back-btn:hover { color: var(--text-2); border-color: var(--border-light); }

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

.not-found {
  padding: 40px;
  color: var(--text-3);
  font-size: 13px;
}
</style>
