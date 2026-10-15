import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getAdminToken, getTokenRole } from '@/services/http'

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
    // Enlace privado de pago: lo manda el bot de WhatsApp o llega tras el checkout por transferencia.
    path: '/pagar/:token',
    name: 'PayOrder',
    component: () => import('../views/PayOrderView.vue'),
    meta: { title: 'Pagar pedido' },
  },
  {
    // Seguimiento del pedido: por correo o código MP-, o directo desde el enlace del correo.
    path: '/pedido/:token?',
    name: 'TrackOrder',
    component: () => import('../views/TrackOrderView.vue'),
    meta: { title: 'Seguimiento de pedido' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Acceso interno' },
  },
  {
    path: '/admin',
    component: () => import('../layout/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/AdminDashboardView.vue'),
        meta: { title: 'Panel interno' },
      },
      {
        path: 'bot',
        name: 'AdminBot',
        component: () => import('../views/BotAdminView.vue'),
        meta: { title: 'Bot de WhatsApp' },
      },
      {
        path: 'atencion',
        name: 'AdminAttention',
        component: () => import('../views/AttentionReportView.vue'),
        meta: { title: 'Atención' },
      },
      {
        path: 'tickets',
        name: 'AdminTickets',
        component: () => import('../views/TicketsAdminView.vue'),
        // Única sección que ve el técnico.
        meta: { title: 'Servicio técnico', allowTecnico: true },
      },
      {
        path: 'catalog',
        name: 'CatalogAdmin',
        component: () => import('../views/CatalogAdminView.vue'),
        meta: { title: 'Administrar catálogo' },
      },
      {
        path: 'orders',
        name: 'AdminOrders',
        component: () => import('../views/OrdersAdminView.vue'),
        meta: { title: 'Pedidos' },
      },
      {
        path: 'payments',
        name: 'AdminPayments',
        component: () => import('../views/PaymentSettingsView.vue'),
        meta: { title: 'Pagos' },
      },
      {
        path: 'sucursales',
        name: 'AdminStore',
        component: () => import('../views/StoreSettingsView.vue'),
        meta: { title: 'Sucursales' },
      },
      {
        path: 'aprendizaje',
        name: 'AdminLearning',
        component: () => import('../views/LearningView.vue'),
        meta: { title: 'Aprendizaje' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/UsersAdminView.vue'),
        meta: { title: 'Usuarios internos' },
      },
      {
        path: 'tecnicos',
        name: 'AdminTechnicians',
        component: () => import('../views/TechniciansAdminView.vue'),
        meta: { title: 'Técnicos' },
      },
    ],
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

/** Inicio del panel según el rol: el técnico va directo a sus tickets. */
export const panelHome = () => (getTokenRole() === 'tecnico' ? { name: 'AdminTickets' } : { name: 'AdminDashboard' })

router.beforeEach((to) => {
  if (to.matched.some((record) => record.meta.requiresAdmin) && !getAdminToken()) {
    // `redirect` permite volver a la pagina pedida despues de iniciar sesion.
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // El técnico solo entra al tablero de tickets; el backend igual rechaza el resto.
  if (to.matched.some((record) => record.meta.requiresAdmin) && getTokenRole() === 'tecnico' && !to.meta.allowTecnico) {
    return { name: 'AdminTickets' }
  }
  // Con sesion activa no tiene sentido volver al formulario de acceso.
  if (to.name === 'Login' && getAdminToken() && !to.query.expired) {
    return panelHome()
  }
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title || 'Tecnología y soporte')} | Megaprinter Ecuador`
})

export default router
