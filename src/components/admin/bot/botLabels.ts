import type { BotStage } from '@/services/bot'

/** Mismos nombres y emojis que los flujos de BuilderBot, para leer el panel y el bot igual. */
export const ROUTE_META: Record<string, { label: string; tone: string }> = {
  conversation: { label: '💬 Conversación', tone: 'neutral' },
  catalog: { label: '📚 Catálogo', tone: 'neutral' },
  confirmOrder: { label: '🧾 Confirmando pedido', tone: 'info' },
  checkoutCard: { label: '💳 Checkout tarjeta', tone: 'ok' },
  checkoutTransfer: { label: '🏦 Checkout transferencia', tone: 'ok' },
  checkoutAdvisor: { label: '🧑‍💼 Checkout asesor', tone: 'warn' },
  awaitingReceipt: { label: '📸 Esperar comprobante', tone: 'info' },
  receiptReceived: { label: '🧾 Comprobante recibido', tone: 'ok' },
  searchOrder: { label: '📦 Consultar pedido', tone: 'neutral' },
  human: { label: '🙋 Asesor humano', tone: 'warn' },
  media: { label: '🖼️ Imágenes y comprobantes', tone: 'neutral' },
}

export const routeMeta = (route: string) => ROUTE_META[route] ?? { label: route || '—', tone: 'neutral' }

/** Endpoint que atendió cada paso, con el nombre del flujo que lo llama. */
export const ENDPOINT_LABEL: Record<string, string> = {
  brain: '🧠 Principal',
  conversation: '💬 Conversación',
  catalog: '📚 Catálogo',
  checkout: '🛒 Checkout',
  'search-order': '📦 Consultar pedido',
  human: '🙋 Asesor humano',
  media: '🖼️ Imágenes',
  'transfer-receipt': '🖼️ Imágenes',
  assistant: '💬 Conversación',
}

export const endpointLabel = (endpoint: string) => ENDPOINT_LABEL[endpoint] ?? endpoint

export const STAGE_META: Record<BotStage, { label: string; icon: string }> = {
  idle: { label: 'Explorando', icon: 'fa-solid fa-compass' },
  choosing: { label: 'Eligiendo producto', icon: 'fa-solid fa-list-ol' },
  name: { label: 'Pidiendo nombre', icon: 'fa-solid fa-user' },
  email: { label: 'Pidiendo correo', icon: 'fa-solid fa-envelope' },
  address: { label: 'Pidiendo dirección', icon: 'fa-solid fa-location-dot' },
  payment: { label: 'Eligiendo pago', icon: 'fa-solid fa-wallet' },
  confirm: { label: 'Confirmando pedido', icon: 'fa-solid fa-clipboard-check' },
  ordered: { label: 'Pedido creado', icon: 'fa-solid fa-circle-check' },
}

export const stageMeta = (stage: string) => STAGE_META[stage as BotStage] ?? { label: stage, icon: 'fa-solid fa-circle' }

/** Pasos del embudo en orden, para dibujar el avance del cliente. */
export const FUNNEL: BotStage[] = ['idle', 'choosing', 'name', 'email', 'address', 'payment', 'confirm', 'ordered']

export const paymentLabel = (method: string | null) =>
  method === 'card' ? 'Tarjeta' : method === 'transfer' ? 'Transferencia' : 'Sin definir'

/** "hace 3 min", "hace 2 h" o la fecha. */
export function timeAgo(value?: string | null) {
  if (!value) return '—'
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 45) return 'ahora'
  if (seconds < 3600) return `hace ${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.round(seconds / 3600)} h`
  return new Date(value).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
}

export const timeOf = (value: string) =>
  new Date(value).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Texto de WhatsApp (*negrita*, ~tachado~) a HTML seguro para mostrarlo en el panel. */
export function whatsappHtml(text: string) {
  const escaped = text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
}

export const waLink = (phone: string) => (phone.startsWith('lid:') ? '' : `https://wa.me/${phone.replace(/\D/g, '')}`)
