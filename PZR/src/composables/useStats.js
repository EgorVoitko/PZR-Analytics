import { useSales } from './useSales.js'

export function useStats(userId = null) {
  const { totalRevenue, salesCount, todayRevenue, revenueByMonth, revenueByWeek, revenueByYear } = useSales(userId)

  function revenueByPeriod(period) {
    if (period === 'week')  return revenueByWeek
    if (period === 'month') return revenueByMonth
    return revenueByYear
  }

  return { revenue: totalRevenue, salesCount, todayRevenue, revenueByPeriod }
}
