import {
  createRouter,
  createWebHistory
} from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminView from '../views/AdminView.vue'

import FirebaseRegisterView from '../views/FirebaseRegisterView.vue'
import FirebaseSigninView from '../views/FirebaseSigninView.vue'
import AddBookView from '../views/AddBookView.vue'
import GetBookCountView from '../views/GetBookCountView.vue'
import WeatherView from '../views/WeatherView.vue'
import CountBookAPI from '../views/CountBookAPI.vue'
import GetAllBookAPI from '../views/GetAllBookAPI.vue'
import EmailView from '../views/EmailView.vue'
import { authReady, authUser, isAdmin } from '../firebase/auth'

const routes = [
  { path: '/resources', name: 'ResourcesTable', component: () => import('../views/ResourcesTableView.vue') },
  { path: '/events', name: 'EventsTable', component: () => import('../views/EventsTableView.vue') },
  { path: '/email', name: 'Email', component: EmailView, meta: { requiresAuth: true } },
  { path: '/weather', name: 'WeatherView', component: WeatherView },
  { path: '/count-book-api', name: 'CountBookAPI', component: CountBookAPI },
  { path: '/get-all-book-api', name: 'GetAllBookAPI', component: GetAllBookAPI },
  {
    path: '/get-book-count',
    name: 'GetBookCount',
    component: GetBookCountView
  },
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
  },

  {
    path: '/FireRegister',
    name: 'FireRegister',
    component: FirebaseRegisterView
  },

  {
    path: '/FireLogin',
    name: 'FireLogin',
    component: FirebaseSigninView
  },

  {
    path: '/add-book',
    name: 'AddBook',
    component: AddBookView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  await authReady

  if (
    to.meta.requiresAuth &&
    !authUser.value
  ) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (
    to.meta.requiresAdmin &&
    !isAdmin.value
  ) {
    return '/home'
  }
})

export default router
