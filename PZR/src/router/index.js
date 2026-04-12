import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

import DashboardOverview from '../pages/DashboardOverview.vue'
import EmployeeList from '../pages/EmployeeList.vue'
import EmployeeDetail from '../pages/EmployeeDetail.vue'
import CustomerList from '../pages/CustomerList.vue'
import CustomerDetail from '../pages/CustomerDetail.vue'
import SalesPage from '../pages/SalesPage.vue'
import MyDashboard from '../pages/MyDashboard.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    component: DashboardOverview,
    meta: { adminOnly: true, title: 'Overview' },
  },
  {
    path: '/dashboard/employees',
    component: EmployeeList,
    meta: { adminOnly: true, title: 'Employees' },
  },
  {
    path: '/dashboard/employees/:id',
    component: EmployeeDetail,
    meta: { adminOnly: true, title: 'Employee' },
  },
  {
    path: '/dashboard/customers',
    component: CustomerList,
    meta: { adminOnly: true, title: 'Customers' },
  },
  {
    path: '/dashboard/customers/:id',
    component: CustomerDetail,
    meta: { adminOnly: true, title: 'Customer' },
  },
  {
    path: '/dashboard/sales',
    component: SalesPage,
    meta: { title: 'Sales' },
  },
  {
    path: '/my',
    component: MyDashboard,
    meta: { title: 'My Dashboard' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isAdmin } = useAuth()
  if (to.meta.adminOnly && !isAdmin.value) {
    return '/my'
  }
})

export default router
