import { http } from '@/services/http'

export type OrderStatus = 'pending' | 'whatsapp' | 'paid' | 'processing' | 'delivered' | 'cancelled'

export interface OrderItem {
  name: string
  price: number
  quantity: number
}

/** Método de pago del pedido (el backend lo guarda como `source`). */
export type OrderSource = 'payphone' | 'whatsapp' | 'transfer'

export type TransferStatus = 'awaiting_receipt' | 'in_review' | 'approved' | 'rejected'

export interface ReceiptAnalysis {
  isReceipt: boolean | null
  amountMatches: boolean | null
  accountMatches: boolean | null
  detectedAmount: number | null
  detectedBank: string
  detectedReference: string
  summary: string
}

export interface TransferReceipt {
  url: string
  receivedAt: string
  via: 'whatsapp' | 'web'
  analysis?: Partial<ReceiptAnalysis>
}

export interface OrderTransfer {
  status?: TransferStatus
  receipts?: TransferReceipt[]
  reviewedBy?: string
  reviewedAt?: string
  note?: string
}

export interface Order {
  _id: string
  orderNumber?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  items: OrderItem[]
  totalAmount: number
  source: OrderSource
  channel?: 'web' | 'whatsapp_bot'
  whatsappPhone?: string
  status: OrderStatus
  transfer?: OrderTransfer
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
  source: OrderSource
  clientTransactionId?: string
}

export interface OrderResponse {
  success: boolean
  message: string
  orderId: string
  orderNumber?: string
  paymentToken?: string
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
  { value: 'pending', label: 'Pago pendiente', description: 'Pago con tarjeta o transferencia sin confirmar', icon: 'fa-solid fa-hourglass-half' },
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

/** Aprobar o rechazar el comprobante de una transferencia (aprobar = pagado). */
export const reviewTransfer = async (id: string, decision: 'approve' | 'reject', note = '') =>
  (await http.patch<Order>(`/orders/${id}/transfer`, { decision, note })).data

export interface BankDetails {
  bank: string
  accountType: string
  accountNumber: string
  accountHolder: string
  holderId: string
}

export const getTransferConfig = async () =>
  (await http.get<{ enabled: boolean; bank: BankDetails | null }>('/orders/transfer/config')).data

/** Pedido visto desde su enlace privado de pago (/pagar/:token). */
export interface PaymentOrder {
  orderNumber: string
  customerName: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  source: OrderSource
  createdAt: string
  transfer: { status: TransferStatus; receiptsCount: number; lastReceiptAt: string | null; note: string } | null
  bank: BankDetails | null
}

export const getPaymentOrder = async (token: string) =>
  (await http.get<PaymentOrder>(`/orders/pay/${encodeURIComponent(token)}`)).data

export const createPaymentIntent = async (token: string) =>
  (
    await http.post<{ clientTransactionId: string; amount: number; customerEmail: string; customerPhone: string }>(
      `/orders/pay/${encodeURIComponent(token)}/intent`,
    )
  ).data

export const uploadTransferReceipt = async (token: string, file: File) => {
  const body = new FormData()
  body.append('receipt', file)
  return (await http.post<PaymentOrder>(`/orders/pay/${encodeURIComponent(token)}/receipt`, body, { timeout: 60000 })).data
}
