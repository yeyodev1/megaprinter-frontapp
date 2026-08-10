import axios, { type AxiosError } from 'axios'
import { apiBase } from '@/services/api'

/**
 * Cliente HTTP unico de la app. Antes cada vista construia sus headers a mano y
 * pasaba el token por parametro, y ningun 401 se manejaba: cuando el token de 8h
 * expiraba la promesa quedaba rechazada sin dueno y el panel quedaba en blanco.
 */
export const http = axios.create({ baseURL: apiBase, timeout: 20000 })

export const ADMIN_TOKEN_KEY = 'admin-token'

export const getAdminToken = () => sessionStorage.getItem(ADMIN_TOKEN_KEY) || ''

export const setAdminToken = (token: string) => sessionStorage.setItem(ADMIN_TOKEN_KEY, token)

export const clearAdminToken = () => sessionStorage.removeItem(ADMIN_TOKEN_KEY)

http.interceptors.request.use((config) => {
  const token = getAdminToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getAdminToken()) {
      clearAdminToken()
      // Un evento en vez de un import del router evita la dependencia circular
      // router -> store -> http -> router.
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    return Promise.reject(error)
  },
)

/**
 * El backend responde `{ error }` desde los controladores y `{ message }` desde
 * el manejador global. Esta funcion normaliza ambos para la UI.
 */
export const errorMessage = (error: unknown, fallback = 'Ocurrió un error inesperado.') => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined
    return data?.error || data?.message || error.message || fallback
  }
  return fallback
}
