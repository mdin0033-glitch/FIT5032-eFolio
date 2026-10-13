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

const routes = [
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
    component: AddBookView
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
