import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../store/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'teams',
        name: 'Teams',
        component: () => import('../views/Teams.vue')
      },
      {
        path: 'teams/:id',
        name: 'TeamDetail',
        component: () => import('../views/TeamDetail.vue')
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('../views/Schedules.vue')
      },
      {
        path: 'matches',
        name: 'Matches',
        component: () => import('../views/Matches.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.loadUserFromStorage()

  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && userStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
