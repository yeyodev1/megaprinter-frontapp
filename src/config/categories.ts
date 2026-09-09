import type { Category } from '@/services/catalog'

/**
 * Orden en que se presentan las categorías en la tienda y el ícono de cada una.
 * Las categorías vienen de la API; esto solo decide cómo se ven. Una categoría
 * nueva creada desde el panel se muestra al final con el ícono genérico.
 */
const CATEGORY_ORDER = [
  'laptops',
  'all-in-one',
  'monitores',
  'impresoras',
  'camaras-interior',
  'camaras-exterior',
]

const CATEGORY_ICONS: Record<string, string> = {
  laptops: 'fa-solid fa-laptop',
  'all-in-one': 'fa-solid fa-computer',
  monitores: 'fa-solid fa-desktop',
  impresoras: 'fa-solid fa-print',
  'camaras-interior': 'fa-solid fa-video',
  'camaras-exterior': 'fa-solid fa-camera',
}

export const categoryIcon = (slug: string) => CATEGORY_ICONS[slug] ?? 'fa-solid fa-tag'

const rank = (slug: string) => {
  const index = CATEGORY_ORDER.indexOf(slug)
  return index === -1 ? CATEGORY_ORDER.length : index
}

export const sortCategories = <T extends Pick<Category, 'slug' | 'name'>>(categories: T[]) =>
  [...categories].sort((a, b) => rank(a.slug) - rank(b.slug) || a.name.localeCompare(b.name))

/** Categorías distintas presentes en una lista de productos, ya ordenadas. */
export const categoriesFrom = (items: { category: Category }[]) => {
  const seen = new Map<string, Category>()
  for (const item of items) if (!seen.has(item.category.slug)) seen.set(item.category.slug, item.category)
  return sortCategories([...seen.values()])
}

/** Porcentaje de descuento entero, o 0 si no hay precio anterior válido. */
export const discountPercent = (price: number, originalPrice?: number | null) =>
  originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0
