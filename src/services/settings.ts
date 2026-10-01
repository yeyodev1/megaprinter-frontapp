import { http } from '@/services/http'
import type { BankDetails } from '@/services/orders'

export interface TransferSettings extends BankDetails {
  enabled: boolean
}

export interface PaymentSettings {
  transfer: TransferSettings
  updatedBy: string
  updatedAt: string | null
}

export const getPaymentSettings = async () => (await http.get<PaymentSettings>('/settings/payments')).data

export const savePaymentSettings = async (transfer: TransferSettings) =>
  (await http.put<PaymentSettings>('/settings/payments', { transfer })).data
