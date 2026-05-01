// Module-level singletons
const _staff = ref<any[]>([])
const _ready  = ref(false)

export function useStaff() {
  const client = useSupabaseClient()

  if (!_ready.value) {
    const doInit = async () => {
      const { data } = await (client as any).rpc('get_staff_stats')
      _staff.value = (data ?? []).map((s: any) => ({
        ...s,
        sales:   Number(s.sales),
        revenue: Number(s.revenue),
      }))
      _ready.value = true
    }
    doInit()
  }

  const allStaff = computed(() => _staff.value)

  function getById(id: any) {
    return _staff.value.find(s => s.id === id) ?? null
  }

  async function refresh() {
    _ready.value = false
    const { data } = await (client as any).rpc('get_staff_stats')
    _staff.value = (data ?? []).map((s: any) => ({
      ...s,
      sales:   Number(s.sales),
      revenue: Number(s.revenue),
    }))
    _ready.value = true
  }

  return { allStaff, getById, refresh }
}
