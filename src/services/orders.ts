import { http } from '@/services/http'

export type OrderStatus = 'pending' | 'whatsapp' | 'paid' | 'processing' | 'delivered' | 'cancelled'

export interface OrderItem {
  name: string
  price: number
  quantity: number
}

export interface Order {
  _id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: OrderItem[]
  totalAmount: number
  source: 'payphone' | 'whatsapp'
  status: OrderStatus
  createdAt: string
  updatedAt?: string
}

export interface OrderPayload {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: OrderItem[]
  totalAmount: number
  source: 'payphone' | 'whatsapp'
  clientTransactionId?: string
}

export interface OrderResponse {
  success: boolean
  message: string
  orderId: string
  whatsappLink: string
}

export const listOrders = async () => (await http.get<Order[]>('/orders')).data

export const createOrder = async (payload: OrderPayload) =>
  (await http.post<OrderResponse>('/orders', payload)).data

export const getPayphoneConfig = async () =>
  (await http.get<{ token: string; storeId: string }>('/orders/payphone/config')).data

export interface PayphoneConfirmation {
  statusCode?: number
  transactionStatus?: string
  message?: string
}

export const confirmPayphonePayment = async (id: string, clientTransactionId: string) =>
  (await http.post<PayphoneConfirmation>('/orders/payphone/confirm', { id, clientTransactionId }))
    .data

export interface OrderStatusMeta {
  value: OrderStatus
  label: string
  description: string
  icon: string
  /** Estados finales no admiten más transiciones salvo reabrir a cancelado. */
  final?: boolean
}

/**
 * Ciclo de vida de un pedido tal como lo ve el equipo. El orden de la lista es
 * el orden natural del flujo y se usa para dibujar el avance en el panel.
 */
export const ORDER_STATUSES: OrderStatusMeta[] = [
  { value: 'whatsapp', label: 'Por contactar', description: 'Solicitud por WhatsApp sin responder', icon: 'fa-brands fa-whatsapp' },
  { value: 'pending', label: 'Pago pendiente', description: 'Pago iniciado en Payphone sin confirmar', icon: 'fa-solid fa-hourglass-half' },
  { value: 'paid', label: 'Pagado', description: 'Pago aprobado o acordado con el cliente', icon: 'fa-solid fa-circle-check' },
  { value: 'processing', label: 'En preparación', description: 'Se está alistando el pedido', icon: 'fa-solid fa-box-open' },
  { value: 'delivered', label: 'Entregado', description: 'El cliente ya recibió su pedido', icon: 'fa-solid fa-truck-fast', final: true },
  { value: 'cancelled', label: 'Cancelado', description: 'El pedido no se concretó', icon: 'fa-solid fa-ban', final: true },
]

export const orderStatusMeta = (status: string) =>
  ORDER_STATUSES.find((item) => item.value === status) ?? {
    value: status as OrderStatus,
    label: status,
    description: '',
    icon: 'fa-solid fa-circle',
  }

export const ORDER_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ORDER_STATUSES.map((item) => [item.value, item.label]),
)

export const updateOrderStatus = async (id: string, status: OrderStatus) =>
  (await http.patch<Order>(`/orders/${id}/status`, { status })).data
