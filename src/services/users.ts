import { http } from '@/services/http'

export type UserRole = 'admin' | 'tecnico'

export interface InternalUser {
  id: string
  name: string
  email: string
  /** WhatsApp normalizado (+5939XXXXXXXX). */
  phone: string
  cedula: string
  role: UserRole
  active: boolean
  createdAt: string
}

export const listUsers = async () => (await http.get<InternalUser[]>('/auth/users')).data

export const createUser = async (payload: { name: string; email: string; password: string }) =>
  (await http.post<InternalUser>('/auth/users', payload)).data

export const deleteUser = (id: string) => http.delete(`/auth/users/${id}`)

export const getCurrentUser = async () => (await http.get<InternalUser>('/auth/me')).data
