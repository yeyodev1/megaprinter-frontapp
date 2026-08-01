import axios from 'axios'
import { catalogFallback } from '@/data/catalog'
import { apiBase } from '@/services/api'

const api = apiBase

export interface Category { _id: string; name: string; slug: string }
export interface CatalogSpecification { label: string; value: string }
export interface CatalogItem { _id: string; slug?: string; name: string; description: string; price: number; originalPrice?: number; imageUrl: string; kind: 'product' | 'service'; active: boolean; category: Category; specifications?: CatalogSpecification[] }
export interface CatalogPayload { name: string; description: string; price: number; imageUrl: string; kind: 'product' | 'service'; active: boolean; category: string }

const adminHeaders = (token: string) => ({ Authorization: `Bearer ${token}` })

export const getCategories = async () => (await axios.get<Category[]>(`${api}/catalog/categories`)).data
export const getCatalog = async (kind?: 'product' | 'service', admin = false, token = '') => {
  try {
    const items = (await axios.get<CatalogItem[]>(`${api}/catalog/products${admin ? '/manage' : ''}`, { params: { kind }, headers: token ? adminHeaders(token) : {} })).data
    return items.length || admin ? items : catalogFallback
  } catch {
    return admin ? [] : catalogFallback
  }
}
export const createCategory = async (name: string, token: string) => (await axios.post<Category>(`${api}/catalog/categories`, { name }, { headers: adminHeaders(token) })).data
export const deleteCategory = (id: string, token: string) => axios.delete(`${api}/catalog/categories/${id}`, { headers: adminHeaders(token) })
export const createCatalogItem = async (payload: CatalogPayload, token: string) => (await axios.post<CatalogItem>(`${api}/catalog/products`, payload, { headers: adminHeaders(token) })).data
export const updateCatalogItem = async (id: string, payload: CatalogPayload, token: string) => (await axios.put<CatalogItem>(`${api}/catalog/products/${id}`, payload, { headers: adminHeaders(token) })).data
export const deleteCatalogItem = (id: string, token: string) => axios.delete(`${api}/catalog/products/${id}`, { headers: adminHeaders(token) })
export const uploadCatalogImage = async (file: File, token: string) => {
  const data = new FormData()
  data.append('image', file)
  return (await axios.post<{ url: string }>(`${api}/catalog/uploads/image`, data, { headers: adminHeaders(token) })).data
}
export const importOffersCatalog = async (token: string) => (await axios.post<{ imported: number }>(`${api}/catalog/products/import-offers`, {}, { headers: adminHeaders(token) })).data
