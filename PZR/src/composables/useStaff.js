import { reactive, computed } from 'vue'

const _staff = reactive([
  { id: 1, name: 'Maria Petrova',  initials: 'MP', sales: 342, revenue: 36900, online: true  },
  { id: 2, name: 'Dmitry Kozlov',  initials: 'DK', sales: 298, revenue: 32500, online: true  },
  { id: 3, name: 'Elena Sidorova', initials: 'ES', sales: 276, revenue: 29800, online: false },
  { id: 4, name: 'Alexei Morozov', initials: 'AM', sales: 251, revenue: 27100, online: true  },
  { id: 5, name: 'Olga Novikova',  initials: 'ON', sales: 234, revenue: 23900, online: false },
  { id: 6, name: 'Igor Volkov',    initials: 'IV', sales: 189, revenue: 19700, online: true  },
])

export function useStaff() {
  const allStaff = computed(() => _staff)

  function getById(id) {
    return _staff.find(s => s.id === id) ?? null
  }

  return { allStaff, getById }
}
