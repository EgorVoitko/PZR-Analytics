import { reactive, computed } from 'vue'

const _products = reactive([
  { sku: '1', name: 'Item 1', price:  429, active: true  },
  { sku: '2', name: 'Item 2', price:  389, active: true  },
  { sku: '3', name: 'Item 3', price:   89, active: true  },
  { sku: '4', name: 'Item 4', price:  899, active: true  },
  { sku: '5', name: 'Item 5', price:  499, active: true  },
  { sku: '6', name: 'Item 6', price:   55, active: true  },
  { sku: '7', name: 'Item 7', price:  249, active: false },
  { sku: '8', name: 'Item 8', price:    9, active: true  },
])

export function useProducts() {
  const allProducts = computed(() => _products)

  function getBySku(sku) {
    return _products.find(p => p.sku === sku) ?? null
  }

  return { allProducts, getBySku }
}
