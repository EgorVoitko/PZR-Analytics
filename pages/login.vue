<template>
  <div class="login-wrap">
    <div class="login-box">
      <div class="logo">
        <span class="logo-dot"></span>
        PZR Analytics
      </div>

      <div class="login-title">Sign in</div>
      <div class="login-sub">Use your account credentials to continue</div>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label class="field-label">Email</label>
          <input
            class="field-input"
            type="email"
            v-model="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label class="field-label">Password</label>
          <input
            class="field-input"
            type="password"
            v-model="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button class="submit-btn" type="submit" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Sign in</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { signIn, isAdmin } = useAuth()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''
  loading.value  = true
  try {
    await signIn(email.value, password.value)
    await navigateTo(isAdmin.value ? '/' : '/my', { replace: true })
  } catch (err: any) {
    errorMsg.value = err.message ?? 'Login failed. Check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-box {
  width: 100%;
  max-width: 360px;
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 36px 32px;
  animation: fadeUp 0.2s ease;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.3px;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
}

.logo-dot {
  width: 7px;
  height: 7px;
  background: var(--green);
  border-radius: 50%;
}

.login-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.login-sub {
  font-size: 12px;
  color: var(--text-3);
  margin-bottom: 28px;
}

.field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-3);
  margin-bottom: 6px;
}

.field-input {
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

.field-input::placeholder {
  color: var(--text-3);
}

.field-input:focus {
  border-color: var(--text-3);
}

.error-msg {
  font-size: 12px;
  color: var(--red);
  background: rgba(248,113,113,0.08);
  border: 1px solid rgba(248,113,113,0.2);
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
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
  gap: 8px;
  min-height: 38px;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(0,0,0,0.2);
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
