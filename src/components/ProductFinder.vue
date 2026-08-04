<template>
  <section class="finder" aria-labelledby="finder-title">
    <div class="finder-copy">
      <span>01 / Encuentra tu equipo</span>
      <h2 id="finder-title">Tecnología que<br><em>sí encaja contigo.</em></h2>
      <p>Busca por marca, modelo o procesador. Te llevamos directo a las opciones disponibles.</p>
    </div>

    <div class="finder-panel">
      <form class="search-form" @submit.prevent="searchCatalog">
        <label for="home-search">¿Qué estás buscando?</label>
        <div class="search-field">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input id="home-search" v-model="query" type="search" placeholder="Ej. laptop Lenovo, monitor 24, Core i5" autocomplete="off">
          <button type="submit">Buscar <i class="fa-solid fa-arrow-right"></i></button>
        </div>
      </form>
      <div class="quick-links" aria-label="Categorías destacadas">
        <button v-for="category in categories" :key="category.slug" type="button" @click="openCategory(category.slug)">
          <i :class="category.icon" aria-hidden="true"></i>{{ category.name }}
        </button>
      </div>
      <div class="finder-results" aria-live="polite">
        <p class="results-label">Explora primero</p>
        <div class="result-list">
          <router-link v-for="product in featuredProducts" :key="product._id" :to="`/productos/${product.slug || product._id}`" class="result-card">
            <ProductMedia :product="product" />
            <span><small>{{ product.category.name }}</small><strong>{{ product.name }}</strong><b>${{ product.price.toFixed(0) }}</b></span>
            <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import ProductMedia from '@/components/ProductMedia.vue'

const router = useRouter()
const query = ref('')
const products = ref<CatalogItem[]>([])
const categories = [
  { name: 'Laptops', slug: 'laptops', icon: 'fa-solid fa-laptop' },
  { name: 'Monitores', slug: 'monitores', icon: 'fa-solid fa-desktop' },
]
const featuredProducts = computed(() => products.value.slice(0, 3))

const searchCatalog = () => router.push({ path: '/products', query: query.value.trim() ? { q: query.value.trim() } : {} })
const openCategory = (category: string) => router.push({ path: '/products', query: { category } })

onMounted(async () => { products.value = await getCatalog('product') })
</script>

<style scoped lang="scss">
.finder { padding:80px 24px; background:#d9e4eb; display:flex; flex-direction:column; gap:34px; color:#101519; }.finder-copy { display:flex; flex-direction:column; align-items:flex-start; gap:18px; }.finder-copy>span,.results-label { color:#397cad; font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; }.finder h2 { margin:0; font-size:clamp(2.8rem,8vw,5.7rem); letter-spacing:-.075em; line-height:.88; }.finder h2 em { color:#247dcc; font-family:Georgia,serif; font-weight:400; }.finder-copy p { max-width:390px; margin:0; color:#4d5b65; line-height:1.6; }.finder-panel { display:flex; flex-direction:column; gap:20px; }.search-form { display:flex; flex-direction:column; gap:9px; }.search-form label { font-size:12px; font-weight:800; }.search-field { padding:7px 7px 7px 17px; display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #b4c7d3; box-shadow:0 14px 35px rgba(23,53,74,.1); }.search-field>i { color:#277ec7; }.search-field input { min-width:0; flex:1; padding:11px 0; border:0; outline:0; color:#101519; font:inherit; }.search-field input::placeholder { color:#7b8991; }.search-field button { flex:none; display:flex; align-items:center; gap:9px; padding:13px 16px; border:0; background:#237dca; color:#fff; font:inherit; font-size:12px; font-weight:900; cursor:pointer; }.quick-links { display:flex; flex-wrap:wrap; gap:9px; }.quick-links button { display:flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid #a9c0ce; background:transparent; color:#234a66; font:inherit; font-size:12px; font-weight:800; cursor:pointer; transition:background .2s ease,color .2s ease; }.quick-links button:hover { background:#237dca; color:#fff; }.finder-results { padding-top:6px; }.results-label { margin:0 0 10px; }.result-list { display:flex; flex-direction:column; border-top:1px solid #b3c4cf; }.result-card { padding:11px 0; display:flex; align-items:center; gap:12px; border-bottom:1px solid #b3c4cf; color:inherit; text-decoration:none; }.result-card :deep(.product-media) { width:64px; height:54px; flex:none; }.result-card span { min-width:0; flex:1; display:flex; flex-direction:column; gap:2px; }.result-card small { color:#397cad; font-size:10px; font-weight:800; text-transform:uppercase; }.result-card strong { overflow:hidden; color:#1c2a34; font-size:13px; text-overflow:ellipsis; white-space:nowrap; }.result-card b { color:#236d9f; font-size:12px; }.result-card>i { color:#397cad; font-size:12px; }.result-card:hover strong { color:#237dca; } @media (min-width:800px) { .finder { padding:110px max(5vw,48px); flex-direction:row; justify-content:space-between; gap:70px; }.finder-copy,.finder-panel { width:calc(50% - 35px); }.finder-panel { max-width:650px; }.search-field button { padding:15px 23px; } }
</style>
