import { createRouter, createWebHistory } from 'vue-router'
import { watch } from 'vue'
import { useAuth } from '../composables/useAuth.js'

import LoginPage       from '../pages/LoginPage.vue'
import DashboardOverview from '../pages/DashboardOverview.vue'
import EmployeeList    from '../pages/EmployeeList.vue'
import EmployeeDetail  from '../pages/EmployeeDetail.vue'
import CustomerList    from '../pages/CustomerList.vue'
import CustomerDetail  from '../pages/CustomerDetail.vue'
import SalesPage       from '../pages/SalesPage.vue'
import MyDashboard     from '../pages/MyDashboard.vue'

const routes = [
  { path: '/login', component: LoginPage, meta: { public: true } },

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

router.beforeEach(async (to) => {
  const { isLoggedIn, isAdmin, isLoading } = useAuth()

  // Wait for the initial session check to finish
  if (isLoading.value) {
    await new Promise(resolve => {
      const stop = watch(isLoading, (val) => {
        if (!val) { stop(); resolve() }
      })
    })
  }

  // Public routes (login) — if already logged in, redirect away
  if (to.meta.public) {
    if (isLoggedIn.value) {
      return isAdmin.value ? '/dashboard' : '/my'
    }
    return true
  }

  // Protected routes — require login
  if (!isLoggedIn.value) {
    return '/login'
  }

  // Admin-only routes
  if (to.meta.adminOnly && !isAdmin.value) {
    return '/my'
  }
})

export default router
