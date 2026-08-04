<template>
  <div ref="page" class="home-page">
    <Navbar />
    <main>
      <section class="hero">
        <div class="hero-copy" data-hero-copy>
          <div class="index-line"><span>01</span><i></i><span>Megaprinter / Guayaquil</span></div>
          <h1>El ritmo de tu negocio <em>no se detiene.</em></h1>
          <p>Soporte técnico, impresión profesional y equipos que responden cuando más los necesitas.</p>
          <div class="hero-actions">
            <router-link to="/repairs" class="primary-link">Agendar diagnóstico <i class="fa-solid fa-arrow-down"></i></router-link>
            <router-link to="/products" class="text-link">Ver equipos <i class="fa-solid fa-arrow-up-right-from-square"></i></router-link>
          </div>
        </div>
        <div class="hero-art" data-hero-art>
          <div class="image-frame"><img src="https://megaprinter.ec/wp-content/uploads/2024/05/impresoras-mantenimiento.jpg" alt="Técnico de Megaprinter realizando mantenimiento" /></div>
          <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="service-stamp"><span>Desde</span><strong>2008</strong><span>Servicio que imprime confianza</span></div>
        </div>
      </section>

      <section class="signal-band" data-home-reveal>
        <span>Impresoras</span><i></i><span>Laptops</span><i></i><span>Repuestos</span><i></i><span>Soporte corporativo</span>
      </section>

      <ProductFinder />

      <HorizontalStorySection />

      <section id="servicios" class="services-intro" data-home-reveal>
        <div class="section-label">02 / Capacidades</div>
        <div class="section-heading"><h2>Una respuesta exacta para cada <em>interrupción.</em></h2><p>Unimos experiencia de taller, diagnóstico real y logística local para que tu operación vuelva a funcionar.</p></div>
        <div class="services-rail">
          <article v-for="service in services" :key="service.number" class="service-card" data-service-card>
            <div class="service-image"><img :src="service.image" :alt="service.name"></div>
            <span class="card-number">{{ service.number }}</span><i :class="service.icon"></i>
            <h3>{{ service.name }}</h3><p>{{ service.text }}</p><router-link :to="service.link">Explorar <i class="fa-solid fa-arrow-right"></i></router-link>
          </article>
        </div>
      </section>

      <section class="promise" data-home-reveal>
        <div class="promise-image"><img src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1500&q=90" alt="Técnico realizando mantenimiento de precisión" /></div>
        <div class="promise-copy"><span>03 / Compromiso</span><h2>No adivinamos.<br><em>Diagnosticamos.</em></h2><p>Antes de intervenir un equipo, identificamos la causa, explicamos el proceso y esperamos tu aprobación.</p><div class="promise-metrics"><div><strong>24 h</strong><span>respuesta inicial</span></div><div><strong>4 pasos</strong><span>proceso transparente</span></div></div></div>
      </section>

      <section class="closing-cta" data-home-reveal><span>¿Tu equipo está detenido?</span><router-link to="/repairs">Hagámoslo funcionar <i class="fa-solid fa-arrow-right"></i></router-link></section>
    </main>
    <FooterSection /><CheckoutModal />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import ProductFinder from '@/components/ProductFinder.vue'
import HorizontalStorySection from '@/components/HorizontalStorySection.vue'

gsap.registerPlugin(ScrollTrigger)
const page = ref<HTMLElement>()
void page
let context: gsap.Context | undefined

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()
  context = gsap.context(() => {
    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    timeline.from('[data-hero-copy] > *', { autoAlpha: 0, y: 26, stagger: 0.1, duration: 0.72 })
      .from('[data-hero-art]', { autoAlpha: 0, scale: 0.94, duration: 0.9 }, '-=.5')

    gsap.utils.toArray<HTMLElement>('[data-home-reveal]').forEach(section => {
      gsap.from(section, { autoAlpha: 0, y: 34, duration: 0.72, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 86%', once: true } })
    })
    gsap.utils.toArray<HTMLElement>('[data-service-card]').forEach((card, index) => {
      gsap.from(card, { autoAlpha: 0, y: 28, duration: 0.58, ease: 'power3.out', delay: index * 0.08, scrollTrigger: { trigger: card.parentElement, start: 'top 82%', once: true } })
      gsap.fromTo(card.querySelector('.service-image img'), { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.6 } })
    })
    gsap.to('.hero-art .image-frame img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 } })
    gsap.fromTo('.promise-image img', { yPercent: -9, scale: 1.15 }, { yPercent: 9, scale: 1, ease: 'none', scrollTrigger: { trigger: '.promise', start: 'top bottom', end: 'bottom top', scrub: 0.7 } })
  }, page.value)
})

onBeforeUnmount(() => context?.revert())

