export default defineNuxtRouteMiddleware(async (to) => {
  const store = useAuthStore()
  const { initializeAuth, isAdmin, isLoggedIn } = useAuth()

  if (!store.initialized) {
    await initializeAuth()
  }

  // /pay is always accessible — no redirect even when logged in
  if (to.path === '/pay') return

  const isPublic = to.path === '/login'

  if (isPublic) {
    if (isLoggedIn.value) {
      return navigateTo(isAdmin.value ? '/dashboard' : '/my')
    }
    return
  }

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  const adminOnlyPrefixes = ['/dashboard/employees', '/dashboard/customers']
  const isAdminOnly =
    to.path === '/dashboard' ||
    adminOnlyPrefixes.some(p => to.path === p || to.path.startsWith(p + '/'))

  if (isAdminOnly && !isAdmin.value) {
    return navigateTo('/my')
  }
})
