import { http } from '@/services/http'

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
  status: 'pending' | 'paid' | 'cancelled' | 'whatsapp'
  createdAt: string
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

export const ORDER_STATUS_LABEL: Record<string, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  cancelled: 'Cancelado',
  whatsapp: 'Por contactar',
}
