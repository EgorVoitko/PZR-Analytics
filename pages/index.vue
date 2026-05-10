<template>
  <div class="dashboard">
    <div class="metrics">
      <UiMetricCard label="Revenue"        :value="fmt(totalRevenue)" />
      <UiMetricCard label="Net Profit"     :value="fmt(netProfit)" :sub="margin + '% margin'" :highlight="netProfit >= 0 ? 'green' : 'red'" />
      <UiMetricCard label="Today"          :value="fmt(todayRevenue)" />
      <UiMetricCard label="Customers"      :value="customerCount" :sub="uniqueBuyersThisMonth + ' buyers this month'" />
      <UiMetricCard label="Retention Rate" :value="retention + '%'" sub="returning buyers this month" :highlight="retention >= 50 ? 'green' : retention > 0 ? 'amber' : undefined" />
    </div>

    <div class="main-grid">
      <div class="col-left">
        <ClientOnly>
          <ChartsRevenueChart
            :week-data="revenueByWeek"
            :month-data="revenueByMonth"
            :year-data="revenueByYear"
            color="#60A5FA"
          />
        </ClientOnly>
        <UiLiveFeed :sales="feedSales" :limit="8" />
      </div>

      <div class="col-right">
        <ClientOnly>
          <ChartsEarningsByType :items="earningsByType" />
        </ClientOnly>
      </div>
    </div>

    <ClientOnly>
      <ChartsMonthCompareChart
        v-if="totalSales > 0"
        :key="totalSales"
        :current-data="revenueByMonth"
        :prev-data="prevMonthByDay"
      />
    </ClientOnly>


  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Overview' })

import { PRODUCT_TYPE_LABELS as TYPE_LABELS, PRODUCT_TYPE_COLORS as TYPE_COLORS } from '~/constants/productTypes'

const { allCustomers } = useCustomers()
const { sales, recentSales, todayRevenue, revenueByWeek, revenueByMonth, revenueByYear, prevMonthByDay } = useSales()
const { totalExpenses, stripeFees } = useExpenses(sales, allCustomers)

const totalRevenue  = computed(() => sales.value.reduce((sum: number, s: any) => sum + s.total, 0))
const totalSales    = computed(() => sales.value.length)
const customerCount = computed(() => allCustomers.value.length)
const netProfit     = computed(() => totalRevenue.value - totalExpenses.value)
const margin        = computed(() => totalRevenue.value > 0 ? Math.round((netProfit.value / totalRevenue.value) * 100) : 0)

const feedSales = computed(() =>
  recentSales(8).map((sale: any) => ({
    id: sale.id, date: sale.date, productName: sale.productName,
    productType: sale.productType, staffName: sale.staffName, total: sale.total,
  }))
)

const earningsByType = computed(() => {
  const totals: Record<string, number> = {}
  for (const sale of sales.value) {
    const type = sale.productType
    if (!type) continue
    totals[type] = (totals[type] ?? 0) + sale.total
  }
  return Object.entries(totals)
    .map(([type, value]) => ({ label: TYPE_LABELS[type] ?? type, value, color: TYPE_COLORS[type] ?? '#888' }))
    .sort((a, b) => b.value - a.value)
})

// ── Customer Analytics ───────────────────────────────────────────
const thisMonthSales = computed(() => {
  const now = new Date()
  return sales.value.filter((s: any) => {
    const d = new Date(s.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
})

const salesThisMonth        = computed(() => thisMonthSales.value.length)
const uniqueBuyersThisMonth = computed(() => new Set(thisMonthSales.value.map((s: any) => s.customerId).filter(Boolean)).size)

const aovThisMonth = computed(() =>
  salesThisMonth.value > 0
    ? Math.round(thisMonthSales.value.reduce((sum: number, s: any) => sum + s.total, 0) / salesThisMonth.value)
    : 0
)

const retention = computed(() => {
  const thisMonthCustomerIds = [...new Set(thisMonthSales.value.map((s: any) => s.customerId).filter(Boolean))]
  if (thisMonthCustomerIds.length === 0) return 0
  const now = new Date()
  const returning = thisMonthCustomerIds.filter(cid =>
    sales.value.some((s: any) => {
      const d = new Date(s.createdAt)
      const beforeThisMonth = !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
      return s.customerId === cid && beforeThisMonth
    })
  )
  return Math.round((returning.length / thisMonthCustomerIds.length) * 100)
})

const returningBuyersThisMonth = computed(() => {
  const now = new Date()
  const ids = [...new Set(thisMonthSales.value.map((s: any) => s.customerId).filter(Boolean))]
  return ids.filter(cid =>
    sales.value.some((s: any) => {
      const d = new Date(s.createdAt)
      return s.customerId === cid && !(d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear())
    })
  ).length
})

const newBuyersThisMonth = computed(() => uniqueBuyersThisMonth.value - returningBuyersThisMonth.value)

const aovByMonth = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 11 + i)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const monthSales = sales.value.filter((s: any) => {
      const sd = new Date(s.createdAt)
      return sd.getFullYear() === yr && sd.getMonth() === mo
    })
    return {
      label: d.toLocaleString('en-US', { month: 'short' }),
      aov:   monthSales.length > 0 ? Math.round(monthSales.reduce((sum: number, s: any) => sum + s.total, 0) / monthSales.length) : 0,
      count: monthSales.length,
    }
  })
)

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
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
