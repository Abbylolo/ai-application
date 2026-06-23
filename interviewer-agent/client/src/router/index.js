import { createRouter, createWebHashHistory } from 'vue-router'
import { getCurrentUser } from '@/services/auth.js'

const routes = [
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/pages/AuthPage.vue'),
    meta: { hideSidebar: true }
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/pages/SetupPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/interview/:id?',
    name: 'Interview',
    component: () => import('@/pages/InterviewPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/report/:id',
    name: 'Report',
    component: () => import('@/pages/ReportPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/pages/HistoryPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/company',
    name: 'Company',
    component: () => import('@/pages/CompanyPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/pages/StatsPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const isPasswordReset = window.location.search.includes('reset=1') || to.query.reset === '1'
  if (isPasswordReset && to.path !== '/auth') {
    return next('/auth?reset=1')
  }
  if (to.meta.requiresAuth) {
    const user = await getCurrentUser()
    if (!user) return next('/auth')
  }
  if (to.path === '/auth') {
    const user = await getCurrentUser()
    if (user && !isPasswordReset) return next('/')
  }
  next()
})

export default router
