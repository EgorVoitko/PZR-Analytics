import { reactive, computed } from 'vue'

// date: "DD.MM.YYYY HH:MM" — productIdx: 0-based index into useProducts allProducts
const _sales = reactive([
  { id:  1, date: '20.03.2026 14:32', staffId: 2, productIdx: 0, qty: 1,  total:  429, edited: false },
  { id:  2, date: '20.03.2026 13:45', staffId: 1, productIdx: 2, qty: 2,  total:  178, edited: false },
  { id:  3, date: '20.03.2026 12:14', staffId: 4, productIdx: 5, qty: 3,  total:  165, edited: false },
  { id:  4, date: '20.03.2026 11:03', staffId: 1, productIdx: 7, qty: 6,  total:   54, edited: false },
  { id:  5, date: '20.03.2026 10:18', staffId: 6, productIdx: 7, qty: 5,  total:   45, edited: true  },
  { id:  6, date: '19.03.2026 17:34', staffId: 3, productIdx: 3, qty: 1,  total:  899, edited: false },
  { id:  7, date: '19.03.2026 15:52', staffId: 5, productIdx: 4, qty: 1,  total:  499, edited: false },
  { id:  8, date: '19.03.2026 14:08', staffId: 2, productIdx: 0, qty: 1,  total:  429, edited: false },
  { id:  9, date: '19.03.2026 11:27', staffId: 1, productIdx: 6, qty: 1,  total:  249, edited: false },
  { id: 10, date: '19.03.2026 09:15', staffId: 4, productIdx: 2, qty: 3,  total:  267, edited: false },
  { id: 11, date: '18.03.2026 16:41', staffId: 6, productIdx: 1, qty: 1,  total:  389, edited: false },
  { id: 12, date: '18.03.2026 14:22', staffId: 2, productIdx: 3, qty: 1,  total:  899, edited: true  },
  { id: 13, date: '18.03.2026 11:05', staffId: 3, productIdx: 5, qty: 2,  total:  110, edited: false },
  { id: 14, date: '17.03.2026 15:30', staffId: 1, productIdx: 4, qty: 1,  total:  499, edited: false },
  { id: 15, date: '17.03.2026 12:48', staffId: 5, productIdx: 7, qty: 10, total:   90, edited: false },
  { id: 16, date: '16.03.2026 16:20', staffId: 4, productIdx: 0, qty: 1,  total:  429, edited: false },
  { id: 17, date: '16.03.2026 13:10', staffId: 6, productIdx: 2, qty: 4,  total:  356, edited: false },
  { id: 18, date: '15.03.2026 11:45', staffId: 3, productIdx: 1, qty: 1,  total:  389, edited: false },
])

const _yearlyRevenue = [
  { label: 'Apr', revenue:  6200 },
  { label: 'May', revenue:  7100 },
  { label: 'Jun', revenue:  6800 },
  { label: 'Jul', revenue:  8200 },
  { label: 'Aug', revenue:  7800 },
  { label: 'Sep', revenue:  9100 },
  { label: 'Oct', revenue:  8700 },
  { label: 'Nov', revenue:  9500 },
  { label: 'Dec', revenue: 11200 },
  { label: 'Jan', revenue: 10400 },
  { label: 'Feb', revenue:  9800 },
  { label: 'Mar', revenue: 11500 },
]

export function useSales(staffId = null) {
  const sales = computed(() =>
    staffId ? _sales.filter(s => s.staffId === staffId) : [..._sales]
  )

  const totalRevenue = computed(() =>
    sales.value.reduce((sum, s) => sum + s.total, 0)
  )

  const salesCount = computed(() => sales.value.length)

  const todayRevenue = computed(() => {
    const d = new Date()
    const today = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
    return sales.value
      .filter(s => s.date.startsWith(today))
      .reduce((sum, s) => sum + s.total, 0)
  })

  const revenueByMonth = computed(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const days = new Date(year, month, 0).getDate()
    const result = []
    for (let d = 1; d <= days; d++) {
      const dateStr = `${String(d).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}`
      const revenue = sales.value
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0)
      result.push({ day: d, label: String(d), revenue })
    }
    return result
  })

  const revenueByWeek = computed(() => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
      const revenue = sales.value
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, s) => sum + s.total, 0)
      result.push({ label: `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}`, revenue })
    }
    return result
  })

  // When staffId is set, yearly values are scaled by that staff's share of recorded sales
  const revenueByYear = computed(() => {
    if (!staffId) return _yearlyRevenue
    const total = _sales.reduce((s, x) => s + x.total, 0)
    const mine  = _sales.filter(x => x.staffId === staffId).reduce((s, x) => s + x.total, 0)
    const ratio = total > 0 ? mine / total : 0
    return _yearlyRevenue.map(m => ({ ...m, revenue: Math.round(m.revenue * ratio) }))
  })

  function recentSales(limit = 5) {
    return [...sales.value].reverse().slice(0, limit)
  }

  function editSale(id, data) {
    const idx = _sales.findIndex(s => s.id === id)
    if (idx === -1) return
    Object.assign(_sales[idx], data, { edited: true })
  }

  function deleteSale(id) {
    const idx = _sales.findIndex(s => s.id === id)
    if (idx !== -1) _sales.splice(idx, 1)
  }

  function addSale(data) {
    _sales.push({ id: _sales.length + 1, edited: false, ...data })
  }

  return { sales, totalRevenue, salesCount, todayRevenue, revenueByMonth, revenueByWeek, revenueByYear, recentSales, editSale, deleteSale, addSale }
}
