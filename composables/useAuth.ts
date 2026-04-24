const ROLE_CACHE_KEY = 'pzr-role'

export function useAuth() {
  const client = useSupabaseClient()
  const store = useAuthStore()

  const isLoggedIn = computed(() => !!store.profile)
  const isAdmin = computed(() => store.isAdmin)
  const isLoading = computed(() => !store.initialized)

  const user = computed(() => {
    const p = store.profile
    if (!p) return null
    return {
      id: p.id,
      email: p.email,
      name: p.name ?? p.email,
      initials: p.initials ?? p.email.slice(0, 2).toUpperCase(),
      role: p.role,
      roleLabel: p.role === 'admin' ? 'Administrator' : 'Employee',
      staffId: p.role === 'employee' ? p.id : null,
    }
  })

  async function loadProfile(userId: string) {
    const { data } = await client
      .from('profiles')
      .select('id, email, name, initials, role')
      .eq('id', userId)
      .single()
    if (data) {
      store.setProfile(data as any)
      localStorage.setItem(ROLE_CACHE_KEY, (data as any).role)
    }
    return data
  }

  async function initializeAuth() {
    if (store.initialized) return
    try {
      const { data } = await Promise.race([
        client.auth.getSession(),
        new Promise<any>(resolve =>
          setTimeout(() => resolve({ data: { session: null } }), 7000)
        ),
      ])

      const session = data?.session
      if (!session) return

      const loaded = await Promise.race([
        loadProfile(session.user.id).then(() => true).catch(() => false),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), 5000)),
      ])

      if (!loaded && !store.profile) {
        const cachedRole = localStorage.getItem(ROLE_CACHE_KEY)
        if (cachedRole) {
          const u = session.user
          store.setProfile({
            id: u.id,
            email: u.email ?? '',
            name: u.user_metadata?.name ?? u.email ?? '',
            initials: (u.email ?? '??').slice(0, 2).toUpperCase(),
            role: cachedRole,
          })
        }
      }
    } catch {
      store.setProfile(null)
    } finally {
      store.setInitialized(true)
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (data.user) {
      await loadProfile(data.user.id)
      store.setInitialized(true)
    }
    return data
  }

  async function signOut() {
    await client.auth.signOut()
    localStorage.removeItem(ROLE_CACHE_KEY)
    store.clear()
    return navigateTo('/login')
  }

  return {
    user,
    isAdmin,
    isLoggedIn,
    isLoading,
    initializeAuth,
    signIn,
    signOut,
  }
}
