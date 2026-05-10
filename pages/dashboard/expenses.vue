<template>
  <div class="page">

    <div class="metrics">
      <UiMetricCard label="Total Expenses" :value="fmt(totalExpenses)" />
      <UiMetricCard label="Stripe Fees"    :value="fmt(stripeFees.amount)" sub="Auto-calculated" highlight="red" />
      <UiMetricCard label="Manual"         :value="fmt(manualExpenses)" />
      <UiMetricCard label="This Month"     :value="fmt(thisMonthExpenses)" />
      <UiMetricCard label="Avg Discount"   :value="avgDiscount + '%'" sub="across active customers" />
    </div>

    <div class="layout">

      <!-- Add form -->
      <div class="panel form-panel">
        <div class="panel-title">Add Expense</div>
        <form @submit.prevent="submit" class="form">
          <div class="field">
            <label class="label">Amount ($)</label>
            <input v-model.number="form.amount" type="number" min="1" step="1" class="input" required placeholder="100" />
          </div>
          <div class="field">
            <label class="label">Category</label>
            <select v-model="form.category" class="input" required>
              <option disabled value="">Select category</option>
              <option v-for="c in EXPENSE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div class="field">
            <label class="label">Date</label>
            <input v-model="form.date" type="date" class="input" required />
          </div>
          <div class="field">
            <label class="label">Description</label>
            <input v-model="form.description" type="text" class="input" placeholder="Optional note" />
          </div>
          <div v-if="errorMsg" class="error">{{ errorMsg }}</div>
          <button type="submit" class="btn" :disabled="loading">
            {{ loading ? 'Adding…' : 'Add Expense' }}
          </button>
        </form>
      </div>

      <!-- Category breakdown -->
      <div class="panel">
        <div class="panel-title">By Category</div>
        <div class="breakdown">
          <div v-for="item in expensesByCategory" :key="item.category" class="breakdown-row">
            <span class="breakdown-label">{{ item.label }}</span>
            <div class="breakdown-bar-wrap">
              <div class="breakdown-bar" :style="{ width: barWidth(item.amount) + '%' }"></div>
            </div>
            <span class="breakdown-amount">{{ fmt(item.amount) }}</span>
          </div>
          <div v-if="expensesByCategory.length === 0" class="empty">No expenses yet</div>
        </div>
      </div>
    </div>

    <!-- Expense list -->
    <div class="panel tbl-panel">
      <div class="panel-header">
        <div class="panel-title">Expense History</div>
        <select v-model="filterCategory" class="filter-select">
          <option value="">All categories</option>
          <option v-for="c in EXPENSE_CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <!-- Auto: Hosting -->
          <tr v-if="!filterCategory || filterCategory === 'hosting'" class="auto-row">
            <td class="mono muted">Auto</td>
            <td><span class="tag tag-auto">Hosting</span></td>
            <td class="muted">
              <span v-if="!editingHosting">{{ hostingFee.description }}</span>
              <span v-else class="edit-inline">
                <span class="muted">$</span>
                <input v-model="hostingInput" type="number" min="1" class="inline-input" @keyup.enter="saveHosting" @keyup.escape="editingHosting = false" />
                <span class="muted">/month</span>
                <button class="save-btn" @click="saveHosting">Save</button>
                <button class="cancel-btn" @click="editingHosting = false">✕</button>
              </span>
            </td>
            <td class="mono red">−{{ fmt(hostingFee.amount) }}</td>
            <td class="action-cell">
              <button class="del-btn" title="Edit price" @click="startEditHosting">✎</button>
            </td>
          </tr>
          <!-- Auto: Customer Discounts -->
          <tr v-if="!filterCategory || filterCategory === 'discounts'" class="auto-row">
            <td class="mono muted">Auto</td>
            <td><span class="tag tag-auto">Customer Discounts</span></td>
            <td class="muted">{{ discountCost.description }}</td>
            <td class="mono red">−{{ fmt(discountCost.amount) }}</td>
            <td></td>
          </tr>
          <!-- Auto: Stripe fees -->
          <tr v-if="!filterCategory || filterCategory === 'fees'" class="auto-row">
            <td class="mono muted">Auto</td>
            <td><span class="tag tag-auto">Stripe Fees</span></td>
            <td class="muted">{{ stripeFees.description }}</td>
            <td class="mono red">−{{ fmt(stripeFees.amount) }}</td>
            <td></td>
          </tr>
          <!-- Manual expenses -->
          <tr v-for="e in filteredExpenses" :key="e.id">
            <td class="mono muted">{{ e.date }}</td>
            <td><span class="tag">{{ categoryLabel(e.category) }}</span></td>
            <td class="muted">{{ e.description ?? '—' }}</td>
            <td class="mono red">−{{ fmt(e.amount) }}</td>
            <td class="action-cell">
              <button class="del-btn" @click="remove(e.id)">✕</button>
            </td>
          </tr>
          <tr v-if="filteredExpenses.length === 0 && (filterCategory && filterCategory !== 'fees')">
            <td colspan="5" class="empty-row">No expenses</td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup lang="ts">
