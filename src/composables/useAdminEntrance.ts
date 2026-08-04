import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'

export const useAdminEntrance = () => {
  const root = ref<HTMLElement>()
  let context: gsap.Context | undefined

  onMounted(async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    await nextTick()
    context = gsap.context(() => {
      gsap.from('[data-admin-reveal]', { autoAlpha: 0, y: 22, duration: 0.65, stagger: 0.09, ease: 'power3.out', clearProps: 'transform,opacity,visibility' })
    }, root.value)
  })

  onBeforeUnmount(() => context?.revert())
  return root
}
