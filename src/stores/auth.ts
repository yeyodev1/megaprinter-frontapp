import { defineStore } from 'pinia'
import { clearAdminToken, getAdminToken, getTokenRole, http, setAdminToken } from '@/services/http'
import { getCurrentUser, type InternalUser } from '@/services/users'

export type AdminUser = InternalUser

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
    // Tras recargar, el rol sale del token hasta que llega el perfil.
    role: (state) => state.user?.role ?? (state.token ? getTokenRole() : ''),
    isAdmin(): boolean {
      return this.role === 'admin'
    },
    isTecnico(): boolean {
      return this.role === 'tecnico'
    },
    /** Lo que se muestra bajo el nombre: correo, WhatsApp o cédula. */
    contact: (state) => state.user?.email || state.user?.phone || state.user?.cedula || '',
  },

  actions: {
    /** `identifier` = correo, cédula o WhatsApp; el backend reconoce cuál es. */
    async login(identifier: string, password: string) {
      const { data } = await http.post<{ token: string; user: AdminUser }>('/auth/login', {
        identifier,
        // Compatibilidad con un backend anterior que solo leía `email`.
        email: identifier,
        password,
      })
      this.token = data.token
      this.user = data.user
      setAdminToken(data.token)
    },

    /** Recupera el perfil tras recargar la página (el token sobrevive, el usuario no). */
    async loadUser() {
      if (this.user || !this.token) return
      try {
        this.user = await getCurrentUser()
      } catch {
        // El interceptor ya gestiona el 401; cualquier otro fallo no bloquea el panel.
      }
    },

    logout() {
      this.token = ''
      this.user = null
      clearAdminToken()
    },
  },
})
