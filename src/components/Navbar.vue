<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useScrollLock } from '@/composables/useScrollLock'
import BrandMark from '@/components/BrandMark.vue'

const cartStore = useCartStore()
const route = useRoute()
const menuOpen = ref(false)

const links = [
  { to: '/products', label: 'Productos' },
  { to: '/repairs', label: 'Taller técnico' },
  { to: '/#contacto', label: 'Contacto' },
]

const closeMenu = () => {
  menuOpen.value = false
}

useScrollLock(menuOpen)

// El menu movil quedaba abierto al navegar y tapaba la pagina de destino.
watch(() => route.fullPath, closeMenu)

// Escape cierra el panel: sin esto la unica salida era el boton de cerrar.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeMenu()
}
</script>

<template>
  <header class="nav-shell" @keydown="onKeydown">
    <nav class="nav-bar" aria-label="Navegación principal">
      <router-link to="/" class="brand" aria-label="Inicio de Megaprinter" @click="closeMenu">
        <BrandMark tone="light" size="md" />
      </router-link>

      <div class="desktop-links">
        <router-link v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</router-link>
      </div>

      <div class="nav-actions">
        <button
          class="cart"
          type="button"
          :aria-label="`Abrir carrito, ${cartStore.totalItems} artículos`"
          @click="cartStore.setCheckoutOpen(true)"
        >
          <i class="fa-solid fa-bag-shopping" aria-hidden="true"></i>
          <span v-if="cartStore.totalItems">{{ cartStore.totalItems }}</span>
        </button>

        <button
          class="menu-toggle"
          type="button"
          aria-controls="mobile-menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <i :class="menuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars-staggered'" aria-hidden="true"></i>
          <small>{{ menuOpen ? 'Cerrar' : 'Menú' }}</small>
        </button>
      </div>
    </nav>

    <transition name="menu-reveal">
      <div v-if="menuOpen" id="mobile-menu" class="menu-panel">
        <p class="menu-index">Megaprinter / Navegación</p>
        <div class="menu-links">
          <router-link to="/" @click="closeMenu"><b>01</b> Inicio <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></router-link>
          <router-link to="/products" @click="closeMenu"><b>02</b> Productos <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></router-link>
          <router-link to="/repairs" @click="closeMenu"><b>03</b> Taller <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></router-link>
          <router-link to="/#contacto" @click="closeMenu"><b>04</b> Contacto <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></router-link>
        </div>
        <div class="menu-footer">
          <span>Guayaquil, Ecuador</span>
          <a href="https://wa.me/593998028318" target="_blank" rel="noopener">+593 99 802 8318</a>
        </div>
      </div>
    </transition>
  </header>
</template>

<style scoped lang="scss">
.nav-shell {
  position: fixed;
  inset: 0 0 auto;
  z-index: $z-nav;
  pointer-events: none;
  color: $text-on-dark;
}

.nav-bar {
  display: flex;
  height: 72px;
  align-items: center;
  justify-content: space-between;
  padding-inline: $gutter;
  border-bottom: 1px solid $border-on-dark;
  background: rgba($ink-900, 0.82);
  backdrop-filter: blur(18px);
  pointer-events: auto;
}

.brand {
  @include focus-ring($brand-300);
}

.desktop-links {
  display: none;
}

.nav-actions {
  @include row($space-2);
}

.cart,
.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-on-dark;
  background: rgba(255, 255, 255, 0.05);
  color: $text-on-dark;
  cursor: pointer;
  transition: background $duration-base $ease-out, border-color $duration-base $ease-out;
  @include focus-ring($brand-300);

  &:hover {
    border-color: $border-on-dark-strong;
    background: rgba(255, 255, 255, 0.11);
  }
}

.cart {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: $radius-pill;

  span {
    position: absolute;
    top: -5px;
    right: -5px;
    display: flex;
    min-width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    padding-inline: 4px;
    border-radius: $radius-pill;
    background: $brand-500;
    color: $white;
    font-size: 0.625rem;
    font-weight: $weight-black;
  }
}

.menu-toggle {
  gap: $space-2;
  min-width: 72px;
  height: 40px;
  border-radius: $radius-pill;
  font-size: $text-body-sm;

  small {
    font-size: $text-eyebrow;
    font-weight: $weight-bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
}

.menu-panel {
  position: fixed;
  inset: 72px 0 0;
  display: flex;
  flex-direction: column;
  padding: $space-8 $gutter $space-10;
  background: $ink-900;
  pointer-events: auto;
}

.menu-index {
  @include eyebrow($brand-300);
}

.menu-links {
  display: flex;
  flex-direction: column;
  margin-block: auto;

  a {
    display: flex;
    align-items: center;
    gap: $space-4;
    padding-block: $space-4;
    border-bottom: 1px solid $border-on-dark;
    color: $text-on-dark;
    font-size: clamp(1.75rem, 8vw, 3rem);
    font-weight: $weight-black;
    letter-spacing: $tracking-display;
    transition: color $duration-base $ease-out, padding-left $duration-base $ease-out;

    &:hover {
      padding-left: $space-2;
      color: $brand-300;
    }
  }

  b {
    color: $brand-400;
    font-size: $text-eyebrow;
    letter-spacing: 0;
  }

  i {
    margin-left: auto;
    color: $brand-400;
    font-size: 0.875rem;
  }
}

.menu-footer {
  display: flex;
  justify-content: space-between;
  gap: $space-4;
  color: $text-on-dark-muted;
  font-size: $text-caption;

  a {
    color: $text-on-dark;
    font-weight: $weight-bold;
  }
}

.menu-reveal-enter-active,
.menu-reveal-leave-active {
  transition: opacity $duration-base $ease-out, transform $duration-base $ease-out;
}

.menu-reveal-enter-from,
.menu-reveal-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@include from($bp-md) {
  .nav-bar {
    height: 80px;
  }

  .desktop-links {
    display: flex;
    align-items: center;
    gap: $space-8;
    margin-left: auto;
    margin-right: $space-8;

    a {
      color: $text-on-dark-muted;
      font-size: $text-caption;
      font-weight: $weight-semibold;
      transition: color $duration-base $ease-out;
      @include focus-ring($brand-300);

      &:hover,
      &.router-link-active {
        color: $text-on-dark;
      }
    }
  }

  .menu-toggle,
  .menu-panel {
    display: none;
  }
}
</style>
