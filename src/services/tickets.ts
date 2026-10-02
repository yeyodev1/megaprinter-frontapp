import { http } from '@/services/http'

export type TicketType = 'servicio_tecnico' | 'suministros'
export type TicketStatus = 'nuevo' | 'en_revision' | 'cotizado' | 'en_reparacion' | 'listo' | 'entregado' | 'cancelado'

export interface ServiceTicket {
  _id: string
  ticketNumber: string
  type: TicketType
  status: TicketStatus
  channel: 'whatsapp_bot' | 'web' | 'panel'
  customerName: string
  customerPhone: string
  customerEmail: string
  device: string
  issue: string
  category: string
  priceMin: number | null
  priceMax: number | null
  priceSource: 'catalogo' | 'referencial' | 'por_cotizar'
  finalPrice: number | null
  assignedTo: string
  notes: Array<{ text: string; by: string; at: string }>
  statusHistory: Array<{ status: TicketStatus; by: string; at: string }>
  createdAt: string
  updatedAt: string
}

export const listTickets = async () => (await http.get<ServiceTicket[]>('/tickets')).data

export const updateTicket = async (
  id: string,
  data: Partial<{ status: TicketStatus; note: string; finalPrice: number | null; assignedTo: string }>,
) => (await http.patch<ServiceTicket>(`/tickets/${id}`, data)).data

export const TICKET_STATUSES: Array<{ value: TicketStatus; label: string; icon: string }> = [
  { value: 'nuevo', label: 'Nuevo', icon: 'fa-solid fa-inbox' },
  { value: 'en_revision', label: 'En revisión', icon: 'fa-solid fa-magnifying-glass' },
  { value: 'cotizado', label: 'Cotizado', icon: 'fa-solid fa-file-invoice-dollar' },
  { value: 'en_reparacion', label: 'En reparación', icon: 'fa-solid fa-screwdriver-wrench' },
  { value: 'listo', label: 'Listo para entregar', icon: 'fa-solid fa-circle-check' },
  { value: 'entregado', label: 'Entregado', icon: 'fa-solid fa-house-circle-check' },
  { value: 'cancelado', label: 'Cancelado', icon: 'fa-solid fa-ban' },
]

export const ticketStatusMeta = (status: string) =>
  TICKET_STATUSES.find((item) => item.value === status) ?? { value: status as TicketStatus, label: status, icon: 'fa-solid fa-circle' }

export const DEVICE_LABEL: Record<string, string> = {
  impresora: '🖨️ Impresora',
  laptop: '💻 Laptop',
  pc: '🖥️ PC o all in one',
  monitor: '🖥️ Monitor',
  camara: '📹 Cámaras',
}
