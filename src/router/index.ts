import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getAdminToken } from '@/services/http'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Tecnología y soporte técnico' },
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/ProductsView.vue'),
    meta: { title: 'Productos' },
  },
  {
    path: '/productos/:slug',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailView.vue'),
    meta: { title: 'Detalle de producto' },
  },
  {
    path: '/repairs',
    name: 'Repairs',
    component: () => import('../views/RepairsView.vue'),
    meta: { title: 'Taller técnico' },
  },
  {
    path: '/payment/confirmation',
    name: 'PaymentConfirmation',
    component: () => import('../views/PaymentConfirmationView.vue'),
    meta: { title: 'Confirmación de pago' },
  },
  {
    path: '/pay-response',
    name: 'PayphoneResponse',
    component: () => import('../views/PaymentConfirmationView.vue'),
    meta: { title: 'Confirmación de pago' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Acceso interno' },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/AdminDashboardView.vue'),
    meta: { title: 'Panel interno', requiresAdmin: true },
  },
  {
    path: '/admin/catalog',
    name: 'CatalogAdmin',
    component: () => import('../views/CatalogAdminView.vue'),
    meta: { title: 'Administrar catálogo', requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('../views/OrdersAdminView.vue'),
    meta: { title: 'Pedidos', requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/UsersAdminView.vue'),
    meta: { title: 'Usuarios internos', requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Página no encontrada' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    // Un ancla (#contacto) debe llevar a su seccion, no al tope de la pagina.
    if (to.hash) return { el: to.hash, top: 88, behavior: 'smooth' }
    return { left: 0, top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !getAdminToken()) {
    // `redirect` permite volver a la pagina pedida despues de iniciar sesion.
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // Con sesion activa no tiene sentido volver al formulario de acceso.
  if (to.name === 'Login' && getAdminToken() && !to.query.expired) {
    return { name: 'AdminDashboard' }
  }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || 'Tecnología y soporte')} | Megaprinter Ecuador`
})

export default router
