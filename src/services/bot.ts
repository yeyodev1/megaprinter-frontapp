import { http } from '@/services/http'

export type BotStage = 'idle' | 'choosing' | 'name' | 'email' | 'address' | 'payment' | 'bank' | 'confirm' | 'ordered'

export interface BotConversationSummary {
  phone: string
  customerName: string
  stage: BotStage
  paymentMethod: 'card' | 'transfer' | null
  orderNumber: string
  cartCount: number
  cartTotal: number
  lastMessage: { role: 'user' | 'assistant'; content: string; hasMedia: boolean } | null
  lastRoute: string
  lastError: boolean
  withHuman: boolean
  updatedAt: string
}

export interface BotCartLine {
  productId: string
  name: string
  price: number
  quantity: number
}

export interface BotHistoryEntry {
  role: 'user' | 'assistant'
  content: string
  mediaUrl?: string
  createdAt: string
}

export interface BotEvent {
  _id: string
  phone: string
  endpoint: string
  kind: 'decision' | 'turn' | 'error'
  route: string
  decision: string
  intent: string
  step: string
  message: string
  reply: string
  mediaUrl: string
  orderNumber: string
  duplicated: boolean
  error: string
  durationMs: number
  createdAt: string
}

export interface BotConversation {
  phone: string
  state: {
    stage: BotStage
    cart: BotCartLine[]
    cartTotal: number
    options: Array<{ productId: string; name: string; price: number }>
    customerName: string
    customerEmail: string
    address: string
    paymentMethod: 'card' | 'transfer' | null
    orderNumber: string
  }
  history: BotHistoryEntry[]
  events: BotEvent[]
  orders: Array<{
    _id: string
    orderNumber?: string
    status: string
    source: string
    channel?: string
    totalAmount: number
    transfer?: { status?: string }
    createdAt: string
  }>
  updatedAt: string | null
  createdAt: string | null
}

export interface BotStats {
  conversations: number
  messages: number
  avgResponseMs: number
  toHuman: number
  errors: number
  orders: number
  ordersTotal: number
  routes: Record<string, number>
}

export const getBotStats = async () => (await http.get<BotStats>('/bot/stats')).data

export const listBotConversations = async (search = '') =>
  (await http.get<BotConversationSummary[]>('/bot/conversations', { params: search ? { search } : {} })).data

export const getBotConversation = async (phone: string) =>
  (await http.get<BotConversation>(`/bot/conversations/${encodeURIComponent(phone)}`)).data

export const resetBotConversation = async (phone: string) =>
  http.delete(`/bot/conversations/${encodeURIComponent(phone)}`)

export const listBotEvents = async (limit = 60) => (await http.get<BotEvent[]>('/bot/events', { params: { limit } })).data
