<template>
  <div>
    <div class="metrics">
      <MetricCard label="Revenue"   :value="fmt(totalRevenue)" />
      <MetricCard label="Sales"     :value="totalSales.toLocaleString('en-US')" />
      <MetricCard label="Today"     :value="fmt(todayRevenue)" />
      <MetricCard label="Customers" :value="customerCount" />
    </div>

    <RevenueChart
      :week-data="revenueByWeek"
      :month-data="revenueByMonth"
      :year-data="revenueByYear"
      color="#60A5FA"
    />

    <LiveFeed :sales="feedSales" :limit="8" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MetricCard   from '../components/ui/MetricCard.vue'
import RevenueChart from '../components/charts/RevenueChart.vue'
import LiveFeed     from '../components/ui/LiveFeed.vue'

import { useStaff }     from '../composables/useStaff.js'
import { useCustomers } from '../composables/useCustomers.js'
import { useProducts }  from '../composables/useProducts.js'
import { useSales }     from '../composables/useSales.js'

const { allStaff, getById: getStaff } = useStaff()
const { allCustomers }                 = useCustomers()
const { allProducts }                  = useProducts()
const {
  recentSales,
  todayRevenue,
  revenueByWeek,
  revenueByMonth,
  revenueByYear,
} = useSales()

// Revenue/sales sum staff historical totals, not just recorded sales
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
</style>
