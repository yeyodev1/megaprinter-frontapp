import { http } from '@/services/http'

export interface BankAccount {
  id?: string
  bankCode: string
  bank: string
  accountType: string
  accountNumber: string
  accountHolder: string
  holderId: string
  logoUrl: string
  active: boolean
}

export interface TransferSettings {
  enabled: boolean
  accounts: BankAccount[]
}

export interface KnownBank {
  code: string
  name: string
  logoUrl: string
}

export interface PaymentSettings {
  transfer: TransferSettings
  updatedBy: string
  updatedAt: string | null
  knownBanks: KnownBank[]
}

export const getPaymentSettings = async () => (await http.get<PaymentSettings>('/settings/payments')).data

export const savePaymentSettings = async (transfer: TransferSettings) =>
  (await http.put<PaymentSettings>('/settings/payments', { transfer })).data
