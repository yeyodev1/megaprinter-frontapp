import { onBeforeUnmount, watch, type Ref } from 'vue'

let lockCount = 0

const apply = (locked: boolean) => {
  lockCount = Math.max(0, lockCount + (locked ? 1 : -1))
  document.body.classList.toggle('is-scroll-locked', lockCount > 0)
}

/**
 * Bloquea el scroll del documento mientras un drawer o modal esta abierto.
 * Lleva un contador porque el carrito y el modal de pago pueden solaparse: sin
 * el, cerrar uno desbloqueaba el scroll con el otro todavia abierto.
 */
export const useScrollLock = (isOpen: Ref<boolean>) => {
  let held = false

  const release = () => {
    if (!held) return
    held = false
    apply(false)
  }

  watch(
    isOpen,
    (open) => {
      if (open && !held) {
        held = true
        apply(true)
      } else if (!open) {
        release()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(release)
}
