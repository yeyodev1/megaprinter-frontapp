<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/services/catalog'
import { categoryIcon } from '@/config/categories'

const props = defineProps<{ product: CatalogItem }>()

const slug = computed(() => props.product.category?.slug ?? 'general')
const icon = computed(() => categoryIcon(slug.value))
const label = computed(() => props.product.name.split(' ')[0]?.toUpperCase() || 'MEGAPRINTER')
</script>

<template>
  <div class="product-media" :class="`kind-${slug}`">
    <img
      v-if="product.imageUrl"
      :src="product.imageUrl"
      :alt="product.name"
      loading="lazy"
      decoding="async"
    />
    <div v-else class="placeholder" aria-hidden="true">
      <i :class="icon"></i>
      <span>{{ label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-media {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(150deg, $ink-050, $brand-100);
}

img {
  width: 100%;
  height: 100%;
  padding: 7%;
  object-fit: contain;
  // Los recortes del proveedor vienen sobre fondo blanco; el multiply los funde
  // con el degradado en vez de dejar un rectangulo recortado.
  mix-blend-mode: multiply;
}

.placeholder {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: radial-gradient(circle at 50% 108%, $brand-200 0 20%, transparent 20.5%),
    linear-gradient(150deg, $ink-050, $brand-100);
  color: $brand-700;

  i {
    position: relative;
    z-index: 1;
    font-size: clamp(2.5rem, 8vw, 5rem);
    opacity: 0.65;
  }

  span {
    position: absolute;
    z-index: 1;
    bottom: 10%;
    left: 10%;
    color: $brand-600;
    font-size: clamp(0.625rem, 1.4vw, 0.8125rem);
    font-weight: $weight-black;
    letter-spacing: 0.22em;
  }
}

.kind-monitores .placeholder {
  background: radial-gradient(circle at 50% 108%, $accent-100 0 20%, transparent 20.5%),
    linear-gradient(150deg, $ink-050, $accent-100);
  color: $accent-600;

  span {
    color: $accent-600;
  }
}
</style>
