import { reactive, computed } from 'vue'

const users = {
  admin: { name: 'Egor Voitko', role: 'admin', roleLabel: 'Administrator', initials: 'AI' },
  employee: { name: 'Aleksandr Purgolo', role: 'employee', roleLabel: 'Employee', initials: 'MP' },
}

const state = reactive({ ...users.admin })

export function useAuth() {
  const isAdmin = computed(() => state.role === 'admin')

  function switchRole(role) {
    Object.assign(state, users[role])
  }

  return { user: state, isAdmin, switchRole }
}
