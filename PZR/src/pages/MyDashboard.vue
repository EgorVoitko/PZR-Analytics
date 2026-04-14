<template>
  <div class="dashboard">
    <!-- user bar -->
    <div class="emp-bar">
      <div class="emp-ava">{{ user?.initials ?? '?' }}</div>
      <div class="emp-info">
        <div class="emp-name">{{ user?.name ?? '—' }}</div>
        <div class="emp-meta">{{ user?.roleLabel ?? '' }}</div>
      </div>
      <div class="online-badge">
        <span class="live-dot"></span>
        Online
      </div>
    </div>

    <!-- metrics -->
    <div class="metrics">
      <MetricCard label="My Sales"  :value="salesCount.toLocaleString('en-US')" />
      <MetricCard label="Revenue"   :value="fmt(totalRevenue)" />
      <MetricCard label="Today"     :value="fmt(todayRevenue)" />
      <MetricCard label="Avg Sale"  :value="fmt(avgSale)" />
    </div>

    <!-- main grid: left | right -->
    <div class="main-grid">

      <!-- left column -->
      <div class="col-left">
        <RevenueChart
          :week-data="revenueByWeek"
          :month-data="revenueByMonth"
          :year-data="revenueByYear"
          color="#4ADE80"
        />
        <LiveFeed :sales="feedSales" :limit="8" />
      </div>

      <!-- right column -->
      <div class="col-right">
        <!-- recent transactions -->
        <div class="panel transactions">
          <div class="panel-header">
            <div class="panel-title">Recent Transactions</div>
            <div class="panel-live">Live</div>
          </div>
          <div
            v-for="sale in feedSales.slice(0, 6)"
            :key="sale.id"
            class="tx-row"
          >
            <div class="tx-left">
              <div class="tx-ava">{{ sale.staffName.slice(0, 2).toUpperCase() }}</div>
              <div class="tx-info">
                <div class="tx-name">{{ sale.productName }}</div>
                <div class="tx-time">{{ sale.date }}</div>
              </div>
            </div>
            <div class="tx-amount">+{{ fmt(sale.total) }}</div>
          </div>
          <div v-if="feedSales.length === 0" class="tx-empty">No transactions yet</div>
        </div>

        <!-- earnings by type -->
        <EarningsByType :items="earningsByType" />
      </div>
    </div>

    <!-- comparison chart -->
    <MonthCompareChart :current-data="revenueByMonth" :prev-data="prevMonthByDay" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MetricCard        from '../components/ui/MetricCard.vue'
import RevenueChart      from '../components/charts/RevenueChart.vue'
import EarningsByType    from '../components/charts/EarningsByType.vue'
import MonthCompareChart from '../components/charts/MonthCompareChart.vue'
import LiveFeed          from '../components/ui/LiveFeed.vue'
import { useAuth }       from '../composables/useAuth.js'
import { useProducts }   from '../composables/useProducts.js'
import { useSales }      from '../composables/useSales.js'

const TYPE_LABELS = {
  'dino':          'Dino',
  'strukture':     'Strukture',
  'kit':           'Kit',
  'account':       'Account',
  'resource':      'Resource',
  'boss':          'Boss',
  'guide-service': 'Guide Service',
}

const TYPE_COLORS = {
  'dino':          '#4ADE80',
  'strukture':     '#60A5FA',
  'kit':           '#FACC15',
  'account':       '#A78BFA',
  'resource':      '#FB923C',
  'boss':          '#F87171',
  'guide-service': '#34D399',
}

const { user } = useAuth()
const { allProducts } = useProducts()

const staffId = computed(() => user.value?.staffId ?? null)

const {
  sales,
  totalRevenue,
  salesCount,
  todayRevenue,
  revenueByWeek,
  revenueByMonth,
  revenueByYear,
  prevMonthByDay,
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
    staffName:   user.value?.name?.split(' ')[0] ?? '—',
    total:       s.total,
  }))
)

const earningsByType = computed(() => {
  const totals = {}
  for (const sale of sales.value) {
    const type = allProducts.value[sale.productIdx]?.type
    if (!type) continue
    totals[type] = (totals[type] ?? 0) + sale.total
  }
  return Object.entries(totals)
    .map(([type, value]) => ({
      label: TYPE_LABELS[type] ?? type,
      value,
      color: TYPE_COLORS[type] ?? '#888',
    }))
    .sort((a, b) => b.value - a.value)
})

function fmt(n) {
  return '$' + n.toLocaleString('en-US')
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
}

/* ── user bar ── */
.emp-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
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
  font-size: 13px; font-weight: 600;
  color: var(--text-2);
  flex-shrink: 0;
}

.emp-info { flex: 1; }
.emp-name { font-size: 15px; font-weight: 600; color: var(--text); }
.emp-meta { font-size: 11px; color: var(--text-3); margin-top: 3px; }

.online-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.live-dot {
  width: 6px; height: 6px;
  background: var(--green);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* ── metrics ── */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

/* ── main grid ── */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.col-left {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.col-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── transactions panel ── */
.transactions {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.transactions:hover { border-color: var(--border-light); }

.panel-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.panel-live {
  font-size: 10px;
  font-weight: 600;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.tx-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(37, 37, 37, 0.5);
  transition: background 0.12s;
}
.tx-row:last-child { border-bottom: none; }
.tx-row:hover { background: var(--bg-hover); }

.tx-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.tx-ava {
  width: 28px; height: 28px;
  border-radius: 6px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 9px; font-weight: 600;
  color: var(--text-3);
  flex-shrink: 0;
}

.tx-info { min-width: 0; }

.tx-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-time {
  font-size: 10px;
  color: var(--text-3);
  margin-top: 1px;
}

.tx-amount {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 500;
  color: var(--green);
  flex-shrink: 0;
  margin-left: 8px;
}

.tx-empty {
  padding: 20px 16px;
  font-size: 12px;
  color: var(--text-3);
  text-align: center;
}
</style>
