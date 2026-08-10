import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import '@/styles/global.scss'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// El interceptor HTTP emite este evento cuando el backend responde 401. Antes
// la promesa quedaba rechazada sin dueno y el panel se quedaba en blanco al
// expirar el token de 8 horas.
const auth = useAuthStore(pinia)
window.addEventListener('auth:expired', () => {
  auth.logout()
  router.push({ name: 'Login', query: { expired: '1' } })
})

app.mount('#app')
