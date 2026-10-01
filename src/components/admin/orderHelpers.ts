import type { Order, OrderStatus, TransferStatus } from '@/services/orders'

export const formatDate = (value?: string) => (value ? new Date(value).toLocaleString('es-EC') : '—')

export const formatMoney = (value: number) => `$${value.toFixed(2)}`

const SOURCE_LABEL: Record<Order['source'], string> = {
  whatsapp: 'Solicitud por WhatsApp',
  payphone: 'Pago con Payphone',
  transfer: 'Transferencia bancaria',
}

const SOURCE_ICON: Record<Order['source'], string> = {
  whatsapp: 'fa-brands fa-whatsapp',
  payphone: 'fa-solid fa-credit-card',
  transfer: 'fa-solid fa-building-columns',
}

export const sourceLabel = (source: Order['source']) => SOURCE_LABEL[source] ?? source

export const sourceIcon = (source: Order['source']) => SOURCE_ICON[source] ?? 'fa-solid fa-receipt'

/** Pedidos creados por el bot de WhatsApp. */
export const fromBot = (order: Order) => order.channel === 'whatsapp_bot'

/** Número legible del pedido; los pedidos viejos no lo tienen. */
export const orderCode = (order: Order) => order.orderNumber || order._id.slice(-6).toUpperCase()

export const TRANSFER_STATUS: Record<TransferStatus, { label: string; icon: string; tone: string }> = {
  awaiting_receipt: { label: 'Esperando comprobante', icon: 'fa-solid fa-hourglass-half', tone: 'waiting' },
  in_review: { label: 'Comprobante por revisar', icon: 'fa-solid fa-magnifying-glass-dollar', tone: 'review' },
  approved: { label: 'Transferencia aprobada', icon: 'fa-solid fa-circle-check', tone: 'approved' },
  rejected: { label: 'Comprobante rechazado', icon: 'fa-solid fa-circle-xmark', tone: 'rejected' },
}

export const needsTransferReview = (order: Order) =>
  order.source === 'transfer' && order.transfer?.status === 'in_review'

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
