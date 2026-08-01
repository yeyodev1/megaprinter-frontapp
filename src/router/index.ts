import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Home' },
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
    meta: { title: 'Reparaciones' },
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
    path: '/admin/catalog',
    name: 'CatalogAdmin',
    component: () => import('../views/CatalogAdminView.vue'),
    meta: { title: 'Administrar catálogo', requiresAdmin: true },
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
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !sessionStorage.getItem('admin-token')) return { path: '/login' }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || 'Tecnología y soporte')} | Megaprinter Ecuador`
})

export default router