import { EXPENSE_CATEGORIES, useExpenses } from '~/composables/useExpenses'

definePageMeta({ title: 'Expenses' })

const { sales } = useSales()
const { allCustomers } = useCustomers()
const { expenses, stripeFees, hostingFee, discountCost, manualExpenses, totalExpenses, expensesByCategory, expensesByMonth, addExpense, deleteExpense } = useExpenses(sales, allCustomers)
const { getSetting, setSetting } = useSettings()

const avgDiscount = computed(() => {
  const vals = allCustomers.value.filter((c: any) => c.discount > 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((s: number, c: any) => s + c.discount, 0) / vals.length)
})

const editingHosting  = ref(false)
const hostingInput    = ref('')

function startEditHosting() {
  hostingInput.value  = getSetting('hosting_monthly_fee', '18')
  editingHosting.value = true
}

async function saveHosting() {
  const val = parseInt(hostingInput.value)
  if (!isNaN(val) && val > 0) await setSetting('hosting_monthly_fee', String(val))
  editingHosting.value = false
}

const filterCategory = ref('')
const loading        = ref(false)
const errorMsg       = ref('')

const today = new Date().toISOString().slice(0, 10)
const form  = reactive({ amount: null as number | null, category: '', date: today, description: '' })

const filteredExpenses = computed(() =>
  filterCategory.value
    ? expenses.value.filter(e => e.category === filterCategory.value)
    : expenses.value
)

const thisMonthExpenses = computed(() => {
  const now = new Date()
  return expenses.value
    .filter(e => {
      const d = new Date(e.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, e) => sum + e.amount, 0)
})

const avgMonthExpenses = computed(() => {
  const months = expensesByMonth.value.filter(m => m.amount > 0)
  return months.length > 0 ? Math.round(months.reduce((s, m) => s + m.amount, 0) / months.length) : 0
})

const maxExpense = computed(() =>
  expensesByCategory.value.reduce((max, e) => Math.max(max, e.amount), 1)
)

function barWidth(amount: number) {
  return Math.round((amount / maxExpense.value) * 100)
}

function categoryLabel(val: string) {
  return EXPENSE_CATEGORIES.find(c => c.value === val)?.label ?? val
}

async function submit() {
  if (!form.amount || !form.category || !form.date) return
  loading.value  = true
  errorMsg.value = ''
  const { error } = await addExpense({
    amount:      form.amount,
    category:    form.category,
    date:        form.date,
    description: form.description || undefined,
  })
  if (error) errorMsg.value = error.message
  else {
    form.amount      = null
    form.category    = ''
    form.date        = today
    form.description = ''
  }
  loading.value = false
}

async function remove(id: number) {
  await deleteExpense(id)
}

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }

.metrics {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.panel {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.panel:hover { border-color: var(--border-light); }

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.form { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.field { display: flex; flex-direction: column; gap: 5px; }

.label { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }

.input {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--border-light); }

.btn {
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 6px;
  padding: 9px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: default; }

.error { font-size: 12px; color: var(--red); }

.breakdown { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.breakdown-row { display: flex; align-items: center; gap: 10px; }

.breakdown-label { font-size: 12px; color: var(--text-2); width: 120px; flex-shrink: 0; }

.breakdown-bar-wrap { flex: 1; background: var(--bg); border-radius: 3px; height: 6px; overflow: hidden; }

.breakdown-bar { height: 100%; background: var(--red, #F87171); border-radius: 3px; transition: width 0.3s; }

.breakdown-amount { font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: var(--text-3); width: 70px; text-align: right; }

.tbl-panel { }

.filter-select {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 5px 8px;
  font-size: 11px;
  color: var(--text-2);
  font-family: inherit;
  outline: none;
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

.mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; }
.muted { color: var(--text-3); }
.red { color: #F87171; }

.tag {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-2);
}

.action-cell { width: 40px; text-align: center; }

.del-btn {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.del-btn:hover { color: #F87171; background: rgba(248,113,113,0.1); }

.empty-row { text-align: center; color: var(--text-3); font-size: 12px; padding: 24px; }
.empty { font-size: 12px; color: var(--text-3); text-align: center; padding: 12px 0; }

.auto-row td { background: rgba(248,113,113,0.04); }
.tag-auto { background: rgba(248,113,113,0.12); color: #F87171; }

.edit-inline { display: flex; align-items: center; gap: 6px; }

.inline-input {
  width: 60px;
  background: var(--bg);
  border: 1px solid var(--border-light);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
  outline: none;
}

.save-btn {
  background: #4ADE80;
  color: #000;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
}
</style>
