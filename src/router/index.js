// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import ClientesView from '@/views/ClientesView.vue'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/clientes', component: ClientesView, meta: { requiresAuth: true } },
  { path: '/rutas', component: () => import('@/views/RutasView.vue'), meta: { requiresAuth: true } },
  {
    path: '/lista-clientes',
    name: 'ListaClientes',
    component: () => import('@/views/ListaClientesView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔒 Protección de rutas
router.beforeEach((to) => {
  const auth = useAuthStore()

  // Rehidratar sesión si hace falta
  if (!auth.cedula) {
    auth.restoreSession()
  }

  // Si requiere login y no está autenticado → redirigir
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login' }
  }
})

export default router
