import { reactive, computed } from 'vue'

const _products = reactive([
  { sku: '1', name: 'Item 1', price:  429, active: true,  type: 'dino'          },
  { sku: '2', name: 'Item 2', price:  389, active: true,  type: 'strukture'     },
  { sku: '3', name: 'Item 3', price:   89, active: true,  type: 'kit'           },
  { sku: '4', name: 'Item 4', price:  899, active: true,  type: 'account'       },
  { sku: '5', name: 'Item 5', price:  499, active: true,  type: 'resource'      },
  { sku: '6', name: 'Item 6', price:   55, active: true,  type: 'boss'          },
  { sku: '7', name: 'Item 7', price:  249, active: false, type: 'guide-service' },
  { sku: '8', name: 'Item 8', price:    9, active: true,  type: 'kit'           },
])

export function useProducts() {
  const allProducts = computed(() => _products)

  function getBySku(sku) {
    return _products.find(p => p.sku === sku) ?? null
  }

  return { allProducts, getBySku }
}
