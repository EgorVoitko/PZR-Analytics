function calcTier(spent: number) {
  if (spent > 1000) return 'gold'
  if (spent > 500)  return 'silver'
  if (spent > 250)  return 'bronze'
  return 'none'
}

function calcDefaultDiscount(tier: string): number {
  if (tier === 'gold')   return 10
  if (tier === 'silver') return 5
  if (tier === 'bronze') return 2
  return 0
}

const _customers    = ref<any[]>([])
const _ready        = ref(false)
const _subscribed   = ref(false)

export function useCustomers() {
  const client = useSupabaseClient()

  if (!_ready.value) {
    const doInit = async () => {
      const { data } = await client
        .from('customers')
        .select('*')
        .order('spent', { ascending: false })
      _customers.value = data ?? []
      _ready.value = true
    }
    doInit()
  }

  if (!_subscribed.value) {
    _subscribed.value = true
    client
      .channel('customers-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customers' }, payload => {
        _customers.value.push(payload.new as any)
        _customers.value.sort((a, b) => b.spent - a.spent)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, payload => {
        const idx = _customers.value.findIndex(c => c.id === (payload.new as any).id)
        if (idx !== -1) {
          _customers.value[idx] = payload.new as any
          _customers.value.sort((a, b) => b.spent - a.spent)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'customers' }, payload => {
        _customers.value = _customers.value.filter(c => c.id !== (payload.old as any).id)
      })
      .subscribe()
  }

  const allCustomers = computed(() =>
    _customers.value.map(c => {
      const tier     = calcTier(c.spent)
      const discount = calcDefaultDiscount(tier)
      return { ...c, tier, discount }
    })
  )

  function getById(id: any) {
    const c = _customers.value.find(c => String(c.id) === String(id))
    if (!c) return null
    const tier     = calcTier(c.spent)
    const discount = calcDefaultDiscount(tier)
    return { ...c, tier, discount }
  }

  async function updateCustomer(id: any, data: any) {
    const { data: updated, error } = await client
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (!error && updated) {
      const idx = _customers.value.findIndex(c => c.id === id)
      if (idx !== -1) _customers.value[idx] = updated
    }
    return { error }
  }

  return { allCustomers, getById, updateCustomer }
}
