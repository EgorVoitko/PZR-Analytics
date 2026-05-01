<template>
  <div>
    <!-- Success screen -->
    <div v-if="success">
      <p>Payment successful. Order #{{ saleId }}</p>
      <p>Product: {{ confirmedProduct }}</p>
      <p>Total: {{ confirmedTotal }}</p>
      <button @click="reset">New Payment</button>
    </div>

    <!-- Confirming screen -->
    <div v-else-if="confirming">
      <p>Confirming payment...</p>
    </div>

    <!-- Payment form -->
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
          {{ loading ? 'Redirecting to Stripe...' : 'Pay $' + ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const client  = useSupabaseClient()
const route   = useRoute()
const router  = useRouter()

const staffId = computed(() => route.query.staff as string || null)

const products         = ref<any[]>([])
const productId        = ref<number | ''>('')
const qty              = ref(1)
const name             = ref('')
const email            = ref('')
const loading          = ref(false)
const errorMsg         = ref('')
const confirming       = ref(false)
const success          = ref(false)
const saleId           = ref<number | null>(null)
const confirmedProduct = ref('')
const confirmedTotal   = ref('')

const selectedProduct = computed(() =>
  products.value.find(p => p.id === productId.value) ?? null
)

onMounted(async () => {
  const { data } = await client.from('products').select('id, name, price, type').eq('active', true).order('id')
  products.value = data ?? []

  if (route.query.success === 'true' && route.query.session_id) {
    confirming.value = true
    try {
      const res = await $fetch('/api/confirm-payment', {
        method: 'POST',
        body: { sessionId: route.query.session_id },
      }) as any
      saleId.value   = res.saleId
      success.value  = true
    } catch (err: any) {
      errorMsg.value = err.data?.message ?? 'Could not confirm payment.'
    } finally {
      confirming.value = false
      router.replace('/pay')
    }
  }
})

async function submit() {
  if (!productId.value || !name.value.trim() || !selectedProduct.value) return
  errorMsg.value = ''
  loading.value  = true

  confirmedProduct.value = selectedProduct.value.name
  confirmedTotal.value   = '$' + (selectedProduct.value.price * qty.value).toLocaleString('en-US')

  try {
    const res = await $fetch('/api/create-checkout', {
      method: 'POST',
      body: {
        productId:    productId.value,
        productName:  selectedProduct.value.name,
        productPrice: selectedProduct.value.price,
        qty:          qty.value,
        name:         name.value.trim(),
        email:        email.value.trim() || null,
        staffId:      staffId.value || null,
      },
    }) as any

    if (!res?.url) throw new Error('No checkout URL returned')
    window.location.href = res.url
  } catch (err: any) {
    errorMsg.value = err.data?.message ?? 'Failed to start checkout.'
    loading.value  = false
  }
}

function reset() {
  productId.value        = ''
  qty.value              = 1
  name.value             = ''
  email.value            = ''
  success.value          = false
  saleId.value           = null
  errorMsg.value         = ''
  confirmedProduct.value = ''
  confirmedTotal.value   = ''
}
</script>
