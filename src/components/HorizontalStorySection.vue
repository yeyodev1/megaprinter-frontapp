<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const section = ref<HTMLElement>()
const track = ref<HTMLElement>()
const progress = ref<HTMLElement>()
let context: gsap.Context | undefined

const steps = [
  {
    title: 'Cuéntanos qué ocurre',
    text: 'Recibimos tu consulta y entendemos el impacto real en tu jornada.',
    icon: 'fa-solid fa-message',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Diagnosticamos sin adivinar',
    text: 'Revisamos el equipo y aislamos la causa antes de proponer una solución.',
    icon: 'fa-solid fa-magnifying-glass-chart',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Te damos una respuesta clara',
    text: 'Conoces el trabajo, el presupuesto y los siguientes pasos antes de avanzar.',
    icon: 'fa-solid fa-file-circle-check',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: 'Volvemos a poner todo en marcha',
    text: 'Probamos, calibramos y te entregamos un equipo listo para producir.',
    icon: 'fa-solid fa-bolt',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80',
  },
]

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  await nextTick()

  const sectionEl = section.value
  const trackEl = track.value
  const progressEl = progress.value
  if (!sectionEl || !trackEl || !progressEl) return

  context = gsap.context(() => {
    const media = gsap.matchMedia()
    const buildSequence = (durationMultiplier: number) => {
      const distance = () => Math.max(0, trackEl.scrollWidth - sectionEl.clientWidth)
      const tween = gsap.to(trackEl, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionEl,
          start: 'top top',
          end: () => `+=${distance() * durationMultiplier}`,
          pin: true,
          scrub: 1.25,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            gsap.set(progressEl, { scaleX: self.progress, transformOrigin: 'left center' }),
        },
      })
      return () => tween.scrollTrigger?.kill()
    }
    media.add('(max-width: 799px)', () => buildSequence(1.8))
    media.add('(min-width: 800px)', () => buildSequence(1.45))
  }, sectionEl)
})

onBeforeUnmount(() => context?.revert())
</script>

<template>
  <section ref="section" class="story" aria-labelledby="story-title">
    <header class="story-header">
      <div>
        <p class="eyebrow">Cuatro pasos · en orden</p>
        <h2 id="story-title">Del problema a<br /><em>volver a operar.</em></h2>
      </div>
      <p class="lede">
        Desliza para ver el recorrido completo de un equipo dentro del taller.
      </p>
    </header>

    <div class="story-viewport">
      <div ref="track" class="story-track">
        <article v-for="(step, index) in steps" :key="step.title" class="story-card">
          <figure class="story-image">
            <img :src="step.image" :alt="step.title" loading="lazy" decoding="async" />
          </figure>
          <div class="story-content">
            <!-- La numeracion aqui si informa: es una secuencia real y el orden
                 es el dato que el cliente necesita. -->
            <span class="step-index">Paso {{ index + 1 }} de {{ steps.length }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
            <i :class="step.icon" aria-hidden="true"></i>
          </div>
        </article>

        <div class="story-end">
          <span>Megaprinter</span>
          <strong>Tu operación<br />continúa.</strong>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </div>
      </div>
    </div>

    <div class="story-progress">
      <div class="progress-track"><span ref="progress"></span></div>
      <small>Desplázate</small>
    </div>
  </section>
</template>

<style scoped lang="scss">
.story {
  @include halftone(0.04);
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  gap: $space-8;
  overflow: hidden;
  padding: $section-y $gutter $space-8;
  background: $key-800;
  color: $text-on-dark;
}

.story-header {
  @include stack($space-5);

  > div {
    @include stack($space-4);
  }
}

.eyebrow,
.step-index,
.story-end > span {
  @include eyebrow($brand-300);
}

h2 {
  @include display-heading(clamp(2.5rem, 7vw, 5rem));
  max-width: 15ch;

  em {
    color: $brand-300;
  }
}

.lede {
  @include body-text($text-on-dark-muted, $text-body-sm);
  max-width: 36ch;
}

.story-viewport {
  width: calc(100% + #{$gutter});
  // `$gutter` es un clamp(), y Sass no puede negar una calculacion con `-$x`.
  margin-right: calc(-1 * #{$gutter});
  overflow: hidden;
  padding: 0 $gutter $space-3 0;
  touch-action: pan-y;
}

.story-track {
  display: flex;
  width: max-content;
  align-items: stretch;
  gap: $space-4;
  padding-right: $gutter;
}

.story-card {
  display: flex;
  width: 78vw;
  max-width: 340px;
  min-height: 440px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-on-dark;
  border-radius: $radius-md;
  background: $surface-dark-raised;
}

.story-image {
  @include duotone;
  height: 220px;
}

.story-content {
  @include stack($space-3);
  flex: 1;
  align-items: flex-start;
  padding: $space-6;

  h3 {
    font-size: $text-heading;
    line-height: $leading-tight;
  }

  p {
    @include body-text($text-on-dark-muted, $text-body-sm);
  }

  i {
    margin-top: auto;
    color: $brand-400;
    font-size: 1.25rem;
  }
}

.story-end {
  display: flex;
  width: calc(100vw - #{$gutter} * 2);
  min-height: 440px;
  flex-direction: column;
  justify-content: space-between;
  padding: $space-8;
  border-radius: $radius-md;
  background: $cyan;
  color: $key-900;

  > span {
    color: rgba(12, 12, 14, 0.65);
  }

  strong {
    @include display-heading(clamp(1.75rem, 7vw, 2.75rem));
    max-width: 12ch;
  }

  i {
    align-self: flex-end;
    font-size: 1.75rem;
  }
}

.story-progress {
  @include row($space-3);
  margin-top: auto;
  color: $text-on-dark-muted;
  font-size: $text-eyebrow;
  font-weight: $weight-bold;
  letter-spacing: $tracking-eyebrow;
  text-transform: uppercase;
}

// La barra de avance estaba en `position: absolute` sin ancestro posicionado,
// asi que se anclaba a la pagina y quedaba flotando fuera de la seccion.
.progress-track {
  position: relative;
  width: 96px;
  height: 2px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.18);

  span {
    position: absolute;
    inset: 0;
    background: $brand-400;
    transform: scaleX(0);
    transform-origin: left center;
  }
}

@include from($bp-md) {
  .story {
    padding: $space-20 $gutter $space-10;
  }

  .story-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .story-viewport {
    width: auto;
    margin: 0;
    overflow: visible;
    padding: 0;
  }

  .story-track {
    gap: $space-6;
    padding-right: 0;
  }

  .story-card {
    width: min(36vw, 460px);
    max-width: none;
    min-height: 520px;
  }

  .story-image {
    height: 280px;
  }

  .story-end {
    width: min(27vw, 360px);
    min-height: 520px;
  }
}
</style>
