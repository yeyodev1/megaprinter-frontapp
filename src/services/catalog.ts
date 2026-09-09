import { catalogFallback } from '@/data/catalog'
import { http } from '@/services/http'

export interface Category {
  _id: string
  name: string
  slug: string
}

export interface CatalogSpecification {
  label: string
  value: string
}

export interface CatalogItem {
  _id: string
  slug?: string
  name: string
  description: string
  price: number
  originalPrice?: number
  imageUrl: string
  kind: 'product' | 'service'
  active: boolean
  category: Category
  specifications?: CatalogSpecification[]
}

export interface CatalogPayload {
  name: string
  description: string
  price: number
  originalPrice?: number | null
  imageUrl: string
  kind: 'product' | 'service'
  active: boolean
  category: string
  specifications?: CatalogSpecification[]
}

const UNCATEGORISED: Category = { _id: '', name: 'General', slug: 'general' }

/**
 * El backend hace `.populate('category')`, pero si una categoria fue borrada la
 * referencia queda colgando y llega `null`. Toda la UI lee `category.name` /
 * `category.slug`, asi que sin este saneo la vista revienta con
 * "Cannot read properties of null".
 */
const normalise = (item: CatalogItem): CatalogItem => ({
  ...item,
  category: item.category ?? UNCATEGORISED,
  specifications: item.specifications ?? [],
})

export const getCategories = async () => (await http.get<Category[]>('/catalog/categories')).data

export const getCatalog = async (kind?: 'product' | 'service', admin = false) => {
  try {
    const { data } = await http.get<CatalogItem[]>(
      `/catalog/products${admin ? '/manage' : ''}`,
      { params: { kind } },
    )
    return data.map(normalise)
  } catch (error) {
    if (admin) throw error
    // Solo cuando el backend no responde mostramos el catalogo de respaldo. Si
    // la API responde con una lista vacia se respeta: antes se sustituia por
    // productos de demo y el cliente podia "comprar" algo inexistente.
    console.warn('[catalog] backend no disponible, usando catálogo de respaldo', error)
    return kind === 'service' ? [] : catalogFallback.map(normalise)
  }
}

export const createCategory = async (name: string) =>
  (await http.post<Category>('/catalog/categories', { name })).data

export const updateCategory = async (id: string, name: string) =>
  (await http.put<Category>(`/catalog/categories/${id}`, { name })).data

export const deleteCategory = (id: string) => http.delete(`/catalog/categories/${id}`)

export const createCatalogItem = async (payload: CatalogPayload) =>
  (await http.post<CatalogItem>('/catalog/products', payload)).data

export const updateCatalogItem = async (id: string, payload: CatalogPayload) =>
  (await http.put<CatalogItem>(`/catalog/products/${id}`, payload)).data

export const deleteCatalogItem = (id: string) => http.delete(`/catalog/products/${id}`)

export const uploadCatalogImage = async (file: File) => {
  const data = new FormData()
  data.append('image', file)
  return (await http.post<{ url: string }>('/catalog/uploads/image', data)).data
}

export interface ImportSummary {
  imported: number
  created: number
  updated: number
  categories: number
}

export const importOffersCatalog = async () =>
  (await http.post<ImportSummary>('/catalog/products/import-offers', {})).data
