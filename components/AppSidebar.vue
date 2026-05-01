<template>
  <aside class="sidebar">
    <nav class="nav">
      <template v-if="isAdmin">
        <div class="nav-label">Analytics</div>
        <NuxtLink to="/" class="nav-item" active-class="active" exact-active-class="active">
          <span class="mi nav-icon">bar_chart</span>
          Overview
        </NuxtLink>
        <NuxtLink to="/dashboard/employees" class="nav-item" active-class="active">
          <span class="mi nav-icon">group</span>
          Employees
        </NuxtLink>
        <NuxtLink to="/dashboard/customers" class="nav-item" active-class="active">
          <span class="mi nav-icon">person</span>
          Customers
        </NuxtLink>

        <div class="nav-label">Data</div>
        <NuxtLink to="/dashboard/sales" class="nav-item" active-class="active">
          <span class="mi nav-icon">receipt_long</span>
          Sales
        </NuxtLink>
      </template>

      <template v-else>
        <div class="nav-label">My</div>
        <NuxtLink to="/my" class="nav-item" active-class="active">
          <span class="mi nav-icon">dashboard</span>
          Dashboard
        </NuxtLink>

        <div class="nav-label">Data</div>
        <NuxtLink to="/dashboard/sales" class="nav-item" active-class="active">
          <span class="mi nav-icon">receipt_long</span>
          My Sales
        </NuxtLink>
      </template>
    </nav>

    <!-- Personal payment link for employees -->
    <div v-if="!isAdmin && user?.staffId" class="pay-link-wrap">
      <div class="pay-link-label">My payment link</div>
      <button class="pay-link-btn" :title="copied ? 'Copied!' : 'Copy link'" @click="copyLink">
        <span class="mi" style="font-size:15px">{{ copied ? 'check' : 'content_copy' }}</span>
        {{ copied ? 'Copied!' : 'Copy link' }}
      </button>
    </div>

    <div class="sidebar-bottom">
      <div class="user-card">
        <div class="user-ava">{{ user?.initials ?? '?' }}</div>
        <div class="user-info">
          <div class="user-name">{{ user?.name ?? '—' }}</div>
          <div class="user-role">{{ user?.roleLabel ?? '' }}</div>
        </div>
        <button class="logout-btn" title="Sign out" @click="signOut">
          <span class="mi" style="font-size:16px">logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const { user, isAdmin, signOut } = useAuth()

const copied = ref(false)

function copyLink() {
  if (!user.value?.staffId) return
  const url = `${window.location.origin}/pay?staff=${user.value.staffId}`
  navigator.clipboard.writeText(url)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-w);
  height: 100vh;
  background: var(--bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav {
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  padding: 10px 8px 4px;
  margin-top: 4px;
}

.nav-label:first-child {
  margin-top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-2);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  text-decoration: none;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.nav-item.active {
  background: var(--bg-hover);
  color: var(--text);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: inherit;
  font-size: 18px;
}

.sidebar-bottom {
  padding: 12px 8px 16px;
  border-top: 1px solid var(--border);
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: var(--bg);
  border: 1px solid var(--border);
}

.user-ava {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: var(--bg-hover);
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

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.3;
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.logout-btn:hover {
  color: var(--red);
  border-color: rgba(248, 113, 113, 0.3);
  background: rgba(248, 113, 113, 0.06);
}

.pay-link-wrap {
  padding: 0 8px 8px;
}

.pay-link-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-3);
  padding: 10px 0 4px;
}

.pay-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.pay-link-btn:hover {
  color: var(--text);
  border-color: var(--border-light);
  background: var(--bg-hover);
}
</style>
