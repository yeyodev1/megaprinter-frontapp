<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BrandMark from '@/components/BrandMark.vue'

const router = useRouter()
const auth = useAuthStore()

const links = [
  { to: '/admin', label: 'Resumen', icon: 'fa-solid fa-chart-line' },
  { to: '/admin/catalog', label: 'Catálogo', icon: 'fa-solid fa-boxes-stacked' },
  { to: '/admin/orders', label: 'Pedidos', icon: 'fa-solid fa-receipt' },
  { to: '/admin/users', label: 'Usuarios', icon: 'fa-solid fa-users' },
]

const logout = () => {
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <nav class="admin-nav" aria-label="Navegación del panel">
    <router-link to="/admin" class="admin-brand">
      <BrandMark tone="light" size="sm" />
      <small>Operaciones</small>
    </router-link>

    <div class="nav-links">
      <router-link v-for="link in links" :key="link.to" :to="link.to">
        <i :class="link.icon" aria-hidden="true"></i>
        <span>{{ link.label }}</span>
      </router-link>
    </div>

    <button class="logout" type="button" @click="logout">
      <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
      <span>Salir</span>
    </button>
  </nav>
</template>

<style scoped lang="scss">
.admin-nav {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding-inline: $space-4;
  background: $ink-800;
  color: $text-on-dark;
}

.admin-brand {
  @include row($space-2);
  @include focus-ring($brand-300);
  flex-wrap: wrap;

  small {
    display: none;
  }
}

.nav-links {
  @include row($space-3);
  overflow-x: auto;
}

.admin-nav a,
.admin-nav button {
  color: $text-on-dark-muted;
  font-size: $text-caption;
  font-weight: $weight-semibold;
  white-space: nowrap;
  cursor: pointer;
  transition: color $duration-base $ease-out, background $duration-base $ease-out;
  @include focus-ring($brand-300);
}

.nav-links a {
  @include row($space-2);

  &:hover {
    color: $text-on-dark;
  }

  &.router-link-exact-active {
    color: $brand-300;
  }
}

.logout {
  @include row($space-2);
  border: 0;
  background: transparent;

  &:hover {
    color: $danger-500;
  }
}

@include from($bp-md) {
  .admin-nav {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: $z-sticky;
    width: 220px;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: $space-8 $space-4 $space-5;
    border-right: 1px solid $border-on-dark;
    background: $ink-900;
  }

  .admin-brand {
    padding: $space-2 $space-2 $space-6;
    border-bottom: 1px solid $border-on-dark;

    small {
      display: block;
      width: 100%;
      color: $brand-300;
      font-size: 0.625rem;
      font-weight: $weight-bold;
      letter-spacing: $tracking-eyebrow;
      text-transform: uppercase;
    }
  }

  .nav-links {
    flex-direction: column;
    align-items: stretch;
    gap: $space-1;
    margin-top: $space-6;
    overflow: visible;

    a {
      padding: $space-3;
      border-radius: $radius-sm;
      font-size: $text-body-sm;

      &.router-link-exact-active {
        background: rgba(32, 148, 210, 0.14);
      }
    }
  }

  .logout {
    margin-top: auto;
    padding: $space-3;
    border-radius: $radius-sm;
    font-size: $text-body-sm;

    &:hover {
      background: rgba(216, 74, 90, 0.12);
    }
  }
}
</style>
