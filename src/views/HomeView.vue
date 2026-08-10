<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import ProductFinder from '@/components/ProductFinder.vue'
import HorizontalStorySection from '@/components/HorizontalStorySection.vue'
import HomeHero from '@/components/HomeHero.vue'
import HomeServices from '@/components/HomeServices.vue'
import { useReveal } from '@/composables/useReveal'
import { whatsappLink } from '@/config/brand'

useReveal()

const marquee = ['Impresoras', 'Laptops', 'Monitores', 'Repuestos', 'Soporte corporativo']

const bookingLink = whatsappLink('Hola Megaprinter, mi equipo está detenido y necesito ayuda.')
</script>

<template>
  <div class="home">
    <Navbar />

    <main id="contenido">
      <HomeHero />

      <div class="band" data-reveal>
        <ul class="band-list">
          <li v-for="item in marquee" :key="item">{{ item }}</li>
        </ul>
      </div>

      <ProductFinder />
      <HorizontalStorySection />
      <HomeServices />

      <section class="promise" data-reveal>
        <div class="promise-copy">
          <p class="eyebrow">Cómo trabajamos</p>
          <h2>No adivinamos.<br /><em>Diagnosticamos.</em></h2>
          <p class="lede">
            Abrimos el equipo, aislamos la causa y te enviamos el presupuesto. Si no lo apruebas,
            no hay cargo por la revisión.
          </p>

          <ul class="promise-points">
            <li>
              <span class="reg" aria-hidden="true"></span>
              <span><strong>Diagnóstico primero.</strong> Nada se cambia sin confirmar qué falla.</span>
            </li>
            <li>
              <span class="reg" aria-hidden="true"></span>
              <span><strong>Precio cerrado.</strong> Lo que aprobaste es lo que pagas.</span>
            </li>
            <li>
              <span class="reg" aria-hidden="true"></span>
              <span><strong>Prueba de salida.</strong> El equipo se entrega funcionando y calibrado.</span>
            </li>
          </ul>
        </div>

        <figure class="promise-image">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"
            alt="Banco de trabajo del taller Megaprinter"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </section>

      <section class="closing" data-reveal>
        <div class="calibration-strip" aria-hidden="true"></div>
        <div class="closing-inner">
          <h2>¿Tu equipo está detenido?</h2>
          <p>Escríbenos y lo revisamos hoy mismo.</p>
          <div class="closing-actions">
            <router-link to="/repairs" class="cta-primary">
              Agendar diagnóstico <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </router-link>
            <a :href="bookingLink" target="_blank" rel="noopener" class="cta-ghost">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp directo
            </a>
          </div>
        </div>
      </section>
    </main>

    <FooterSection />
    <CheckoutModal />
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: $surface-page;
  color: $text-strong;
}

main {
  overflow: hidden;
}

/* ------------------------------------------------------------------- Banda */
.band {
  padding: $space-3 $gutter;
  border-block: 1px solid $key-700;
  background: $key-800;
}

.band-list {
  @include container;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: $space-3 $space-6;
  padding-inline: 0;

  li {
    @include mono-data($key-200, $text-eyebrow);
    display: flex;
    align-items: center;
    gap: $space-6;
    text-transform: uppercase;
    letter-spacing: $tracking-eyebrow;

    &::after {
      content: '';
      width: 4px;
      height: 4px;
      border-radius: $radius-pill;
      background: $cyan;
    }

    &:last-child::after {
      display: none;
    }
  }
}

/* ----------------------------------------------------------------- Promesa */
.promise {
  @include container;
  display: flex;
  flex-direction: column;
  gap: $space-8;
  padding-block: $section-y;
}

.eyebrow {
  @include eyebrow;
}

.promise-copy {
  @include stack($space-5);
  align-items: flex-start;
  flex: 1;

  h2 {
    @include display-heading($text-display);
  }
}

.lede {
  @include body-text($text-body, $text-body-lg);
  max-width: 44ch;
}

.promise-points {
  @include stack($space-3);
  width: 100%;
  padding-top: $space-4;
  border-top: 1px solid $border-subtle;

  li {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    @include body-text($text-body, $text-body-sm);
  }

  strong {
    color: $text-strong;
    font-weight: $weight-semibold;
  }
}

.reg {
  @include registration-mark(14px, $magenta);
  flex: none;
  margin-top: 5px;
}

.promise-image {
  @include duotone;
  height: 300px;
  flex: 1;
  border-radius: $radius-md;
}

/* ------------------------------------------------------------------ Cierre */
.closing {
  background: $key-900;
  color: $text-on-dark;
}

.closing-inner {
  @include container;
  @include stack($space-5);
  align-items: flex-start;
  padding-block: $space-16;

  h2 {
    @include display-heading($text-title);
    color: $text-on-dark;
    max-width: 18ch;
  }

  p {
    @include body-text($text-on-dark-muted, $text-body-lg);
  }
}

.closing-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.cta-primary {
  @include button-primary;
  padding: $space-4 $space-6;
}

.cta-ghost {
  @include button-on-dark;
  padding: $space-4 $space-6;
}

@include from($bp-md) {
  .promise {
    flex-direction: row;
    align-items: center;
    gap: $space-16;
  }

  .promise-image {
    height: 420px;
    max-width: 46%;
  }

  .closing-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    h2 {
      flex: 1;
    }

    p {
      display: none;
    }
  }
}
</style>
