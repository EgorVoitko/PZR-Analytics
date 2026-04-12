import { reactive, computed } from 'vue'

// gold > $5000 / silver > $2000 / bronze > $1000
function calcTier(spent) {
  if (spent > 5000) return 'gold'
  if (spent > 2000) return 'silver'
  if (spent > 1000) return 'bronze'
  return 'none'
}

const _customers = reactive([
  { id: '1',  name: 'Anna Kravchenko',  purchases: 47, spent: 7800, discount: 15, lastVisit: '19.03.2026' },
  { id: '2',  name: 'Viktor Shevchenko', purchases: 34, spent: 5570, discount: 12, lastVisit: '20.03.2026' },
  { id: '3',  name: 'Irina Bondarenko',  purchases: 28, spent: 3900, discount:  8, lastVisit: '18.03.2026' },
  { id: '4',  name: 'Oleg Tkachenko',    purchases: 22, spent: 3136, discount:  7, lastVisit: '17.03.2026' },
  { id: '5',  name: 'Natalya Kovalenko', purchases: 19, spent: 2486, discount:  5, lastVisit: '20.03.2026' },
  { id: '6',  name: 'Sergei Melnyk',     purchases: 14, spent: 1748, discount:  3, lastVisit: '15.03.2026' },
  { id: '7',  name: 'Tatiana Lysenko',   purchases: 11, spent: 1242, discount:  3, lastVisit: '16.03.2026' },
  { id: '8',  name: 'Pavel Rudenko',     purchases:  8, spent:  864, discount:  0, lastVisit: '14.03.2026' },
  { id: '9',  name: 'Yulia Polishchuk',  purchases:  5, spent:  578, discount:  0, lastVisit: '12.03.2026' },
  { id: '10', name: 'Andrei Savchenko',  purchases:  3, spent:  312, discount:  0, lastVisit: '10.03.2026' },
])

export function useCustomers() {
  const allCustomers = computed(() =>
    _customers.map(c => ({ ...c, tier: calcTier(c.spent) }))
  )

  function getById(id) {
    const c = _customers.find(c => c.id === id)
    return c ? { ...c, tier: calcTier(c.spent) } : null
  }

  return { allCustomers, getById }
}
