import { http } from '@/services/http'

export type HandoffStatus = 'atendido' | 'sin_atender' | 'posible_sin_atender' | 'sin_confirmar'

export interface AttentionReport {
  date: string
  crm: boolean
  totals: {
    conversations: number
    messages: number
    botOnly: number
    handoffs: number
    attended: number
    unattended: number
    unknown: number
    tickets: number
    orders: number
    notUnderstood: number
    avgResponseMinutes: number | null
  }
  handoffs: Array<{ phone: string; name: string; at: string; reason: string; status: HandoffStatus; responseMinutes: number | null; followUps: number; lastMessage: string }>
  notUnderstood: Array<{ phone: string; name: string; at: string; message: string; reply: string }>
  hourly: number[]
}

export interface CrmHealth {
  enabled: boolean
  ok: boolean
  message: string
  columns?: Array<{ id: string; name: string }>
}

export const getAttentionReport = async (date: string) => (await http.get<AttentionReport>('/reports/attention', { params: { date }, timeout: 45000 })).data

export const sendAttentionReport = async (date: string) => (await http.post<{ ok: boolean }>('/reports/attention/send', { date }, { timeout: 45000 })).data

export const getCrmHealth = async () => (await http.get<CrmHealth>('/reports/crm')).data

export const HANDOFF_STATUS: Record<HandoffStatus, { label: string; tone: string; icon: string }> = {
  atendido: { label: 'Atendido', tone: 'ok', icon: 'fa-solid fa-circle-check' },
  sin_atender: { label: 'Sin atender', tone: 'danger', icon: 'fa-solid fa-circle-xmark' },
  posible_sin_atender: { label: 'Siguió escribiendo', tone: 'warn', icon: 'fa-solid fa-triangle-exclamation' },
  sin_confirmar: { label: 'Sin confirmar', tone: 'muted', icon: 'fa-solid fa-circle-question' },
}
