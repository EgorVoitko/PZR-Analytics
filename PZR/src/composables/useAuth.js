import { reactive, computed } from 'vue'
import { supabase } from '../lib/supabase.js'

const ROLE_CACHE_KEY = 'pzr-role'

// ── shared reactive state ─────────────────────────────────────────────────────
const state = reactive({
  session: null,
  profile: null,
  ready:   false,
})

// ── helpers ───────────────────────────────────────────────────────────────────
async function loadProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, name, initials, role')
    .eq('id', userId)
    .single()
  state.profile = data ?? null
  if (data?.role) localStorage.setItem(ROLE_CACHE_KEY, data.role)
}

// ── bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    const { data } = await supabase.auth.getSession()
    state.session = data.session ?? null

    if (data.session) {
      const userId = data.session.user.id

      // Race profile load against a timeout.
      // On slow/paused Supabase the request can hang — fall back to cached role
      // so the user stays logged in and routing works correctly.
      const loaded = await Promise.race([
        loadProfile(userId).then(() => true).catch(() => false),
        new Promise(resolve => setTimeout(() => resolve(false), 5000)),
      ])

      if (!loaded && !state.profile) {
        const cachedRole = localStorage.getItem(ROLE_CACHE_KEY)
        if (cachedRole) {
          const u = data.session.user
          state.profile = {
            id:       userId,
            email:    u.email ?? '',
            name:     u.user_metadata?.name ?? u.email ?? '',
            initials: (u.email ?? '??').slice(0, 2).toUpperCase(),
            role:     cachedRole,
          }
        }
      }
    }
  } catch {
    state.session = null
    state.profile = null
  } finally {
    state.ready = true
  }
}

init()

// Handle sign-in / sign-out / token refresh AFTER initial load
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'INITIAL_SESSION') return // handled by init()

  state.session = session ?? null
  if (session) {
    try { await loadProfile(session.user.id) } catch { state.profile = null }
  } else {
    state.profile = null
    localStorage.removeItem(ROLE_CACHE_KEY)
  }
})

// ── composable ────────────────────────────────────────────────────────────────
export function useAuth() {
  const isLoading  = computed(() => !state.ready)
  const isLoggedIn = computed(() => !!state.session && !!state.profile)
  const isAdmin    = computed(() => state.profile?.role === 'admin')

  const user = computed(() => {
    if (!state.session || !state.profile) return null
    return {
      id:        state.profile.id,
      email:     state.profile.email,
      name:      state.profile.name     ?? state.profile.email,
      initials:  state.profile.initials ?? state.profile.email.slice(0, 2).toUpperCase(),
      role:      state.profile.role,
      roleLabel: state.profile.role === 'admin' ? 'Administrator' : 'Employee',
      staffId:   null,
    }
  })

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.session) {
      state.session = data.session
      try { await loadProfile(data.session.user.id) } catch { state.profile = null }
    }
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem(ROLE_CACHE_KEY)
    state.session = null
    state.profile = null
  }

  async function refreshSession() {
    const { data } = await supabase.auth.refreshSession()
    if (data.session) {
      state.session = data.session
      try { await loadProfile(data.session.user.id) } catch { state.profile = null }
    }
  }

  return { user, isAdmin, isLoading, isLoggedIn, signIn, signOut, refreshSession }
}
