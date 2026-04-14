<template>
  <div class="dashboard">
    <!-- metrics -->
    <div class="metrics">
      <MetricCard label="Revenue"   :value="fmt(totalRevenue)" />
      <MetricCard label="Sales"     :value="totalSales.toLocaleString('en-US')" />
      <MetricCard label="Today"     :value="fmt(todayRevenue)" />
      <MetricCard label="Customers" :value="customerCount" />
    </div>

    <!-- main grid: left | right -->
    <div class="main-grid">

      <!-- left column -->
      <div class="col-left">
        <RevenueChart
          :week-data="revenueByWeek"
          :month-data="revenueByMonth"
          :year-data="revenueByYear"
          color="#60A5FA"
        />
        <LiveFeed :sales="feedSales" :limit="8" />
      </div>

      <!-- right column -->
      <div class="col-right">
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

import { useStaff }     from '../composables/useStaff.js'
import { useCustomers } from '../composables/useCustomers.js'
import { useProducts }  from '../composables/useProducts.js'
import { useSales }     from '../composables/useSales.js'

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

const { allStaff, getById: getStaff } = useStaff()
const { allCustomers }                 = useCustomers()
const { allProducts }                  = useProducts()
const {
  sales,
  recentSales,
  todayRevenue,
  revenueByWeek,
  revenueByMonth,
  revenueByYear,
  prevMonthByDay,
} = useSales()

const totalRevenue = computed(() =>
  allStaff.value.reduce((sum, s) => sum + s.revenue, 0)
)

const totalSales = computed(() =>
  allStaff.value.reduce((sum, s) => sum + s.sales, 0)
)

const customerCount = computed(() => allCustomers.value.length)

const feedSales = computed(() =>
  recentSales(8).map(sale => ({
    id:          sale.id,
    date:        sale.date,
    productName: allProducts.value[sale.productIdx]?.name ?? '—',
    staffName:   getStaff(sale.staffId)?.name.split(' ')[0] ?? '—',
    total:       sale.total,
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

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
}

.col-left {
  display: flex;
  flex-direction: column;
}

.col-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

</style>
