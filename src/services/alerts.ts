import { http } from '@/services/http'

export type AlertType = 'order_new' | 'payment_confirmed' | 'receipt_review' | 'ticket_new' | 'human_handoff' | 'email_failed'

export interface PanelAlert {
  _id: string
  type: AlertType
  title: string
  body: string
  link: string
  read: boolean
  createdAt: string
}

export const listAlerts = async () => (await http.get<{ unread: number; alerts: PanelAlert[] }>('/alerts', { params: { limit: 40 } })).data

export const markAlertsRead = async (ids?: string[]) => (await http.post<{ unread: number }>('/alerts/read', { ids })).data

export const ALERT_META: Record<AlertType, { icon: string; tone: string }> = {
  order_new: { icon: 'fa-solid fa-receipt', tone: 'info' },
  payment_confirmed: { icon: 'fa-solid fa-sack-dollar', tone: 'ok' },
  receipt_review: { icon: 'fa-solid fa-magnifying-glass-dollar', tone: 'warn' },
  ticket_new: { icon: 'fa-solid fa-screwdriver-wrench', tone: 'info' },
  human_handoff: { icon: 'fa-solid fa-hand', tone: 'warn' },
  email_failed: { icon: 'fa-solid fa-envelope-circle-check', tone: 'danger' },
}
