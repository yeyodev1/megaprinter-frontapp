import { nextTick, onBeforeUnmount, onMounted } from 'vue'

/**
 * Revelado de secciones al entrar en pantalla.
 *
 * Historia de por que esta implementado asi:
 *
 * 1. Con `gsap.from({ autoAlpha: 0 })` + ScrollTrigger, el pin de la seccion
 *    horizontal cambiaba la altura del documento, las posiciones de los demas
 *    triggers quedaban obsoletas y varias secciones se congelaban a media
 *    opacidad.
 * 2. Con IntersectionObserver el problema fue otro: el observer no emite
 *    entradas mientras la pestana esta en segundo plano, asi que una pestana
 *    abierta en background se quedaba con secciones enteras invisibles.
 *
 * Por eso se mide con `getBoundingClientRect` en scroll/resize/visibilitychange:
 * es barato para media docena de elementos y siempre converge. Ademas el estado
 * oculto lo aplica JavaScript, de modo que si el script no corre el contenido
 * se ve igual.
 */
const REVEAL_RATIO = 0.92

export const useReveal = () => {
  let targets: HTMLElement[] = []
  let frame = 0

  const reveal = (element: HTMLElement) => {
    element.classList.add('is-revealed')
    targets = targets.filter((item) => item !== element)
  }

  const check = () => {
    frame = 0
    if (!targets.length) return

    const limit = window.innerHeight * REVEAL_RATIO
    for (const element of [...targets]) {
      if (element.getBoundingClientRect().top < limit) reveal(element)
    }

    if (!targets.length) stop()
  }

  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(check)
  }

  function stop() {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    document.removeEventListener('visibilitychange', schedule)
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  onMounted(async () => {
    await nextTick()

    targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!targets.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    for (const element of targets) element.classList.add('reveal-ready')

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document.addEventListener('visibilitychange', schedule)

    check()
  })

  onBeforeUnmount(stop)
}
