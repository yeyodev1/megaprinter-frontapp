import { readonly, ref } from 'vue'
import { brand } from '@/config/brand'
import { getStorePublic, type Branch } from '@/services/store'

/**
 * Sucursales para la web pública. Arranca con los valores de brand.ts y los
 * reemplaza con lo que el equipo guardó en el panel. La llamada se hace una sola
 * vez por carga de la app y la comparten todos los componentes; si falla, se
 * quedan los valores por defecto.
 */
const city = ref<string>(brand.city)
const branches = ref<Branch[]>(brand.branches.map((branch) => ({ ...branch, hours: [...branch.hours] })))
let request: Promise<void> | null = null

const load = () => {
  request ??= getStorePublic()
    .then((data) => {
      const active = (data.branches ?? []).filter((branch) => branch.active !== false && branch.address)
      if (data.city) city.value = data.city
      if (active.length) branches.value = active
    })
    .catch(() => {
      // Se mantienen los valores de brand.ts.
    })
  return request
}

export const useStoreInfo = () => {
  void load()
  return { city: readonly(city), branches: readonly(branches) }
}
