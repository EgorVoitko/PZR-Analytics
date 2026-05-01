<template>
  <div class="page">

    <!-- Success -->
    <div v-if="success" class="card">
      <div class="success-mark">✓</div>
      <h2 class="card-title">Payment successful</h2>
      <p class="card-sub">Order #{{ saleId }}</p>

      <div class="receipt">
        <div class="receipt-row">
          <span>Item</span>
          <span>{{ confirmedProduct }}</span>
        </div>
        <div class="receipt-row receipt-total">
          <span>Total paid</span>
          <span>{{ confirmedTotal }}</span>
        </div>
      </div>

      <button class="btn" @click="reset">New order</button>
    </div>

    <!-- Confirming -->
    <div v-else-if="confirming" class="card">
      <p class="card-sub">Confirming payment…</p>
    </div>

    <!-- Form -->
    <div v-else class="card">
      <div class="logo">
        <span class="logo-dot"></span>
        PZR Analytics
      </div>

      <h2 class="card-title">Checkout</h2>

      <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

      <form @submit.prevent="submit">

        <div class="field">
          <label class="label">Category</label>
          <select
            class="input"
            v-model="selectedCategory"
            :disabled="loading || products.length === 0"
            @change="productId = ''"
          >
            <option disabled value="">
              {{ products.length === 0 ? 'Loading…' : 'Select category' }}
            </option>
            <option v-for="cat in categories" :key="cat.slug" :value="cat.slug">
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="field">
          <label class="label">Item</label>
          <select
            class="input"
            v-model="productId"
            :disabled="loading || !selectedCategory"
          >
            <option disabled value="">Select item</option>
            <option v-for="p in filteredProducts" :key="p.id" :value="p.id">
              {{ p.name }}{{ p.quantity ? ' — x' + p.quantity : '' }} — ${{ p.price }}
            </option>
          </select>
          <p v-if="selectedProduct?.quantity" class="hint">
            You will receive {{ selectedProduct.quantity }} units per order
          </p>
        </div>

        <div class="field">
          <label class="label">Orders</label>
          <input class="input" v-model.number="qty" type="number" min="1" max="99" :disabled="loading" />
        </div>

        <div class="total-row">
          <span class="total-label">Total</span>
          <span class="total-value">${{ ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}</span>
        </div>

        <div class="divider"></div>

        <div class="field">
          <label class="label">Full Name</label>
          <input class="input" v-model="name" type="text" placeholder="John Doe" required :disabled="loading" />
        </div>

        <div class="field">
          <label class="label">Email <span class="optional">(optional)</span></label>
          <input class="input" v-model="email" type="email" placeholder="you@example.com" :disabled="loading" />
        </div>

        <button
          class="btn btn-pay"
          type="submit"
          :disabled="loading || !productId || !name.trim()"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>Pay ${{ ((selectedProduct?.price ?? 0) * qty).toLocaleString('en-US') }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const CATEGORY_LABELS: Record<string, string> = {
  dino:              'Dino',
  boss:              'Boss',
  basic_resource:    'Basic Resource',
  advanced_resource: 'Advanced Resource',
  consumable:        'Consumable',
  dye:               'Dye',
  weapon:            'Weapon',
  armor:             'Armor',
  saddle:            'Saddle',
  tek_structure:     'Tek Structure',
  metal_structure:   'Metal Structure',
  utility:           'Utility',
}

const client  = useSupabaseClient()
const route   = useRoute()
const router  = useRouter()

const staffId = computed(() => route.query.staff as string || null)

const products         = ref<any[]>([])
const selectedCategory = ref('')
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

const categories = computed(() => {
  const slugs = [...new Set(products.value.map((p: any) => p.type))]
  return slugs.map(slug => ({ slug, name: CATEGORY_LABELS[slug] ?? slug }))
})

const filteredProducts = computed(() =>
  products.value.filter((p: any) => p.type === selectedCategory.value)
)

const selectedProduct = computed(() =>
  products.value.find(p => p.id === productId.value) ?? null
)

onMounted(async () => {
  const { data } = await client
    .from('products')
    .select('id, name, price, type, quantity')
    .eq('active', true)
    .order('name')
  products.value = data ?? []

  if (route.query.success === 'true' && route.query.session_id) {
    confirming.value = true
    try {
      const res = await $fetch('/api/confirm-payment', {
        method: 'POST',
        body: { sessionId: route.query.session_id },
      }) as any
      saleId.value  = res.saleId
      success.value = true
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
  selectedCategory.value = ''
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

<style scoped>
.page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 32px;
}

.logo {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.logo-dot {
  width: 7px;
  height: 7px;
  background: var(--green);
  border-radius: 50%;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.3px;
  margin-bottom: 24px;
}

.card-sub {
  font-size: 13px;
  color: var(--text-3);
  margin-bottom: 20px;
  font-family: 'IBM Plex Mono', monospace;
}

.error {
  font-size: 12px;
  color: var(--red);
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 14px;
}

.label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-3);
  margin-bottom: 6px;
}

.optional {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.input {
  width: 100%;
  padding: 9px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text);
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus {
  border-color: var(--text-3);
}

.input::placeholder {
  color: var(--text-3);
}

.input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.input option {
  background: var(--bg-raised);
}

.hint {
  font-size: 11px;
  color: var(--green);
  margin-top: 5px;
}

.total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 7px;
  margin-bottom: 14px;
}

.total-label {
  font-size: 12px;
  color: var(--text-3);
  font-weight: 500;
}

.total-value {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--green);
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 18px 0;
}

.btn {
  width: 100%;
  padding: 11px;
  margin-top: 4px;
  background: var(--text);
  color: var(--bg);
  border: none;
  border-radius: 7px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.btn:hover:not(:disabled) {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-pay {
  background: var(--green);
  color: #000;
}

/* Success */
.success-mark {
  font-size: 28px;
  color: var(--green);
  margin-bottom: 12px;
}

.receipt {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  margin: 20px 0;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-2);
  padding: 3px 0;
}

.receipt-total {
  border-top: 1px solid var(--border);
  margin-top: 8px;
  padding-top: 10px;
  font-weight: 600;
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
