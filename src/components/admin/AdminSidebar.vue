<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import { useAuthStore } from '@/stores/auth'
import { useDialogStore } from '@/stores/dialog'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const auth = useAuthStore()
const dialog = useDialogStore()

const sections = [
  {
    label: 'Operación',
    links: [
      { to: '/admin', name: 'AdminDashboard', label: 'Resumen', hint: 'Actividad y métricas', icon: 'fa-solid fa-chart-line' },
      { to: '/admin/orders', name: 'AdminOrders', label: 'Pedidos', hint: 'Estados y clientes', icon: 'fa-solid fa-receipt' },
      { to: '/admin/catalog', name: 'CatalogAdmin', label: 'Catálogo', hint: 'Productos y categorías', icon: 'fa-solid fa-boxes-stacked' },
    ],
  },
  {
    label: 'Sistema',
    links: [
      { to: '/admin/users', name: 'AdminUsers', label: 'Usuarios', hint: 'Accesos al panel', icon: 'fa-solid fa-users' },
    ],
  },
]

const initials = computed(() =>
  (auth.user?.name ?? 'MP')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase(),
)

const logout = async () => {
  const confirmed = await dialog.confirm({
    title: '¿Cerrar sesión?',
    message: 'Tendrás que volver a ingresar tu correo y contraseña para entrar al panel.',
    confirmLabel: 'Cerrar sesión',
    icon: 'fa-solid fa-arrow-right-from-bracket',
  })
  if (!confirmed) return
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <aside class="sidebar" :class="{ open }" aria-label="Navegación del panel">
    <router-link to="/admin" class="brand" @click="emit('close')">
      <BrandMark tone="light" size="sm" />
      <small>Panel interno</small>
    </router-link>

    <nav class="sections">
      <div v-for="section in sections" :key="section.label" class="section">
        <p class="section-label">{{ section.label }}</p>
        <router-link
          v-for="link in section.links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ active: $route.name === link.name }"
          @click="emit('close')"
        >
          <span class="nav-icon"><i :class="link.icon" aria-hidden="true"></i></span>
          <span class="nav-copy">
            <strong>{{ link.label }}</strong>
            <small>{{ link.hint }}</small>
          </span>
        </router-link>
      </div>
    </nav>

    <router-link to="/" class="site-link" target="_blank">
      <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Ver sitio público
    </router-link>

    <footer class="user">
      <span class="avatar" aria-hidden="true">{{ initials }}</span>
      <span class="user-copy">
        <strong>{{ auth.user?.name ?? 'Equipo Megaprinter' }}</strong>
        <small>{{ auth.user?.email ?? '' }}</small>
      </span>
      <button type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="logout">
        <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
      </button>
    </footer>
  </aside>
</template>

<style scoped lang="scss">
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: $z-drawer;
  display: flex;
  width: min(280px, 86vw);
  flex-direction: column;
  padding: $space-6 $space-4 $space-4;
  border-right: 1px solid $border-on-dark;
  background: $key-900;
  color: $text-on-dark;
  transform: translateX(-100%);
  transition: transform $duration-slow $ease-out;

  &.open {
    transform: none;
  }
}

.brand {
  @include stack(2px);
  padding: 0 $space-3 $space-5;
  border-bottom: 1px solid $border-on-dark;
  @include focus-ring($brand-300);

  small {
    @include eyebrow($brand-300);
    font-size: 0.625rem;
  }
}

.sections {
  @include stack($space-5);
  @include scroll-area;
  flex: 1;
  padding-top: $space-5;
}

.section {
  @include stack(2px);
}

.section-label {
  @include eyebrow($key-300);
  padding: 0 $space-3 $space-2;
  font-size: 0.625rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  color: $text-on-dark-muted;
  transition: background $duration-base $ease-out, color $duration-base $ease-out;
  @include focus-ring($brand-300);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: $text-on-dark;
  }

  &.active {
    background: rgba(0, 163, 224, 0.16);
    color: $text-on-dark;

    .nav-icon {
      background: $cyan;
      color: $key-900;
    }
  }
}

.nav-icon {
  display: flex;
  width: 34px;
  height: 34px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.06);
  color: $brand-300;
  font-size: $text-caption;
  transition: background $duration-base $ease-out, color $duration-base $ease-out;
}

.nav-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong {
    font-size: $text-body-sm;
    font-weight: $weight-semibold;
  }

  small {
    @include truncate;
    color: $key-300;
    font-size: $text-eyebrow;
  }
}

.site-link {
  @include row($space-2);
  margin-bottom: $space-3;
  padding: $space-2 $space-3;
  color: $key-300;
  font-size: $text-caption;
  @include focus-ring($brand-300);

  &:hover {
    color: $brand-300;
  }
}

.user {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  border: 1px solid $border-on-dark;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.04);

  button {
    display: flex;
    width: 34px;
    height: 34px;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    color: $key-300;
    cursor: pointer;
    @include focus-ring($brand-300);

    &:hover {
      background: rgba(217, 43, 58, 0.16);
      color: #ff9aa5;
    }
  }
}

.avatar {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: $cyan;
  color: $key-900;
  font-size: $text-caption;
  font-weight: $weight-black;
}

.user-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;

  strong {
    @include truncate;
    font-size: $text-caption;
  }

  small {
    @include truncate;
    color: $key-300;
    font-size: 0.6875rem;
  }
}

@include from($bp-lg) {
  .sidebar {
    z-index: $z-sticky;
    width: 264px;
    transform: none;
  }
}
</style>
