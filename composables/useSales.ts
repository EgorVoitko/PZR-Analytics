function formatDate(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function parseDate(str: string) {
  if (!str) return new Date().toISOString()
  const [datePart, timePart = '00:00'] = str.split(' ')
  const [dd, mm, yyyy] = datePart.split('.')
  const [hh, min] = timePart.split(':')
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).toISOString()
}

function normalize(row: any) {
  return {
    id:            row.id,
    date:          formatDate(row.created_at),
    createdAt:     row.created_at,
    staffId:       row.staff_id ?? null,
    staffName:     row.staff?.name  ?? '—',
    productId:     row.product_id ?? null,
    productName:   row.product?.name ?? '—',
    productType:   row.product?.type ?? null,
    customerId:    row.customer_id ?? null,
    qty:           row.qty,
    total:         row.total,
    edited:        row.edited,
    paymentStatus: row.payment_status,
  }
}

const _prevMonthRaw = [
  0, 389, 0, 499, 0, 178, 0, 429, 0, 899,
  0, 249, 165, 0, 389, 429, 0, 499, 0, 899,
  178, 0, 429, 0, 165, 389, 0, 249,
]

// Module-level singletons — persist across page navigation
const _sales      = ref<any[]>([])
const _ready      = ref(false)
const _subscribed = ref(false)

export function useSales(staffId: any = null) {
  const client = useSupabaseClient()
  const _id = isRef(staffId) ? staffId : ref(staffId)

  if (!_ready.value) {
    const doInit = async () => {
      const { data } = await client
        .from('sales')
        .select('*, product:products(id,name,price,type), staff:profiles(id,name,initials)')
        .order('created_at', { ascending: false })
      _sales.value = (data ?? []).map(normalize)
      _ready.value = true
    }
    doInit()
  }

  if (!_subscribed.value) {
    _subscribed.value = true
    client
      .channel('sales-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales' }, async payload => {
        const { data } = await client
          .from('sales')
          .select('*, product:products(id,name,price,type), staff:profiles(id,name,initials)')
          .eq('id', (payload.new as any).id)
          .single()
        if (data) _sales.value.unshift(normalize(data))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sales' }, async payload => {
        const { data } = await client
          .from('sales')
          .select('*, product:products(id,name,price,type), staff:profiles(id,name,initials)')
          .eq('id', (payload.new as any).id)
          .single()
        if (data) {
          const idx = _sales.value.findIndex(s => s.id === (data as any).id)
          if (idx !== -1) _sales.value[idx] = normalize(data)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'sales' }, payload => {
        _sales.value = _sales.value.filter(s => s.id !== (payload.old as any).id)
      })
      .subscribe()
  }

  const sales = computed(() =>
    _id.value
      ? _sales.value.filter(s => s.staffId === _id.value)
      : _sales.value
  )

  const totalRevenue = computed(() =>
    sales.value.reduce((sum: number, s: any) => sum + s.total, 0)
  )

  const salesCount = computed(() => sales.value.length)

  const todayRevenue = computed(() => {
    const d = new Date()
    const today = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
    return sales.value
      .filter((s: any) => s.date.startsWith(today))
      .reduce((sum: number, s: any) => sum + s.total, 0)
  })

  const revenueByMonth = computed(() => {
    const now = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1
    const days  = new Date(year, month, 0).getDate()
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1
      const dateStr = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
      const revenue = sales.value
        .filter((s: any) => s.date.startsWith(dateStr))
        .reduce((sum: number, s: any) => sum + s.total, 0)
      return { day, label: String(day), revenue }
    })
  })

  const revenueByWeek = computed(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const dateStr = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
      const revenue = sales.value
        .filter((s: any) => s.date.startsWith(dateStr))
        .reduce((sum: number, s: any) => sum + s.total, 0)
      return {
        label: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue,
      }
    })
  )

  const revenueByYear = computed(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (11 - i))
      const year  = d.getFullYear()
      const month = d.getMonth() + 1
      const label = d.toLocaleString('en-US', { month: 'short' })
      const revenue = sales.value
        .filter((s: any) => {
          const sd = new Date(s.createdAt)
          return sd.getFullYear() === year && sd.getMonth() + 1 === month
        })
        .reduce((sum: number, s: any) => sum + s.total, 0)
      return { label, revenue }
    })
  )

  const prevMonthByDay = computed(() => {
    let ratio = 1
    if (_id.value && _sales.value.length > 0) {
      const total = _sales.value.reduce((s: number, x: any) => s + x.total, 0)
      const mine  = _sales.value.filter((x: any) => x.staffId === _id.value).reduce((s: number, x: any) => s + x.total, 0)
      ratio = total > 0 ? mine / total : 0
    }
    return _prevMonthRaw.map((revenue, i) => ({
      day: i + 1,
      label: String(i + 1),
      revenue: Math.round(revenue * ratio),
    }))
  })

  function recentSales(limit = 5) {
    return sales.value.slice(0, limit)
  }

  async function addSale(data: any) {
    const { data: created, error } = await client
      .from('sales')
      .insert({
        staff_id:   data.staffId,
        product_id: data.productId,
        qty:        data.qty,
        total:      data.total,
        created_at: data.date ? parseDate(data.date) : undefined,
      })
      .select('*, product:products(id,name,price,type), staff:profiles(id,name,initials)')
      .single()
    if (!error && created) _sales.value.unshift(normalize(created))
    return { error }
  }

  async function editSale(id: any, data: any) {
    const update: any = {
      staff_id:   data.staffId,
      product_id: data.productId,
      qty:        data.qty,
      total:      data.total,
      edited:     true,
    }
    if (data.date) update.created_at = parseDate(data.date)

    const { data: updated, error } = await client
      .from('sales')
      .update(update)
      .eq('id', id)
      .select('*, product:products(id,name,price,type), staff:profiles(id,name,initials)')
      .single()
    if (!error && updated) {
      const idx = _sales.value.findIndex(s => s.id === id)
      if (idx !== -1) _sales.value[idx] = normalize(updated)
    }
    return { error }
  }

  async function deleteSale(id: any) {
    const { error } = await client.from('sales').delete().eq('id', id)
    if (!error) _sales.value = _sales.value.filter(s => s.id !== id)
    return { error }
  }

  return {
    sales,
    totalRevenue,
    salesCount,
    todayRevenue,
    revenueByMonth,
    revenueByWeek,
    revenueByYear,
    prevMonthByDay,
    recentSales,
    addSale,
    editSale,
    deleteSale,
  }
}
