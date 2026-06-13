import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/pages/HomePage.vue')
  },
  {
    path: '/setup',
    name: 'Setup',
    component: () => import('@/pages/SetupPage.vue')
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: () => import('@/pages/ProfilePage.vue')
  },
  {
    path: '/interview/:id?',
    name: 'Interview',
    component: () => import('@/pages/InterviewPage.vue')
  },
  {
    path: '/report/:id',
    name: 'Report',
    component: () => import('@/pages/ReportPage.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/pages/HistoryPage.vue')
  },
  {
    path: '/company',
    name: 'Company',
    component: () => import('@/pages/CompanyPage.vue')
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('@/pages/StatsPage.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/pages/SettingsPage.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
