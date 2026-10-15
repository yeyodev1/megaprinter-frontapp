import { http } from '@/services/http'
import type { InternalUser } from '@/services/users'

export interface TechnicianPayload {
  name: string
  phone: string
  cedula: string
  email: string
}

export const listTechnicians = async () => (await http.get<InternalUser[]>('/auth/technicians')).data

export const createTechnician = async (payload: TechnicianPayload & { password: string }) =>
  (await http.post<InternalUser>('/auth/technicians', payload)).data

/** Un campo vacío borra ese dato; `active` activa o desactiva el acceso. */
export const updateTechnician = async (id: string, payload: Partial<TechnicianPayload & { active: boolean }>) =>
  (await http.patch<InternalUser>(`/auth/technicians/${id}`, payload)).data

export const resetTechnicianPassword = async (id: string, password: string) =>
  (await http.post<InternalUser>(`/auth/technicians/${id}/password`, { password })).data

/** +593991234567 → 099 123 4567, como lo escribe la gente en Ecuador. */
export const formatPhone = (phone: string) => {
  const match = /^\+593(9\d)(\d{3})(\d{4})$/.exec(phone)
  return match ? `0${match[1]} ${match[2]} ${match[3]}` : phone
}
