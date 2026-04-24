<template>
  <div>
    <div class="metrics">
      <UiMetricCard label="Total Customers" :value="allCustomers.length" />
      <UiMetricCard label="Gold Tier"       :value="goldCount" />
      <UiMetricCard label="Total Spent"     :value="fmt(totalSpent)" />
      <UiMetricCard label="Avg Discount"    :value="avgDiscount + '%'" />
    </div>

    <div class="tbl-wrap">
      <div class="tbl-header">
        <div class="tbl-title">Customers</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Purchases</th>
            <th>Spent</th>
            <th>Tier</th>
            <th>Discount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in allCustomers" :key="c.id">
            <td class="mono muted">#{{ c.id.padStart(4, '0') }}</td>
            <td class="cell-name">{{ c.name }}</td>
            <td class="mono">{{ c.purchases }}</td>
            <td class="mono">{{ fmt(c.spent) }}</td>
            <td>
              <span class="tag" :class="`tag-${c.tier}`">{{ tierLabel(c.tier) }}</span>
            </td>
            <td>
              <div class="discount-bar">
                <div class="discount-track">
                  <div class="discount-fill" :style="{ width: (c.discount / 20 * 100) + '%', background: discountColor(c.discount) }"></div>
                </div>
                <span class="mono">{{ c.discount }}%</span>
              </div>
            </td>
            <td class="cell-action">
              <NuxtLink :to="`/dashboard/customers/${c.id}`" class="row-btn">View →</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Customers' })

const { allCustomers } = useCustomers()

const goldCount   = computed(() => allCustomers.value.filter((c: any) => c.tier === 'gold').length)
const totalSpent  = computed(() => allCustomers.value.reduce((sum: number, c: any) => sum + c.spent, 0))
const avgDiscount = computed(() => {
  const vals = allCustomers.value.filter((c: any) => c.discount > 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((s: number, c: any) => s + c.discount, 0) / vals.length)
})

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
function tierLabel(t: string) { return ({ gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'New' } as any)[t] ?? t }
function discountColor(d: number) {
  if (d >= 10) return 'var(--amber)'
  if (d >= 5)  return '#60A5FA'
  return 'var(--text-3)'
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

.cell-action {
  text-align: right;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
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

.discount-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.discount-track {
  width: 60px;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  flex-shrink: 0;
}

.discount-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s;
}

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

.row-btn:hover {
  color: var(--text-2);
  border-color: var(--border-light);
}

</style>
