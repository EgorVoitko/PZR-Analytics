import { defineStore } from 'pinia'

interface Profile {
  id: string
  email: string
  name: string
  initials: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const initialized = ref(false)

  const isAdmin = computed(() => profile.value?.role === 'admin')

  function setProfile(value: Profile | null) {
    profile.value = value
  }

  function setInitialized(value: boolean) {
    initialized.value = value
  }

  function clear() {
    profile.value = null
    initialized.value = false
  }

  return { profile, initialized, isAdmin, setProfile, setInitialized, clear }
})
