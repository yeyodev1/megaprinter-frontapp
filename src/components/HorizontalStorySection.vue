<template>
  <section ref="section" class="story" aria-labelledby="story-title">
    <header class="story-header">
      <div><span>02 / Método Megaprinter</span><h2 id="story-title">Del problema a<br><em>volver a operar.</em></h2></div>
      <p>Desliza para conocer cómo convertimos una interrupción técnica en una respuesta clara.</p>
    </header>
    <div class="story-viewport">
      <div ref="track" class="story-track">
        <article v-for="(step, index) in steps" :key="step.title" class="story-card">
          <div class="story-image"><img :src="step.image" :alt="step.title"></div>
          <div class="story-content"><span>0{{ index + 1 }} / 04</span><h3>{{ step.title }}</h3><p>{{ step.text }}</p><i :class="step.icon" aria-hidden="true"></i></div>
        </article>
        <div class="story-end"><span>Megaprinter</span><strong>Tu operación<br>continúa.</strong><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></div>
      </div>
    </div>
    <div class="story-progress"><span ref="progress"></span><small>Desplázate</small></div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
const section = ref<HTMLElement>()
const track = ref<HTMLElement>()
const progress = ref<HTMLElement>()
void section
void track
void progress
let context: gsap.Context | undefined

const steps = [
  { title: 'Cuéntanos qué ocurre', text: 'Recibimos tu consulta y entendemos el impacto real en tu jornada.', icon: 'fa-solid fa-message', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=90' },
  { title: 'Diagnosticamos sin adivinar', text: 'Revisamos el equipo y aislamos la causa antes de proponer una solución.', icon: 'fa-solid fa-magnifying-glass-chart', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=90' },
  { title: 'Te damos una respuesta clara', text: 'Conoces el trabajo, el presupuesto y los siguientes pasos antes de avanzar.', icon: 'fa-solid fa-file-circle-check', image: 'https://megaprinter.ec/wp-content/uploads/2024/05/impresoras-mantenimiento.jpg' },
  { title: 'Volvemos a poner todo en marcha', text: 'Probamos, calibramos y te entregamos un equipo listo para producir.', icon: 'fa-solid fa-bolt', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=90' },
]

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  if (!section.value || !track.value || !progress.value) return
  const sectionElement = section.value
  const trackElement = track.value
  const progressElement = progress.value
  context = gsap.context(() => {
    const media = gsap.matchMedia()
    const createHorizontalSequence = (durationMultiplier: number) => {
      const getDistance = () => Math.max(0, trackElement.scrollWidth - sectionElement.clientWidth)
      const horizontal = gsap.to(trackElement, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionElement,
          start: 'top top',
          end: () => `+=${getDistance() * durationMultiplier}`,
          pin: true,
          scrub: 1.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: self => gsap.set(progressElement, { scaleX: self.progress, transformOrigin: 'left center' }),
        },
      })
      return () => horizontal.scrollTrigger?.kill()
    }
    media.add('(max-width: 799px)', () => createHorizontalSequence(1.8))
    media.add('(min-width: 800px)', () => createHorizontalSequence(1.45))
  }, sectionElement)
})

onBeforeUnmount(() => context?.revert())
</script>

<style scoped lang="scss">
.story { min-height:100svh; padding:78px 24px 35px; box-sizing:border-box; overflow:hidden; background:#0d171d; color:#f3f3ed; display:flex; flex-direction:column; gap:34px; }.story-header { display:flex; flex-direction:column; gap:18px; }.story-header>div { display:flex; flex-direction:column; gap:14px; }.story-header span,.story-content>span,.story-end>span { color:#64b8ef; font-size:10px; font-weight:900; letter-spacing:1.4px; text-transform:uppercase; }.story h2 { margin:0; max-width:680px; font-size:clamp(2.8rem,9vw,6.2rem); line-height:.86; letter-spacing:-.08em; }.story h2 em { color:#54abec; font-family:Georgia,serif; font-weight:400; }.story-header p { max-width:330px; margin:0; color:#a7bac5; font-size:14px; line-height:1.6; }.story-viewport { width:calc(100% + 24px); overflow:hidden; margin-right:-24px; padding:0 24px 12px 0; touch-action:pan-y; }.story-track { width:max-content; padding-right:24px; display:flex; align-items:stretch; gap:14px; }.story-card { width:78vw; max-width:350px; min-height:440px; overflow:hidden; display:flex; flex-direction:column; background:#17262e; }.story-image { height:225px; overflow:hidden; }.story-image img { width:100%; height:100%; object-fit:cover; filter:saturate(.8) contrast(1.08); }.story-content { flex:1; padding:21px; display:flex; flex-direction:column; align-items:flex-start; gap:12px; }.story-content h3 { margin:0; font-size:25px; line-height:.95; letter-spacing:-.055em; }.story-content p { margin:0; color:#b7c6cc; font-size:13px; line-height:1.55; }.story-content i { margin-top:auto; color:#65b9ef; font-size:20px; }.story-end { width:calc(100vw - 48px); min-height:440px; padding:28px; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; background:#48a6e7; color:#08141b; }.story-end>span { color:#163b55; }.story-end strong { max-width:290px; font-size:clamp(2rem,9vw,3.5rem); line-height:.86; letter-spacing:-.07em; }.story-end i { align-self:flex-end; font-size:28px; }.story-progress { margin-top:auto; display:flex; align-items:center; gap:11px; color:#9ab1bd; font-size:10px; font-weight:900; letter-spacing:1px; text-transform:uppercase; }.story-progress:before { content:''; width:90px; height:2px; background:rgba(255,255,255,.2); }.story-progress span { width:90px; height:2px; position:absolute; background:#63b9ef; transform:scaleX(.25); transform-origin:left center; }.story-progress small { font:inherit; } @media (min-width:800px) { .story { padding:82px max(5vw,48px) 42px; }.story-header { flex-direction:row; align-items:flex-end; justify-content:space-between; }.story-header p { margin-bottom:9px; }.story-viewport { width:auto; overflow:visible; margin:0; padding:0; }.story-track { padding-right:0; gap:22px; }.story-card { width:min(36vw,470px); max-width:none; min-height:520px; }.story-image { height:285px; }.story-content { padding:28px; }.story-end { width:min(27vw,360px); min-height:520px; }.story-progress { margin-top:auto; } }
</style>
