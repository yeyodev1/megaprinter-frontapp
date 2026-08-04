const raw = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const apiBase = raw.endsWith('/api') ? raw : `${raw}/api`
