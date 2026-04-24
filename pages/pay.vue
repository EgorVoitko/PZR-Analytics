<template>
  <div>
    <div v-if="success">
      <p>Payment successful. Order #{{ saleId }}</p>
      <p>Product: {{ selectedProduct?.name }}</p>
      <p>Qty: {{ qty }}</p>
      <p>Total: ${{ ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}</p>
      <button @click="reset">New Payment</button>
    </div>

    <div v-else>
      <p v-if="errorMsg">{{ errorMsg }}</p>

      <form @submit.prevent="submit">
        <div>
          <label>Product</label><br />
          <select v-model="productId" :disabled="loading || products.length === 0">
            <option disabled value="">
              {{ products.length === 0 ? 'Loading...' : 'Select product' }}
            </option>
            <option v-for="p in products" :key="p.id" :value="p.id">
              {{ p.name }} — ${{ p.price.toLocaleString('en-US') }}
            </option>
          </select>
        </div>

        <div>
          <label>Quantity</label><br />
          <input v-model.number="qty" type="number" min="1" max="99" :disabled="loading" />
        </div>

        <div>
          <label>Total: ${{ ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}</label>
        </div>

        <div>
          <label>Full Name</label><br />
          <input v-model="name" type="text" placeholder="John Doe" required :disabled="loading" />
        </div>

        <div>
          <label>Email (optional)</label><br />
          <input v-model="email" type="email" placeholder="you@example.com" :disabled="loading" />
        </div>

        <button type="submit" :disabled="loading || !productId || !name.trim()">
          {{ loading ? 'Processing...' : 'Pay $' + ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const client = useSupabaseClient()

const products      = ref<any[]>([])
const productId     = ref<number | ''>('')
const qty           = ref(1)
const name          = ref('')
const email         = ref('')
const loading       = ref(false)
const errorMsg      = ref('')
const success       = ref(false)
const saleId        = ref<number | null>(null)

const selectedProduct = computed(() =>
  products.value.find(p => p.id === productId.value) ?? null
)

onMounted(async () => {
  const { data } = await client.from('products').select('id, name, price, type').eq('active', true).order('id')
  products.value = data ?? []
})

async function submit() {
  if (!productId.value || !name.value.trim()) return
  errorMsg.value = ''
  loading.value  = true
  try {
    const { data, error } = await (client as any).rpc('create_public_payment', {
      p_product_id: productId.value,
      p_qty:        qty.value,
      p_name:       name.value.trim(),
      p_email:      email.value.trim() || null,
    })
    if (error) throw error
    saleId.value  = data
    success.value = true
  } catch (err: any) {
    errorMsg.value = err.message ?? 'Payment failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function reset() {
  productId.value = ''
  qty.value       = 1
  name.value      = ''
  email.value     = ''
  success.value   = false
  saleId.value    = null
  errorMsg.value  = ''
}
</script>
