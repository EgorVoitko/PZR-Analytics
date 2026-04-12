<template>
  <aside class="sidebar">
    <nav class="nav">
      <template v-if="isAdmin">
        <div class="nav-label">Analytics</div>
        <RouterLink to="/dashboard" class="nav-item" active-class="active" exact-active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="8" width="3" height="6" rx="0.5"/>
              <rect x="7" y="4" width="3" height="10" rx="0.5"/>
              <rect x="12" y="2" width="3" height="12" rx="0.5"/>
            </svg>
          </span>
          Overview
        </RouterLink>
        <RouterLink to="/dashboard/employees" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="6" cy="5" r="2.5"/>
              <path d="M1 14v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1"/>
              <circle cx="12" cy="5" r="2" opacity="0.5"/>
            </svg>
          </span>
          Employees
        </RouterLink>
        <RouterLink to="/dashboard/customers" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2 15v-1a6 6 0 0 1 12 0v1"/>
            </svg>
          </span>
          Customers
        </RouterLink>

        <div class="nav-label">Data</div>
        <RouterLink to="/dashboard/sales" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="4" x2="13" y2="4"/>
              <line x1="3" y1="8" x2="13" y2="8"/>
              <line x1="3" y1="12" x2="10" y2="12"/>
            </svg>
          </span>
          Sales
        </RouterLink>
      </template>

      <template v-else>
        <div class="nav-label">My</div>
        <RouterLink to="/my" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="8" cy="5" r="3"/>
              <path d="M2 15v-1a6 6 0 0 1 12 0v1"/>
            </svg>
          </span>
          Dashboard
        </RouterLink>

        <div class="nav-label">Data</div>
        <RouterLink to="/dashboard/sales" class="nav-item" active-class="active">
          <span class="nav-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="3" y1="4" x2="13" y2="4"/>
              <line x1="3" y1="8" x2="13" y2="8"/>
              <line x1="3" y1="12" x2="10" y2="12"/>
            </svg>
          </span>
          My Sales
        </RouterLink>
      </template>
    </nav>

    <div class="sidebar-bottom">
      <div class="role-toggle">
        <button
          class="role-btn"
          :class="{ active: isAdmin }"
          @click="handleSwitchRole('admin')"
        >
          Admin
        </button>
        <button
          class="role-btn"
          :class="{ active: !isAdmin }"
          @click="handleSwitchRole('employee')"
        >
          Employee
        </button>
      </div>

      <div class="user-card">
        <div class="user-ava">{{ user.initials }}</div>
        <div>
          <div class="user-name">{{ user.name }}</div>
          <div class="user-role">{{ user.roleLabel }}</div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useAuth } from '../../composables/useAuth.js'
import { useRouter } from 'vue-router'

const { user, isAdmin, switchRole } = useAuth()
const router = useRouter()

function handleSwitchRole(role) {
  switchRole(role)
  if (role === 'admin') {
    router.push('/dashboard')
  } else {
    router.push('/my')
  }
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
  padding: 0;
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
}

.sidebar-bottom {
  padding: 12px 8px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-toggle {
  display: flex;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.role-btn {
  flex: 1;
  padding: 5px 0;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.role-btn:hover {
  color: var(--text-2);
}

.role-btn.active {
  background: var(--bg-raised);
  color: var(--text);
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

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.3;
}

.user-role {
  font-size: 11px;
  color: var(--text-3);
  line-height: 1.3;
}
</style>