const services = [
  { number: '01', name: 'Taller técnico', text: 'Mantenimiento y reparación con evaluación profesional.', icon: 'fa-solid fa-screwdriver-wrench', link: '/repairs', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=85' },
  { number: '02', name: 'Venta inteligente', text: 'Equipos y suministros seleccionados para tu operación.', icon: 'fa-solid fa-print', link: '/products', image: 'https://megaprinter.ec/wp-content/uploads/2024/05/impresoras-mantenimiento.jpg' },
  { number: '03', name: 'Soporte en sitio', text: 'Atención para empresas sin detener tu jornada.', icon: 'fa-solid fa-building', link: '/repairs', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=85' },
]
</script>

<style scoped lang="scss">
.home-page { min-height: 100vh; background: #f1efe9; color: #101519; display: flex; flex-direction: column; }
main { overflow: hidden; }.hero { min-height: 100svh; padding: 120px 24px 48px; display: flex; flex-direction: column; justify-content: space-between; gap: 45px; background: #101519; color: #f6f3ec; }.hero-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 24px; max-width: 720px; }.index-line { display: flex; align-items: center; gap: 10px; color: #82b8e9; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }.index-line i { width: 36px; height: 1px; background: #4e91cc; }.hero h1 { max-width: 720px; font-size: clamp(3.35rem, 11vw, 7.9rem); font-weight: 800; letter-spacing: -.085em; line-height: .86; }.hero h1 em,.section-heading em,.promise-copy em { color: #3b9ff2; font-family: Georgia,serif; font-weight: 400; }.hero-copy > p { max-width: 440px; color: #b3bec8; font-size: 16px; line-height: 1.65; }.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 18px; }.primary-link,.text-link { display: flex; align-items: center; gap: 10px; text-decoration: none; font-weight: 800; font-size: 13px; }.primary-link { padding: 15px 18px; border-radius: 2px; background: #3b9ff2; color: #071017; }.text-link { color: #f6f3ec; }.hero-art { position: relative; display: flex; justify-content: flex-end; min-height: 280px; }.image-frame { width: min(100%,560px); height: 330px; overflow: hidden; border-radius: 0 70px 0 0; }.image-frame img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.1); mix-blend-mode: screen; opacity: .82; }.orbit { position: absolute; border: 1px solid rgba(104,180,245,.35); border-radius: 50%; pointer-events: none; }.orbit-one { width: 240px; height: 240px; top: -45px; right: -65px; }.orbit-two { width: 350px; height: 350px; top: -100px; right: -110px; }.service-stamp { position: absolute; left: 0; bottom: -20px; width: 145px; min-height: 145px; padding: 18px; background: #3b9ff2; color: #071017; display: flex; flex-direction: column; justify-content: space-between; border-radius: 50%; transform: rotate(-9deg); }.service-stamp strong { font-size: 29px; }.service-stamp span { font-size: 10px; font-weight: 800; line-height: 1.2; text-transform: uppercase; }
.signal-band { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; padding: 17px 24px; background: #3b9ff2; color: #071017; font-size: 11px; font-weight: 900; letter-spacing: 1.4px; text-transform: uppercase; }.signal-band i { width: 4px; height: 4px; border-radius: 50%; background: #071017; }
.services-intro { padding: 100px 24px; display: flex; flex-direction: column; gap: 35px; }.section-label,.promise-copy > span { color: #478cc4; font-size: 11px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; }.section-heading { display: flex; flex-direction: column; gap: 20px; }.section-heading h2,.promise-copy h2 { max-width: 750px; font-size: clamp(2.7rem,8vw,5.8rem); letter-spacing: -.075em; line-height: .9; }.section-heading p { max-width: 350px; color: #5b646a; line-height: 1.6; }.services-rail { display: flex; flex-direction: column; border-top: 1px solid #bec1bd; }.service-card { padding: 24px 0; border-bottom: 1px solid #bec1bd; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; transition: padding .25s ease; }.service-image { width:100%; height:150px; overflow:hidden; background:#cad7dc; }.service-image img { width:100%; height:100%; object-fit:cover; filter:saturate(.75) contrast(1.08); }.service-card:hover { padding-left: 12px; }.card-number { color: #7b8589; font-size: 11px; font-weight: 800; }.service-card > i { font-size: 24px; color: #3b9ff2; }.service-card h3 { font-size: 25px; letter-spacing: -.04em; }.service-card p { color: #5b646a; line-height: 1.5; }.service-card a { color: #101519; text-decoration: none; font-weight: 800; font-size: 13px; }
.promise { display: flex; flex-direction: column; background: #d9e4eb; }.promise-image { height: 310px; overflow: hidden; background: #1c2933; }.promise-image img { width: 100%; height: 100%; object-fit: cover; opacity: .8; }.promise-copy { padding: 55px 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 21px; }.promise-copy p { max-width: 390px; color: #4d5b65; line-height: 1.6; }.promise-metrics { display: flex; gap: 28px; padding-top: 12px; }.promise-metrics div { display: flex; flex-direction: column; gap: 5px; }.promise-metrics strong { font-size: 28px; }.promise-metrics span { color: #55626c; font-size: 11px; text-transform: uppercase; font-weight: 800; }
.closing-cta { padding: 75px 24px; background: #101519; color: #fff; display: flex; flex-direction: column; gap: 20px; align-items: flex-start; font-size: clamp(2.5rem,8vw,5.5rem); font-weight: 800; line-height: .92; letter-spacing: -.065em; }.closing-cta a { display: flex; align-items: center; gap: 12px; color: #3b9ff2; font-size: 15px; letter-spacing: 0; text-decoration: none; }
@media (min-width: 800px) { .hero { padding: 150px max(5vw,48px) 55px; flex-direction: row; align-items: center; }.hero-art { width: 45%; min-height: 490px; }.image-frame { height: 490px; }.services-intro { padding: 140px max(5vw,48px); }.section-heading { flex-direction: row; justify-content: space-between; align-items: flex-end; }.services-rail { flex-direction: row; }.service-card { flex: 1; min-height: 380px; padding: 28px 24px; border-right: 1px solid #bec1bd; border-bottom: 0; }.service-image { height:130px; }.service-card:last-child { border-right: 0; }.promise { flex-direction: row; }.promise-image,.promise-copy { width: 50%; height: auto; }.promise-copy { padding: 80px max(5vw,48px); }.closing-cta { padding: 100px max(5vw,48px); flex-direction: row; align-items: center; justify-content: space-between; }.signal-band { gap: 23px; } }
</style>
