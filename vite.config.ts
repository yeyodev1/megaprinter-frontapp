import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { findFreePort } from './scripts/findFreePort'

// Puerto base propio del proyecto. Se puede forzar uno concreto con
// `PORT=5200 pnpm dev`.
const BASE_PORT = Number(process.env.PORT) || 5173

export default defineConfig(async ({ command }) => {
  // Solo el servidor de desarrollo necesita buscar puerto; `vite build` no abre
  // ningun socket y sondearlo solo alargaria la compilacion.
  const port = command === 'serve' ? await findFreePort(BASE_PORT) : BASE_PORT

  if (command === 'serve' && port !== BASE_PORT) {
    console.log(`[megaprinter] Puerto ${BASE_PORT} ocupado — usando ${port}.`)
  }

  return {
    plugins: [vue()],
    server: {
      host: true,
      port,
      // El puerto ya se comprobo libre en comodin y loopback, asi que se fija:
      // si algo lo tomara entre medias es mejor fallar de forma visible que
      // arrancar en silencio en otro sitio.
      strictPort: true,
      allowedHosts: ['testing-storybrand-frontend.bakano.ec'],
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://localhost:8101',
          changeOrigin: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/styles/index.scss" as *;`,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'esnext',
    },
  }
})
