import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import MovieDetail from '../views/MovieDetail.vue'
import Booking from '../views/Booking.vue'
import Profile from '../views/Profile.vue'
import AdminDashboard from '../views/admin/Dashboard.vue'
import AdminMovies from '../views/admin/Movies.vue'
import AdminScreenings from '../views/admin/Screenings.vue'
import AdminOrders from '../views/admin/Orders.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/movie/:id',
    name: 'MovieDetail',
    component: MovieDetail,
    props: true
  },
  {
    path: '/booking/:screeningId',
    name: 'Booking',
    component: Booking,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/movies',
    name: 'AdminMovies',
    component: AdminMovies,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/screenings',
    name: 'AdminScreenings',
    component: AdminScreenings,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: AdminOrders,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && userRole !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router 