<template>
  <div v-if="staff">
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
      <NuxtLink to="/dashboard/employees" class="back-btn">Back</NuxtLink>
    </div>

    <div class="metrics">
      <UiMetricCard label="Sales"    :value="salesCount.toLocaleString('en-US')" />
      <UiMetricCard label="Revenue"  :value="fmt(totalRevenue)" />
      <UiMetricCard label="Today"    :value="fmt(todayRevenue)" />
      <UiMetricCard label="Avg Sale" :value="fmt(avgSale)" />
    </div>

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

  <div v-else class="not-found">Employee not found.</div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Employee' })

const route   = useRoute()
const staffId = computed(() => route.params.id as string)

const { getById } = useStaff()

const staff = computed(() => getById(staffId.value))

const {
  sales, totalRevenue, salesCount, todayRevenue,
  revenueByWeek, revenueByMonth, revenueByYear, recentSales,
} = useSales(staffId)

const avgSale = computed(() =>
  salesCount.value > 0 ? Math.round(totalRevenue.value / salesCount.value) : 0
)

const feedSales = computed(() =>
  recentSales(8).map((s: any) => ({
    id: s.id, date: s.date,
    productName: s.productName,
    productType: s.productType,
    staffName: staff.value?.name.split(' ')[0] ?? '—',
    total: s.total,
  }))
)

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-2);
  flex-shrink: 0;
}

.emp-info {
  flex: 1;
}

.emp-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.emp-meta {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 3px;
}

.tag {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tag-on {
  background: rgba(74, 222, 128, 0.1);
  color: var(--green);
}

.tag-off {
  background: rgba(85, 85, 85, 0.2);
  color: var(--text-3);
}

.back-btn {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-light);
  padding: 6px 16px;
  border-radius: 6px;
  background: var(--bg-hover);
  color: var(--text-2);
  font-family: inherit;
  transition: all 0.15s;
  text-decoration: none;
}

.back-btn:hover {
  color: var(--text);
  background: var(--border);
}

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
