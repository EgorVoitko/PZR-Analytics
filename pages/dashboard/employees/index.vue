<template>
  <div>
    <div class="metrics">
      <UiMetricCard label="Total Staff"   :value="allStaff.length" />
      <UiMetricCard label="Online Now"    :value="onlineCount" />
      <UiMetricCard label="Total Sales"   :value="totalSales.toLocaleString('en-US')" />
      <UiMetricCard label="Total Revenue" :value="fmt(totalRevenue)" />
    </div>

    <div class="tbl-wrap">
      <div class="tbl-header">
        <div class="tbl-title">All Employees</div>
        <button class="add-btn" @click="modal = true">+ Add Employee</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Sales</th>
            <th>Revenue</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in allStaff" :key="s.id">
            <td>
              <div class="cell-ava-row">
                <div class="cell-ava">{{ s.initials }}</div>
                <span class="cell-name">{{ s.name }}</span>
              </div>
            </td>
            <td class="mono">{{ s.sales.toLocaleString('en-US') }}</td>
            <td class="mono">{{ fmt(s.revenue) }}</td>
            <td>
              <span class="tag" :class="s.online ? 'tag-on' : 'tag-off'">
                {{ s.online ? 'Online' : 'Offline' }}
              </span>
            </td>
            <td class="cell-action">
              <NuxtLink :to="`/dashboard/employees/${s.id}`" class="row-btn">View</NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Employee Modal -->
    <Teleport to="body">
      <div v-if="modal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-title">Add Employee</div>

          <div v-if="error" class="modal-error">{{ error }}</div>

          <div class="modal-field">
            <label class="modal-label">Full Name</label>
            <input class="modal-input" v-model="form.name" placeholder="Name" :disabled="loading" />
          </div>

          <div class="modal-field">
            <label class="modal-label">Email</label>
            <input class="modal-input" type="email" v-model="form.email" placeholder="employee@example.com" :disabled="loading" />
          </div>

          <div class="modal-field">
            <label class="modal-label">Password</label>
            <input class="modal-input" type="password" v-model="form.password" placeholder="••••••••" :disabled="loading" />
          </div>

          <div class="modal-actions">
            <button class="btn btn-ghost" @click="closeModal" :disabled="loading">Cancel</button>
            <button class="btn btn-primary" @click="create" :disabled="loading || !form.name || !form.email || !form.password">
              <span v-if="loading" class="spinner"></span>
              <span v-else>Create</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Employees' })

const { allStaff, refresh } = useStaff()

const onlineCount  = computed(() => allStaff.value.filter((s: any) => s.online).length)
const totalSales   = computed(() => allStaff.value.reduce((sum: number, s: any) => sum + s.sales, 0))
const totalRevenue = computed(() => allStaff.value.reduce((sum: number, s: any) => sum + s.revenue, 0))

function fmt(n: number) { return '$' + n.toLocaleString('en-US') }

const modal   = ref(false)
const loading = ref(false)
const error   = ref('')
const form    = reactive({ name: '', email: '', password: '' })

function closeModal() {
  if (loading.value) return
  modal.value = false
  error.value = ''
  form.name     = ''
  form.email    = ''
  form.password = ''
}

async function create() {
  if (!form.name || !form.email || !form.password) return
  error.value   = ''
  loading.value = true
  try {
    await $fetch('/api/employees/create', {
      method: 'POST',
      body: { name: form.name, email: form.email, password: form.password },
    })
    await refresh()
    loading.value = false
    closeModal()
  } catch (err: any) {
    error.value = err.data?.message ?? 'Failed to create employee.'
    loading.value = false
  }
}
</script>

<style scoped>
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}

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
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  background: var(--text);
  color: var(--bg);
  transition: opacity 0.15s;
}

.add-btn:hover {
  opacity: 0.85;
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

.cell-ava-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cell-ava {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-2);
  flex-shrink: 0;
}

.cell-name {
  font-weight: 500;
  color: var(--text);
}

.cell-action {
  text-align: right;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tag-on {
  background: rgba(74, 222, 128, 0.1);
  color: var(--green);
}

.tag-off {
  background: rgba(85, 85, 85, 0.2);
  color: var(--text-3);
}

.row-btn {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-light);
  background: var(--bg-hover);
  color: var(--text-2);
  transition: all 0.15s;
  text-decoration: none;
  font-family: inherit;
}

.row-btn:hover {
  color: var(--text);
  background: var(--border);
}

/* Modal */
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
  width: 400px;
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
  color: var(--text);
  margin-bottom: 20px;
}

.modal-error {
  font-size: 12px;
  color: var(--red);
  background: rgba(248, 113, 113, 0.08);
  border: 1px solid rgba(248, 113, 113, 0.2);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 14px;
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

.modal-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}

.modal-input:focus {
  border-color: var(--text-3);
}

.modal-input::placeholder {
  color: var(--text-3);
}

.modal-input:disabled {
  opacity: 0.5;
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

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--text-2);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--border-light);
}

.btn-primary {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 72px;
  justify-content: center;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.85;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0, 0, 0, 0.2);
  border-top-color: var(--bg);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
