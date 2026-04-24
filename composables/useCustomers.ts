function calcTier(spent: number) {
  if (spent > 5000) return 'gold'
  if (spent > 2000) return 'silver'
  if (spent > 1000) return 'bronze'
  return 'none'
}

// Module-level singletons
const _customers = ref<any[]>([])
const _ready     = ref(false)

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

  const allCustomers = computed(() =>
    _customers.value.map(c => ({ ...c, tier: calcTier(c.spent) }))
  )

  function getById(id: any) {
    const c = _customers.value.find(c => String(c.id) === String(id))
    return c ? { ...c, tier: calcTier(c.spent) } : null
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
