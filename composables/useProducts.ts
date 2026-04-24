// Module-level singletons
const _products = ref<any[]>([])
const _ready    = ref(false)

export function useProducts() {
  const client = useSupabaseClient()

  if (!_ready.value) {
    const doInit = async () => {
      const { data } = await client.from('products').select('*').order('id')
      _products.value = data ?? []
      _ready.value = true
    }
    doInit()
  }

  const allProducts = computed(() => _products.value)

  function getBySku(sku: string) {
    return _products.value.find(p => p.sku === sku) ?? null
  }

  function getById(id: any) {
    return _products.value.find(p => p.id === id) ?? null
  }

  return { allProducts, getBySku, getById }
}
