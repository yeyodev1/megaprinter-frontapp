import { defineStore } from 'pinia'
import { clearAdminToken, getAdminToken, http, setAdminToken } from '@/services/http'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
}

/**
 * Estado de sesion del panel interno. Reemplaza al antiguo `stores/user.ts`,
 * que guardaba `access_token` en localStorage mientras el router y las vistas
 * leian `admin-token` de sessionStorage: dos fuentes de verdad que nunca
 * coincidian.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getAdminToken(),
    user: null as AdminUser | null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },

  actions: {
    async login(email: string, password: string) {
      const { data } = await http.post<{ token: string; user: AdminUser }>('/auth/login', {
        email,
        password,
      })
      this.token = data.token
      this.user = data.user
      setAdminToken(data.token)
    },

    logout() {
      this.token = ''
      this.user = null
      clearAdminToken()
    },
  },
})
