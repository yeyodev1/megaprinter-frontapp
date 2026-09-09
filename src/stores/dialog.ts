import { defineStore } from 'pinia'

export type DialogTone = 'default' | 'danger' | 'success' | 'warning'

export interface DialogOptions {
  title: string
  message?: string
  /** Detalle secundario en monoespaciada (por ejemplo el nombre del registro). */
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
  icon?: string
}

interface DialogEntry {
  id: number
  kind: 'confirm' | 'notify'
  options: DialogOptions
  resolve: (value: boolean) => void
}

let nextId = 1

/**
 * Reemplazo de `alert()` y `confirm()` del navegador. Las vistas piden un
 * diálogo y reciben una promesa; `DialogHost` (montado en App.vue) lo dibuja
 * con los estilos del sitio. Se encolan para que dos avisos seguidos no se
 * pisen.
 */
export const useDialogStore = defineStore('dialog', {
  state: () => ({ queue: [] as DialogEntry[] }),

  getters: {
    current: (state) => state.queue[0] ?? null,
  },

  actions: {
    push(kind: DialogEntry['kind'], options: DialogOptions) {
      return new Promise<boolean>((resolve) => {
        this.queue.push({ id: nextId++, kind, options, resolve })
      })
    },

    /** Pregunta antes de una acción; resuelve `true` si el usuario confirma. */
    confirm(options: DialogOptions) {
      return this.push('confirm', options)
    },

    /** Aviso con un solo botón. */
    notify(options: DialogOptions) {
      return this.push('notify', options).then(() => undefined)
    },

    resolve(value: boolean) {
      const entry = this.queue.shift()
      entry?.resolve(value)
    },
  },
})
