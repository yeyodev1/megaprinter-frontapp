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

export interface LearningData {
  runs: LearningRun[]
  lessons: Lesson[]
  maxActive: number
}

export const getLearning = async () => (await http.get<LearningData>('/bot/learning')).data

/** Revisa los chats de ayer ahora (lo mismo que hace el cron cada mañana). */
export const runLearning = async () => (await http.post('/bot/learning/run', {}, { timeout: 70000 })).data

export const createLesson = async (payload: { kind: LessonKind; text: string; example?: string }) =>
  (await http.post<Lesson>('/bot/learning/lessons', payload)).data

export const updateLesson = async (id: string, payload: Partial<Pick<Lesson, 'kind' | 'text' | 'status'>>) =>
  (await http.patch<Lesson>(`/bot/learning/lessons/${id}`, payload)).data

export const deleteLesson = async (id: string) => (await http.delete(`/bot/learning/lessons/${id}`)).data
