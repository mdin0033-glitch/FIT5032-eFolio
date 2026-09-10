import {
  createRouter,
  createWebHistory
} from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView
  },
  {
    path: '/home',
    name: 'Home',
    component: HomeView,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {

  const storedUser =
    localStorage.getItem('currentUser')

  const currentUser =
    storedUser
      ? JSON.parse(storedUser)
      : null

  if (
    to.meta.requiresAuth &&
    !currentUser
  ) {
    return '/login'
  }

  if (
    to.meta.requiresAdmin &&
    currentUser?.role !== 'admin'
  ) {
    return '/home'
  }
})

export default router