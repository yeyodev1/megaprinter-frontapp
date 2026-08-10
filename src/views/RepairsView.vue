<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import { useCartStore } from '@/stores/cart'
import { whatsappLink } from '@/config/brand'

const cartStore = useCartStore()
const services = ref<CatalogItem[]>([])
const loading = ref(true)

const steps = [
  { number: '01', name: 'Diagnóstico' },
  { number: '02', name: 'Aprobación' },
  { number: '03', name: 'Intervención' },
  { number: '04', name: 'Entrega' },
]

const bookingLink = whatsappLink('Hola Megaprinter, necesito agendar un diagnóstico técnico.')

const addToCart = (item: CatalogItem) =>
  cartStore.addItem({ id: item._id, name: item.name, price: item.price, image: item.imageUrl })

onMounted(async () => {
  try {
    services.value = await getCatalog('service')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="repairs-page">
    <Navbar />

    <main id="contenido">
      <section class="hero">
        <div class="hero-image">
          <img
            src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1400&q=80"
            alt="Taller técnico de Megaprinter"
          />
        </div>
        <div class="hero-copy">
          <p class="eyebrow">Laboratorio técnico / Guayaquil</p>
          <h1>Devolvemos<br /><em>ritmo</em> a tu<br />operación.</h1>
          <p class="lede">
            Servicios publicados y administrados directamente por el taller Megaprinter.
          </p>
          <a class="cta" :href="bookingLink" target="_blank" rel="noopener">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Agendar diagnóstico
          </a>
        </div>
      </section>

      <ol class="steps">
        <li v-for="step in steps" :key="step.number">
          <b>{{ step.number }}</b><span>{{ step.name }}</span>
        </li>
      </ol>

      <section class="services">
        <header>
          <p class="eyebrow light">Servicios disponibles</p>
          <h2>Ingresa con un problema.<br />Sal con una respuesta.</h2>
        </header>

        <div class="service-list">
          <p v-if="loading" class="state">Cargando servicios…</p>

          <article v-for="(service, index) in services" :key="service._id" class="service">
            <b class="index">{{ String(index + 1).padStart(2, '0') }}</b>

            <div class="thumb">
              <img v-if="service.imageUrl" :src="service.imageUrl" :alt="service.name" loading="lazy" />
              <i v-else class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>
            </div>

            <div class="service-copy">
              <span>{{ service.category.name }}</span>
              <h3>{{ service.name }}</h3>
              <p>{{ service.description }}</p>
            </div>

            <div class="service-action">
              <strong>Desde ${{ service.price.toFixed(2) }}</strong>
              <button type="button" @click="addToCart(service)">
                Solicitar <i class="fa-solid fa-plus" aria-hidden="true"></i>
              </button>
            </div>
          </article>

          <div v-if="!loading && !services.length" class="state empty">
            <i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>
            <p>Aún no hay servicios publicados en línea.</p>
            <a :href="bookingLink" target="_blank" rel="noopener">Escríbenos por WhatsApp</a>
          </div>
        </div>
      </section>
    </main>

    <FooterSection />
    <CheckoutModal />
  </div>
</template>

<style scoped lang="scss">
.repairs-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: $ink-800;
  color: $text-on-dark;
}

.hero {
  display: flex;
  min-height: 92svh;
  flex-direction: column;
  background: $surface-sunken;
  color: $text-strong;
}

.hero-image {
  height: 42svh;
  overflow: hidden;
  background: $ink-700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.hero-copy {
  @include stack($space-5);
  align-items: flex-start;
  padding: $space-10 $gutter $space-16;
}

.eyebrow {
  @include eyebrow;

  &.light {
    color: $brand-300;
  }
}

h1 {
  @include display-heading($text-hero);
}

.lede {
  @include body-text($text-body, $text-body-lg);
  max-width: 40ch;
}

.cta {
  @include button-primary;
  padding: $space-4 $space-6;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  background: $brand-600;
  color: $white;

  li {
    @include row($space-3);
    flex: 1;
    min-width: 50%;
    padding: $space-4 $space-5;
    border-right: 1px solid rgba(255, 255, 255, 0.22);
    border-bottom: 1px solid rgba(255, 255, 255, 0.22);
  }

  b {
    font-size: 1.1rem;
    font-weight: $weight-black;
  }

  span {
    font-size: $text-eyebrow;
    font-weight: $weight-bold;
    letter-spacing: $tracking-eyebrow;
    text-transform: uppercase;
  }
}

.services {
  @include section;
  @include stack($space-12);

  header {
    @include stack($space-4);
  }

  h2 {
    @include display-heading;

    em {
      color: $brand-300;
    }
  }
}

.service-list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid $border-on-dark;
}

.service {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-4;
  padding-block: $space-5;
  border-bottom: 1px solid $border-on-dark;
}

.index {
  color: $brand-300;
  font-size: $text-eyebrow;
  font-weight: $weight-bold;
}

.thumb {
  display: flex;
  width: 68px;
  height: 68px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $radius-pill;
  background: $surface-dark-raised;
  color: $brand-300;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.service-copy {
  @include stack($space-2);
  min-width: 180px;
  flex: 1;

  > span {
    @include eyebrow($brand-300);
  }

  h3 {
    font-size: $text-heading;
  }

  p {
    @include body-text($text-on-dark-muted, $text-body-sm);
  }
}

.service-action {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;

  strong {
    font-size: $text-body-sm;
  }

  button {
    @include button-on-dark;
  }
}

.state {
  padding-block: $space-10;
  color: $text-on-dark-muted;

  &.empty {
    @include empty-state;
    color: $text-on-dark-muted;

    i {
      color: $brand-300;
    }

    a {
      @include button-primary;
      margin-top: $space-2;
    }
  }
}

@include from($bp-md) {
  .hero {
    min-height: 680px;
    flex-direction: row-reverse;
  }

  .hero-image,
  .hero-copy {
    width: 50%;
    height: auto;
  }

  .hero-copy {
    justify-content: center;
    padding: $space-24 $gutter;
  }

  .steps {
    flex-wrap: nowrap;
    padding-inline: $gutter;

    li {
      min-width: 0;
      border-bottom: 0;

      &:last-child {
        border-right: 0;
      }
    }
  }

  .service {
    flex-wrap: nowrap;
    gap: $space-8;
  }

  .thumb {
    width: 110px;
    height: 110px;
    border-radius: $radius-md;
  }

  .service-action {
    width: 150px;
    flex-direction: column;
    align-items: flex-end;
    gap: $space-3;
  }
}
</style>
