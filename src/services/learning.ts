import { http } from '@/services/http'

export type LessonKind = 'frase' | 'respuesta' | 'evitar'
export type LessonStatus = 'activa' | 'pendiente' | 'descartada'

export interface Lesson {
  _id: string
  kind: LessonKind
  text: string
  example: string
  status: LessonStatus
  source: 'auto' | 'manual'
  learnedFrom: string
  reason: string
  updatedBy: string
  updatedAt: string
}

export interface LearningRun {
  _id: string
  metrics: { conversations: number; messages: number; notUnderstood: number; handoffs: number; orders: number; tickets: number; repeated: number }
  summary: string
  devSuggestions: string[]
  lessonsActive: number
  lessonsPending: number
  analyzed: boolean
  error: string
}

/** Un chat que salió mal y Mila revisó al momento. */
export interface ChatReview {
  _id: string
  phone: string
  trigger: 'no_entendio' | 'repitio' | 'asesor' | string
  summary: string
  added: Array<{ kind: LessonKind; text: string; status: LessonStatus; reason: string }>
  error: string
  createdAt: string
}

export interface LearningData {
  runs: LearningRun[]
  lessons: Lesson[]
  reviews: ChatReview[]
  maxActive: number
}

export type PhotoStatus = 'sugerida' | 'confirmada' | 'corregida' | 'descartada'

export interface PhotoMatch {
  _id: string
  phone: string
  imageUrl: string
  description: string
  searchQuery: string
  suggestedIds: string[]
  exactMatch: boolean
  productId: string | null
  status: PhotoStatus
  confirmedBy: string
  createdAt: string
}

export interface PhotoProduct {
  _id: string
  name: string
  price: number
  imageUrl: string
  category: string
}

export interface PhotosData {
  photos: PhotoMatch[]
  products: PhotoProduct[]
  counts: Partial<Record<PhotoStatus, number>>
}

export interface Persona {
  personality: string
  alwaysSay: string[]
  neverSay: string[]
  updatedBy?: string
  updatedAt?: string | null
}

export const getLearning = async () => (await http.get<LearningData>('/bot/learning')).data

/** Revisa los chats de ayer ahora (lo mismo que hace el cron cada mañana). */
export const runLearning = async () => (await http.post('/bot/learning/run', {}, { timeout: 70000 })).data

export const createLesson = async (payload: { kind: LessonKind; text: string; example?: string }) =>
  (await http.post<Lesson>('/bot/learning/lessons', payload)).data

export const updateLesson = async (id: string, payload: Partial<Pick<Lesson, 'kind' | 'text' | 'status'>>) =>
  (await http.patch<Lesson>(`/bot/learning/lessons/${id}`, payload)).data

export const deleteLesson = async (id: string) => (await http.delete(`/bot/learning/lessons/${id}`)).data

export const getPhotos = async () => (await http.get<PhotosData>('/bot/learning/photos')).data

/** El equipo dice cuál era el producto (null = no está en el catálogo) o descarta la foto. */
export const correctPhoto = async (id: string, payload: { productId: string | null } | { status: 'descartada' }) =>
  (await http.patch<PhotoMatch>(`/bot/learning/photos/${id}`, payload)).data

export const getPersona = async () => (await http.get<Persona>('/bot/persona')).data

export const savePersona = async (payload: Persona) => (await http.put<Persona>('/bot/persona', payload)).data
