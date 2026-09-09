<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import BrandMark from '@/components/BrandMark.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const menuOpen = ref(false)

watch(() => route.fullPath, () => (menuOpen.value = false))
onMounted(() => auth.loadUser())
</script>

<template>
  <div class="admin-layout">
    <header class="topbar">
      <button
        type="button"
        class="menu-button"
        :aria-expanded="menuOpen"
        aria-label="Abrir menú"
        @click="menuOpen = !menuOpen"
      >
        <i :class="menuOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'" aria-hidden="true"></i>
      </button>
      <BrandMark tone="light" size="sm" />
      <span class="topbar-title">{{ String(route.meta.title ?? 'Panel') }}</span>
    </header>

    <Transition name="scrim">
      <div v-if="menuOpen" class="scrim" @click="menuOpen = false"></div>
    </Transition>

    <AdminSidebar :open="menuOpen" @close="menuOpen = false" />

    <main id="contenido" class="content">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.name" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  min-height: 100vh;
  background: $surface-page;
  color: $text-strong;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: $z-sticky;
  display: flex;
  min-height: 56px;
  align-items: center;
  gap: $space-3;
  padding-inline: $space-3 $space-4;
  background: $key-900;
  color: $text-on-dark;
}

.menu-button {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  color: $text-on-dark;
  cursor: pointer;
  @include focus-ring($brand-300);
}

.topbar-title {
  @include mono-data($key-300, $text-eyebrow);
  margin-left: auto;
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;
}

.scrim {
  position: fixed;
  inset: 0;
  z-index: $z-drawer - 1;
  background: rgba($key-900, 0.55);
}

.scrim-enter-active,
.scrim-leave-active {
  transition: opacity $duration-base $ease-out;
}

.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
}

.content {
  @include container;
  padding-block: $space-8 $space-20;
}

@include from($bp-lg) {
  .topbar,
  .scrim {
    display: none;
  }

  .admin-layout {
    padding-left: 264px;
  }

  .content {
    padding-block: $space-10 $space-24;
  }
}
</style>
