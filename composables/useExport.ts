import * as XLSX from 'xlsx'

function download(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename)
}

function sheet(data: any[][], cols?: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(data)
  if (cols) ws['!cols'] = cols.map(w => ({ wch: w }))
  return ws
}

export function useExport() {
  const route = useRoute()

  function exportSales(sales: any[], filename = 'sales.xlsx') {
    const header = ['Date', 'Employee', 'Product', 'Type', 'Qty', 'Total ($)', 'Payment']
    const rows = sales.map((s: any) => [
      s.date,
      s.staffName,
      s.productName,
      s.productType ?? '—',
      s.qty,
      s.total,
      s.paymentStatus ?? 'completed',
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet([header, ...rows], [18, 18, 20, 16, 6, 12, 12]), 'Sales')
    download(wb, filename)
  }

  function exportEmployees(staff: any[]) {
    const header = ['Name', 'Email', 'Initials', 'Sales', 'Revenue ($)', 'Status']
    const rows = staff.map((s: any) => [
      s.name,
      s.email ?? '—',
      s.initials,
      s.sales,
      s.revenue,
      s.online ? 'Online' : 'Offline',
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet([header, ...rows], [22, 26, 10, 8, 14, 10]), 'Employees')
    download(wb, 'employees.xlsx')
  }

  function exportCustomers(customers: any[]) {
    const tierLabel = (t: string) =>
      ({ gold: 'Gold', silver: 'Silver', bronze: 'Bronze', none: 'New' })[t] ?? t

    const header = ['ID', 'Name', 'Purchases', 'Spent ($)', 'Tier', 'Discount (%)']
    const rows = customers.map((c: any) => [
      c.id,
      c.name,
      c.purchases,
      c.spent,
      tierLabel(c.tier),
      c.discount,
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet([header, ...rows], [8, 24, 10, 12, 10, 14]), 'Customers')
    download(wb, 'customers.xlsx')
  }

  function exportForCurrentPage() {
    const path = route.path

    if (path === '/dashboard' || path === '/dashboard/sales' || path === '/my') {
      const staffId = path === '/my'
        ? (useAuth().user.value?.staffId ?? null)
        : (path === '/dashboard/sales' && !useAuth().isAdmin.value
            ? useAuth().user.value?.staffId ?? null
            : null)

      const { sales } = useSales(staffId ? ref(staffId) : null)
      const suffix = path === '/my' ? 'my' : 'all'
      exportSales(sales.value, `sales-${suffix}.xlsx`)
      return
    }

    if (path.startsWith('/dashboard/employees/') && route.params.id) {
      const staffId = ref(route.params.id as string)
      const { sales } = useSales(staffId)
      const { getById } = useStaff()
      const emp = getById(route.params.id as string)
      exportSales(sales.value, `sales-${emp?.name?.replace(/\s+/g, '-') ?? 'employee'}.xlsx`)
      return
    }

    if (path === '/dashboard/employees') {
      const { allStaff } = useStaff()
      exportEmployees(allStaff.value)
      return
    }

    if (path === '/dashboard/customers') {
      const { allCustomers } = useCustomers()
      exportCustomers(allCustomers.value)
      return
    }
  }

  return { exportForCurrentPage, exportSales, exportEmployees, exportCustomers }
}
