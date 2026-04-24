<template>
  <div>
    <div class="tbl-wrap">
      <div class="tbl-header">
        <div class="tbl-title">{{ isAdmin ? 'Sales History' : 'My Sales' }}</div>
        <button v-if="isAdmin" class="add-btn" @click="openAdd">+ Add Sale</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>Product</th>
            <th>Qty</th>
            <th>Total</th>
            <th v-if="isAdmin"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in displaySales" :key="s.id">
            <td class="mono muted">{{ s.date }}</td>
            <td>{{ s.staffName }}</td>
            <td class="cell-name">
              {{ s.productName }}
              <span v-if="s.edited" class="edited-tag">edited</span>
            </td>
            <td class="mono">{{ s.qty }}</td>
            <td class="mono green">+{{ fmt(s.total) }}</td>
            <td v-if="isAdmin" class="cell-action">
              <div class="row-actions">
                <button class="row-btn" @click="openEdit(s)">Edit</button>
                <button class="row-btn row-btn-del" @click="confirmDelete(s)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="displaySales.length === 0">
            <td :colspan="isAdmin ? 6 : 5" class="empty">No sales found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Teleport to="body">
      <div v-if="modal.open" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-title">{{ modal.isAdd ? 'Add Sale' : 'Edit Sale' }}</div>

          <div class="modal-field">
            <label class="modal-label">Date &amp; Time</label>
            <input class="modal-input" v-model="modal.date" placeholder="DD.MM.YYYY HH:MM" />
          </div>

          <div class="modal-field">
            <label class="modal-label">Employee</label>
            <select class="modal-select" v-model="modal.staffId">
              <option v-for="s in allStaff" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>

          <div class="modal-field">
            <label class="modal-label">Product</label>
            <select class="modal-select" v-model="modal.productId">
              <option v-for="p in allProducts" :key="p.id" :value="p.id">{{ p.name }} — ${{ p.price }}</option>
            </select>
          </div>

          <div class="modal-field">
            <label class="modal-label">Qty</label>
            <input class="modal-input" type="number" min="1" v-model.number="modal.qty" />
          </div>

          <div class="modal-summary">
            Total: <strong>{{ fmt(modalTotal) }}</strong>
          </div>

          <div class="modal-actions">
            <button v-if="!modal.isAdd" class="btn btn-danger" @click="doDelete">Delete</button>
            <div style="flex:1"></div>
            <button class="btn btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn btn-primary" @click="doSave">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Sales' })

const { user, isAdmin } = useAuth()
const { allStaff }      = useStaff()
const { allProducts }   = useProducts()

const filterStaffId = computed(() => isAdmin.value ? null : user.value?.staffId)
const { sales, editSale, deleteSale, addSale } = useSales(filterStaffId)

const displaySales = computed(() => [...sales.value])

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }

const modal = reactive({
  open: false, isAdd: false, id: null as any,
  date: '', staffId: null as any, productId: null as any, qty: 1,
})

const modalTotal = computed(() => {
  const price = allProducts.value.find((p: any) => p.id === modal.productId)?.price ?? 0
  return price * modal.qty
})

function openEdit(s: any) {
  Object.assign(modal, { isAdd: false, id: s.id, date: s.date, staffId: s.staffId, productId: s.productId, qty: s.qty, open: true })
}

function openAdd() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  Object.assign(modal, {
    isAdd: true, id: null,
    date: `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    staffId: allStaff.value[0]?.id ?? null,
    productId: allProducts.value[0]?.id ?? null,
    qty: 1, open: true,
  })
}

function closeModal() { modal.open = false }

function doSave() {
  const data = { date: modal.date, staffId: modal.staffId, productId: modal.productId, qty: modal.qty, total: modalTotal.value }
  if (modal.isAdd) addSale(data)
  else editSale(modal.id, data)
  closeModal()
}

function confirmDelete(s: any) { openEdit(s) }
function doDelete() { deleteSale(modal.id); closeModal() }
</script>

<style scoped>
.tbl-wrap {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 28px;
}

.tbl-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tbl-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.add-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  transition: all 0.15s;
}

.add-btn:hover {
  color: var(--text);
  border-color: var(--border-light);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-3);
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
}

td {
  padding: 10px 20px;
  font-size: 13px;
  color: var(--text-2);
  border-bottom: 1px solid rgba(37, 37, 37, 0.6);
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  background: var(--bg-hover);
}

.mono {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
}

.muted {
  color: var(--text-3);
}

.cell-name {
  font-weight: 500;
  color: var(--text);
}

.cell-action {
  text-align: right;
}

.green {
  color: var(--green);
}

.edited-tag {
  display: inline-block;
  font-size: 9px;
  font-weight: 600;
  color: var(--amber);
  background: rgba(251, 191, 36, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
  margin-left: 6px;
  vertical-align: middle;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.row-btn {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  transition: all 0.15s;
}

.row-btn:hover {
  color: var(--text-2);
  border-color: var(--border-light);
}

.row-btn-del:hover {
  color: var(--red);
  border-color: rgba(248, 113, 113, 0.3);
}

.empty {
  text-align: center;
  color: var(--text-3);
  padding: 24px 20px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 28px;
  width: 420px;
  max-width: 90vw;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text);
}

.modal-field {
  margin-bottom: 14px;
}

.modal-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.modal-input,
.modal-select {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.modal-input:focus,
.modal-select:focus {
  border-color: var(--text-3);
}

.modal-select option {
  background: var(--bg-raised);
  color: var(--text);
}

.modal-summary {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 4px;
  margin-bottom: 4px;
}

.modal-summary strong {
  color: var(--green);
  font-family: 'IBM Plex Mono', monospace;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.15s;
}

.btn-ghost {
  background: transparent;
  color: var(--text-2);
}

.btn-ghost:hover {
  color: var(--text);
  border-color: var(--border-light);
}

.btn-primary {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-danger {
  background: transparent;
  color: var(--red);
  border-color: rgba(248, 113, 113, 0.3);
}

.btn-danger:hover {
  background: var(--red);
  color: white;
  border-color: var(--red);
}
</style>
