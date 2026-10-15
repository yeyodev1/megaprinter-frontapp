import { http } from '@/services/http'

export interface BranchHours {
  days: string
  time: string
}

export interface Branch {
  name: string
  address: string
  mapsUrl: string
  hours: BranchHours[]
  active: boolean
}

export interface StorePublic {
  city: string
  branches: Branch[]
  updatedAt: string | null
}

export interface StoreSettings extends StorePublic {
  updatedBy: string
}

/** Sin token: lo usa la web pública (footer). */
export const getStorePublic = async () => (await http.get<StorePublic>('/settings/store/public')).data

export const getStoreSettings = async () => (await http.get<StoreSettings>('/settings/store')).data

export const saveStoreSettings = async (payload: { city: string; branches: Branch[] }) =>
  (await http.put<StoreSettings>('/settings/store', payload)).data
