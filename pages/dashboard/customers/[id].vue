<template>
  <div v-if="customer">
    <div class="cust-bar">
      <div class="cust-ava">{{ customer.name.slice(0, 2).toUpperCase() }}</div>
      <div class="cust-info">
        <div class="cust-name">{{ customer.name }}</div>
        <div class="cust-meta">
          <span class="tag" :class="`tag-${customer.tier}`">{{ tierLabel(customer.tier) }}</span>
          &ensp;Customer since {{ firstVisit }}
        </div>
      </div>
      <NuxtLink to="/dashboard/customers" class="back-btn">Back</NuxtLink>
    </div>

    <div class="metrics">
      <UiMetricCard label="Purchases"    :value="customer.purchases" />
      <UiMetricCard label="Total Spent"  :value="fmt(customer.spent)" />
      <UiMetricCard label="Avg Purchase" :value="fmt(avgPurchase)" />
      <UiMetricCard label="Discount"     :value="customer.discount + '%'" />
    </div>

    <ClientOnly>
      <ChartsRevenueChart :week-data="spendWeek" :month-data="spendMonth" :year-data="spendYear" color="#A78BFA" />
    </ClientOnly>

    <div class="tbl-wrap">
      <div class="tbl-header">
        <div class="tbl-title">Purchase History</div>
      </div>
      <table>
        <thead>
          <tr><th>Date</th><th>Product</th><th>Qty</th><th>Amount</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in purchases" :key="p.id">
            <td class="mono muted">{{ p.date }}</td>
            <td class="cell-name">{{ p.product }}</td>
            <td class="mono">{{ p.qty }}</td>
            <td class="mono green">+{{ fmt(p.amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else class="not-found">Customer not found.</div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Customer' })

const route = useRoute()
const { getById } = useCustomers()

const customer = computed(() => getById(route.params.id))

const avgPurchase = computed(() =>
  customer.value && customer.value.purchases > 0
    ? Math.round(customer.value.spent / customer.value.purchases) : 0
)

const firstVisit = computed(() => {
  if (!customer.value) return ''
  const idx = Number(customer.value.id)
  const year = 2025 - Math.floor(idx / 4)
  const month = String(((idx * 3) % 12) + 1).padStart(2, '0')
  return `${month}.${year}`
})

const BASE_MONTH  = [6200,7100,6800,8200,7800,9100,8700,9500,11200,10400,9800,11500]
const BASE_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

function scaledData(base: number[]) {
  if (!customer.value) return []
  const ratio = customer.value.spent / 170000
  return base.map((v, i) => ({
    label: BASE_LABELS[i],
    revenue: Math.round(v * ratio * (0.85 + (i % 3) * 0.1)),
  }))
}

const spendYear  = computed(() => scaledData(BASE_MONTH))

const spendMonth = computed(() => {
  if (!customer.value) return []
  const ratio = customer.value.spent / 170000
  return Array.from({ length: 30 }, (_, i) => ({
    label: String(i + 1),
    revenue: Math.round(Math.random() * 800 * ratio + 200 * ratio),
  }))
})

const spendWeek = computed(() => {
  if (!customer.value) return []
  const ratio = customer.value.spent / 170000
  return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
    label: d,
    revenue: Math.round((Math.random() * 600 + 100) * ratio),
  }))
})

const PRODUCTS = ['Item 1','Item 2','Item 3','Item 4','Item 5','Item 6','Item 7','Item 8']

const purchases = computed(() => {
  if (!customer.value) return []
  const c = customer.value
  const count = Math.min(c.purchases, 12)
  const perPurchase = Math.round(c.spent / c.purchases)
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = i * Math.max(3, Math.floor(300 / count))
    const d = new Date('2026-03-20')
    d.setDate(d.getDate() - daysAgo)
    const dateStr = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
    const qty = [1,1,2,1,3,1][i % 6]
    const base = Math.round(perPurchase / qty * (0.8 + (i % 5) * 0.08))
    return { id: i+1, date: dateStr, product: PRODUCTS[(Number(c.id) + i) % PRODUCTS.length], qty, amount: base * qty }
  })
})

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
function tierLabel(t: string) { return ({ gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'New' } as any)[t] ?? t }
</script>

<style scoped>
.cust-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
  padding: 16px 20px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.cust-ava {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  flex-shrink: 0;
}

.cust-info {
  flex: 1;
}

.cust-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.cust-meta {
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

.tag-gold {
  background: rgba(251, 191, 36, 0.12);
  color: var(--amber);
}

.tag-silver {
  background: rgba(148, 163, 184, 0.12);
  color: #94A3B8;
}

.tag-bronze {
  background: rgba(180, 130, 90, 0.12);
  color: #C4956A;
}

.tag-none {
  background: rgba(85, 85, 85, 0.15);
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
}

.tbl-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

table {
  width: 100%;
  border-collapse: collapse;
}

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
  border-bottom: 1px solid rgba(37, 37, 37, 0.6);
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: var(--bg-hover);
}

.mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
}

.muted {
  color: var(--text-3);
}

.cell-name {
  font-weight: 500;
  color: var(--text);
}

.green {
  color: var(--green);
}

.not-found {
  padding: 40px;
  color: var(--text-3);
  font-size: 13px;
}
</style>
