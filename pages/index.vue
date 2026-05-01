<template>
  <div class="dashboard">
    <div class="metrics">
      <UiMetricCard label="Revenue"   :value="fmt(totalRevenue)" />
      <UiMetricCard label="Sales"     :value="totalSales.toLocaleString('en-US')" />
      <UiMetricCard label="Today"     :value="fmt(todayRevenue)" />
      <UiMetricCard label="Customers" :value="customerCount" />
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

const TYPE_LABELS: Record<string, string> = {
  'dino': 'Dino', 'boss': 'Boss', 'basic_resource': 'Basic Resource',
  'advanced_resource': 'Advanced Resource', 'consumable': 'Consumable',
  'dye': 'Dye', 'weapon': 'Weapon', 'armor': 'Armor', 'saddle': 'Saddle',
  'tek_structure': 'Tek Structure', 'metal_structure': 'Metal Structure', 'utility': 'Utility',
}
const TYPE_COLORS: Record<string, string> = {
  'dino': '#4ADE80', 'boss': '#F87171', 'basic_resource': '#60A5FA',
  'advanced_resource': '#A78BFA', 'consumable': '#34D399', 'dye': '#FACC15',
  'weapon': '#FB923C', 'armor': '#94A3B8', 'saddle': '#C4956A',
  'tek_structure': '#38BDF8', 'metal_structure': '#888', 'utility': '#6EE7B7',
}

const { allCustomers } = useCustomers()
const { sales, recentSales, todayRevenue, revenueByWeek, revenueByMonth, revenueByYear, prevMonthByDay } = useSales()

const totalRevenue  = computed(() => sales.value.reduce((sum: number, s: any) => sum + s.total, 0))
const totalSales    = computed(() => sales.value.length)
const customerCount = computed(() => allCustomers.value.length)

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

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
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
