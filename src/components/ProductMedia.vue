<template>
  <div class="product-media" :class="product.category.slug">
    <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name">
    <div v-else class="product-placeholder" aria-hidden="true">
      <i :class="product.category.slug === 'monitores' ? 'fa-solid fa-desktop' : 'fa-solid fa-laptop'"></i>
      <span>{{ brand }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/services/catalog'

const props = defineProps<{ product: CatalogItem }>()
const brand = computed(() => props.product.name.split(' ')[0]?.toUpperCase() || 'MEGAPRINTER')
</script>

<style scoped lang="scss">
.product-media { width:100%; height:100%; overflow:hidden; background:linear-gradient(145deg,#e6eef2,#b9cedb); }.product-media img { width:100%; height:100%; display:block; object-fit:contain; padding:7%; box-sizing:border-box; mix-blend-mode:multiply; }.product-placeholder { width:100%; height:100%; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; background:radial-gradient(circle at 50% 100%,#c2d7e1 0 17%,transparent 17.5%),linear-gradient(145deg,#edf5f8,#b7cad5); color:#193d56; }.product-placeholder:before,.product-placeholder:after { content:''; position:absolute; width:150%; height:1px; background:rgba(38,101,139,.16); transform:rotate(-28deg); }.product-placeholder:after { transform:rotate(28deg); }.product-placeholder i { position:relative; z-index:1; font-size:clamp(3rem,9vw,6rem); filter:drop-shadow(0 13px 9px rgba(26,61,81,.2)); }.product-placeholder span { position:absolute; z-index:1; left:12%; bottom:11%; color:#2a6e99; font-size:clamp(.65rem,1.5vw,.9rem); font-weight:900; letter-spacing:.22em; }.monitores .product-placeholder { background:radial-gradient(circle at 50% 100%,#c6d7e2 0 17%,transparent 17.5%),linear-gradient(145deg,#eff7f5,#b7d2cb); color:#174a47; }.monitores .product-placeholder span { color:#267c76; }
</style>
