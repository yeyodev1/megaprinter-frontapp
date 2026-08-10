<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
</script>

<template>
  <div class="not-found-page">
    <Navbar />

    <main id="contenido" class="not-found">
      <p class="signal">Error / 404</p>

      <div class="content">
        <p class="eyebrow">Megaprinter / Guayaquil</p>
        <h1>Esta página<br />no imprime.</h1>
        <p class="lede">
          La dirección que buscas no existe o fue movida. Vuelve al inicio o revisa el catálogo.
        </p>
        <div class="actions">
          <router-link to="/" class="primary">
            Volver al inicio <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
          <router-link to="/products" class="ghost">Ver catálogo</router-link>
        </div>
      </div>

      <div class="orbital" aria-hidden="true"><span>404</span></div>
    </main>

    <FooterSection />
  </div>
</template>

<style scoped lang="scss">
.not-found-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.not-found {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: calc(72px + #{$space-8}) $gutter $space-12;
  background: $ink-900;
  color: $text-on-dark;
}

.signal,
.eyebrow {
  @include eyebrow($brand-300);
}

.content {
  @include stack($space-5);
  position: relative;
  z-index: 1;
  max-width: 680px;
  align-items: flex-start;
  margin-block: auto;
}

h1 {
  @include display-heading($text-hero);
}

.lede {
  @include body-text($text-on-dark-muted, $text-body-lg);
  max-width: 40ch;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.primary {
  @include button-primary;
  padding: $space-4 $space-6;
}

.ghost {
  @include button-on-dark;
  padding: $space-4 $space-6;
}

.orbital {
  position: absolute;
  right: -110px;
  bottom: -90px;
  display: flex;
  width: 340px;
  height: 340px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(32, 148, 210, 0.4);
  border-radius: $radius-pill;
  transform: rotate(-16deg);

  &::before,
  &::after {
    content: '';
    position: absolute;
    border: 1px solid rgba(32, 148, 210, 0.2);
    border-radius: $radius-pill;
  }

  &::before {
    width: 260px;
    height: 260px;
  }

  &::after {
    width: 440px;
    height: 440px;
  }

  span {
    color: rgba(32, 148, 210, 0.5);
    font-size: 6rem;
    font-weight: $weight-black;
    letter-spacing: $tracking-display;
  }
}

@include from($bp-md) {
  .orbital {
    right: 8vw;
    bottom: -140px;
    width: 500px;
    height: 500px;

    &::before {
      width: 380px;
      height: 380px;
    }

    span {
      font-size: 9rem;
    }
  }
}
</style>
