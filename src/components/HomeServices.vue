<script setup lang="ts">
/**
 * Los servicios no son una secuencia, asi que no llevan numeracion: la
 * etiqueta mono dice de que tipo de trabajo se trata, que es el dato util.
 */
const services = [
  {
    tag: 'Taller',
    name: 'Reparación y mantenimiento',
    text: 'Impresoras, laptops y equipos de oficina. Diagnóstico en banco antes de cualquier cambio de pieza.',
    icon: 'fa-solid fa-screwdriver-wrench',
    link: '/repairs',
    cta: 'Ver servicios',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80',
  },
  {
    tag: 'Venta',
    name: 'Equipos y suministros',
    text: 'Laptops y monitores con Windows y Office originales, elegidos para trabajo real, no para vitrina.',
    icon: 'fa-solid fa-print',
    link: '/products',
    cta: 'Ver catálogo',
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80',
  },
  {
    tag: 'Empresas',
    name: 'Soporte en sitio',
    text: 'Vamos a tu oficina en Guayaquil. Mantenimiento programado para que nada se detenga en horario laboral.',
    icon: 'fa-solid fa-building',
    link: '/repairs',
    cta: 'Solicitar visita',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
]
</script>

<template>
  <section id="servicios" class="services" data-reveal>
    <header class="section-head">
      <div>
        <p class="eyebrow">Qué hacemos</p>
        <h2>Tres formas de<br /><em>volver a producir.</em></h2>
      </div>
      <p class="section-note">
        Taller propio, repuestos y atención local. Sin intermediarios entre tu equipo y quien lo
        repara.
      </p>
    </header>

    <div class="rail">
      <article v-for="service in services" :key="service.tag" class="card">
        <figure class="card-image">
          <img :src="service.image" :alt="service.name" loading="lazy" decoding="async" />
          <figcaption>{{ service.tag }}</figcaption>
        </figure>

        <div class="card-body">
          <i :class="service.icon" aria-hidden="true"></i>
          <h3>{{ service.name }}</h3>
          <p>{{ service.text }}</p>
          <router-link :to="service.link">
            {{ service.cta }} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped lang="scss">
.services {
  @include container;
  @include stack($space-10);
  padding-block: $section-y;
}

.eyebrow {
  @include eyebrow;
}

.section-head {
  @include stack($space-5);

  h2 {
    @include display-heading($text-display);
    max-width: 16ch;
  }
}

.section-note {
  @include body-text($text-body, $text-body-md);
  max-width: 40ch;
}

.rail {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  transition: border-color $duration-base $ease-out, transform $duration-base $ease-out,
    box-shadow $duration-base $ease-out;

  &:hover {
    border-color: $cyan;
    transform: translateY(-3px);
    box-shadow: $shadow-md;
  }
}

.card-image {
  @include duotone;
  position: relative;
  height: 170px;

  figcaption {
    @include mono-data($key-900, $text-eyebrow);
    position: absolute;
    z-index: 1;
    bottom: $space-3;
    left: $space-3;
    padding: 3px $space-2;
    border-radius: $radius-xs;
    background: $cyan;
    text-transform: uppercase;
    letter-spacing: $tracking-eyebrow;
  }
}

.card-body {
  @include stack($space-3);
  flex: 1;
  align-items: flex-start;
  padding: $space-6;

  > i {
    color: $cyan-deep;
    font-size: 1.25rem;
  }

  h3 {
    @include display-heading($text-heading, $width-normal);
  }

  p {
    @include body-text($text-body, $text-body-sm);
    flex: 1;
  }

  a {
    @include row($space-2);
    padding-top: $space-2;
    color: $cyan-dark;
    font-size: $text-body-sm;
    font-weight: $weight-semibold;
    @include focus-ring;

    i {
      transition: transform $duration-base $ease-out;
    }
  }
}

.card:hover .card-body a i {
  transform: translateX(4px);
}

@include from($bp-md) {
  .section-head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-10;
  }

  .rail {
    flex-direction: row;
  }

  .card {
    flex: 1;
  }
}
</style>
