import type { Sale } from './useSales'

export const EXPENSE_CATEGORIES = [
  { value: 'marketing', label: 'Marketing' },
  { value: 'software',  label: 'Software' },
  { value: 'salary',    label: 'Salary' },
  { value: 'other',     label: 'Other' },
]

// Stripe: 2.9% + $0.30 per transaction
const STRIPE_RATE = 0.029
const STRIPE_FLAT = 0.30

export interface Expense {
  id:          number
  amount:      number
  category:    string
  description: string | null
  createdAt:   string
  date:        string
}

export interface AutoExpense {
  label:       string
  amount:      number
  description: string
}

const _expenses = ref<Expense[]>([])
const _ready    = ref(false)

function normalize(row: Record<string, any>): Expense {
  const d = new Date(row.created_at)
  const p = (n: number) => String(n).padStart(2, '0')
  return {
    id:          row.id,
    amount:      row.amount,
    category:    row.category,
    description: row.description ?? null,
    createdAt:   row.created_at,
    date:        `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`,
  }
}

export function useExpenses(sales?: Ref<Sale[]>, customers?: Ref<any[]>) {
  const client             = useSupabaseClient()
  const { getSetting }     = useSettings()

  if (!_ready.value) {
    _ready.value = true
    client
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        _expenses.value = (data ?? []).map(normalize)
      })
  }

  // Stripe fee
  const stripeFees = computed<AutoExpense>(() => {
    const list   = sales?.value ?? []
    const amount = list.reduce((sum, s) => sum + Math.round(s.total * STRIPE_RATE + STRIPE_FLAT), 0)
    return {
      label:       'Stripe Processing Fees',
      amount,
      description: `${(STRIPE_RATE * 100).toFixed(1)}% + $${STRIPE_FLAT.toFixed(2)}/transaction × ${list.length} sales`,
    }
  })

  // Hosting fee
  const hostingFee = computed<AutoExpense>(() => {
    const list        = sales?.value ?? []
    const monthlyFee  = Number(getSetting('hosting_monthly_fee', '18'))

    const months = new Set(
      list.map(s => {
        const d = new Date(s.createdAt)
        return `${d.getFullYear()}-${d.getMonth()}`
      })
    )
    const now = new Date()
    months.add(`${now.getFullYear()}-${now.getMonth()}`)

    const amount = monthlyFee * months.size
    return {
      label:       'Hosting',
      amount,
      description: `$${monthlyFee}/month × ${months.size} months`,
    }
  })

  // Discount cost
  const discountCost = computed<AutoExpense>(() => {
    const salesList     = sales?.value ?? []
    const customersList = customers?.value ?? []

    const discountMap = new Map<number, number>()
    for (const c of customersList) {
      if (c.discount > 0) discountMap.set(c.id, c.discount)
    }

    let amount        = 0
    let affectedSales = 0

    for (const s of salesList) {
      const rate = s.customerId ? (discountMap.get(s.customerId) ?? 0) : 0
      if (rate > 0) {
        amount += Math.round(s.total * rate / 100)
        affectedSales++
      }
    }

    return {
      label:       'Customer Discounts',
      amount,
      description: `${affectedSales} sales with active discount`,
    }
  })

  const manualExpenses = computed(() =>
    _expenses.value.reduce((sum, e) => sum + e.amount, 0)
  )

  // Total = manual + Stripe fees + hosting + discounts
  const totalExpenses = computed(() =>
    manualExpenses.value + stripeFees.value.amount + hostingFee.value.amount + discountCost.value.amount
  )

  const expensesByCategory = computed(() => {
    const totals: Record<string, number> = {}
    for (const e of _expenses.value) {
      totals[e.category] = (totals[e.category] ?? 0) + e.amount
    }
    const result = Object.entries(totals).map(([category, amount]) => ({
      category,
      label: EXPENSE_CATEGORIES.find(c => c.value === category)?.label ?? category,
      amount,
      auto: false,
    }))
    if (stripeFees.value.amount > 0)
      result.push({ category: 'fees',      label: 'Stripe Fees',        amount: stripeFees.value.amount,  auto: true })
    if (hostingFee.value.amount > 0)
      result.push({ category: 'hosting',   label: 'Hosting',            amount: hostingFee.value.amount,  auto: true })
    if (discountCost.value.amount > 0)
      result.push({ category: 'discounts', label: 'Customer Discounts', amount: discountCost.value.amount, auto: true })
    return result.sort((a, b) => b.amount - a.amount)
  })

  const expensesByMonth = computed(() => {
    const now  = new Date()
    const list = sales?.value ?? []
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)

      const manual = _expenses.value
        .filter(e => {
          const ed = new Date(e.createdAt)
          return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth()
        })
        .reduce((sum, e) => sum + e.amount, 0)

      const stripe = list
        .filter(s => {
          const sd = new Date(s.createdAt)
          return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
        })
        .reduce((sum, s) => sum + Math.round(s.total * STRIPE_RATE + STRIPE_FLAT), 0)

      return {
        label:  d.toLocaleString('en-US', { month: 'short' }),
        amount: manual + stripe,
      }
    })
  })

  async function addExpense(data: { amount: number; category: string; description?: string; date?: string }) {
    const payload: Record<string, any> = {
      amount:      data.amount,
      category:    data.category,
      description: data.description || null,
    }
    if (data.date) payload.created_at = new Date(data.date).toISOString()

    const { data: created, error } = await client
      .from('expenses')
      .insert(payload)
      .select()
      .single()

    if (!error && created) _expenses.value.unshift(normalize(created))
    return { error }
  }

  async function deleteExpense(id: number) {
    const { error } = await client.from('expenses').delete().eq('id', id)
    if (!error) _expenses.value = _expenses.value.filter(e => e.id !== id)
    return { error }
  }

  return {
    expenses: _expenses,
    stripeFees,
    hostingFee,
    discountCost,
    manualExpenses,
    totalExpenses,
    expensesByCategory,
    expensesByMonth,
    addExpense,
    deleteExpense,
  }
}
