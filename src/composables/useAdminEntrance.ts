import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { gsap } from 'gsap'

/**
 * Animacion de entrada de las vistas del panel.
 *
 * Antes devolvia un `ref` de plantilla que servia de scope a GSAP, pero
 * `vue-tsc` no reconoce `ref="page"` como uso de la variable y cada vista tenia
 * que escribir `void page` para silenciar TS6133. Como solo se monta una vista
 * de admin a la vez, el selector global es equivalente y no requiere ref.
 */
export const useAdminEntrance = () => {
  let context: gsap.Context | undefined

  onMounted(async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    await nextTick()
    context = gsap.context(() => {
      gsap.from('[data-admin-reveal]', {
        autoAlpha: 0,
        y: 22,
        duration: 0.65,
        stagger: 0.09,
        ease: 'power3.out',
        clearProps: 'transform,opacity,visibility',
      })
    })
  })

  onBeforeUnmount(() => context?.revert())
}
