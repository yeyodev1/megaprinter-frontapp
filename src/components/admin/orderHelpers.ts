import type { Order, OrderStatus } from '@/services/orders'

export const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('es-EC') : '—')

export const formatMoney = (value: number) => `$${value.toFixed(2)}`

export const sourceLabel = (source: Order['source']) =>
  source === 'whatsapp' ? 'Solicitud por WhatsApp' : 'Pago con Payphone'

export const sourceIcon = (source: Order['source']) =>
  source === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-credit-card'

export const phoneLink = (phone: string) => `tel:${phone.replace(/\s/g, '')}`

/** Números ecuatorianos locales (09...) necesitan el prefijo 593 y sin el cero. */
export const chatLink = (order: Order) => {
  const digits = order.customerPhone.replace(/\D/g, '').replace(/^0/, '593')
  const text = `Hola ${order.customerName}, te escribimos desde Megaprinter sobre tu pedido.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/** Estado inicial de un pedido según su origen. */
export const initialStatus = (order: Order): OrderStatus =>
  order.source === 'whatsapp' ? 'whatsapp' : 'pending'

/** Camino natural del pedido: origen → pagado → preparación → entregado. */
export const orderPath = (order: Order): OrderStatus[] => [
  initialStatus(order),
  'paid',
  'processing',
  'delivered',
]
