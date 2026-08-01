<template>
  <div class="products-page">
    <Navbar />
    <main>
      <section class="catalog-hero">
        <span class="eyebrow">Megaprinter Ecuador / Catálogo</span>
        <h1>Compra tecnología<br><em>con respaldo real.</em></h1>
        <p>Precios en USD, Windows y Office original en laptops seleccionadas, compra segura y atención directa por WhatsApp.</p>
        <div class="trust-row"><span><i class="fa-solid fa-shield-halved"></i> Compra protegida</span><span><i class="fa-solid fa-store"></i> Atención local</span><span><i class="fa-solid fa-headset"></i> Soporte humano</span></div>
      </section>

      <section class="catalog-controls" aria-label="Filtrar catálogo">
        <label><i class="fa-solid fa-magnifying-glass"></i><input v-model="search" type="search" placeholder="Busca por modelo, marca o procesador"></label>
        <div class="filters"><button v-for="option in filters" :key="option.value" :class="{ active: category === option.value }" @click="category = option.value">{{ option.label }}</button></div>
      </section>

      <section class="catalog-list" aria-live="polite">
        <article v-for="product in filteredProducts" :key="product._id" class="product-card">
          <router-link :to="`/productos/${product.slug || product._id}`" class="image-link"><img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"><i v-else :class="product.category.slug === 'monitores' ? 'fa-solid fa-desktop' : 'fa-solid fa-laptop'"></i><span>{{ product.category.name }}</span></router-link>
          <div class="product-copy"><p class="product-code">Disponible para compra inmediata</p><h2>{{ product.name }}</h2><p class="description">{{ product.description }}</p><ul v-if="product.specifications" class="specs"><li v-for="spec in product.specifications.slice(0, 3)" :key="spec.label"><span>{{ spec.label }}</span><strong>{{ spec.value }}</strong></li></ul><div class="card-footer"><div class="price"><small v-if="product.originalPrice">Antes ${{ product.originalPrice.toFixed(0) }}</small><strong>${{ product.price.toFixed(2) }}</strong></div><div class="actions"><router-link :to="`/productos/${product.slug || product._id}`">Ver detalle</router-link><button @click="buyNow(product)">Comprar <i class="fa-solid fa-arrow-right"></i></button></div></div></div>
        </article>
        <div v-if="!loading && !filteredProducts.length" class="empty"><i class="fa-solid fa-box-open"></i><h2>No encontramos ese equipo</h2><p>Prueba otra búsqueda o escríbenos para ayudarte a elegir.</p><a :href="whatsappUrl" target="_blank" rel="noopener">Consultar por WhatsApp</a></div>
      </section>
    </main>
    <FooterSection /><CheckoutModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const products = ref<CatalogItem[]>([])
const loading = ref(true)
const search = ref('')
const category = ref('all')
const filters = [{ label: 'Todo el catálogo', value: 'all' }, { label: 'Laptops', value: 'laptops' }, { label: 'Monitores', value: 'monitores' }]
const whatsappUrl = 'https://wa.me/593998028318?text=Hola%20Megaprinter%2C%20quiero%20asesor%C3%ADa%20para%20elegir%20un%20equipo.'
const filteredProducts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return products.value.filter(product => (category.value === 'all' || product.category.slug === category.value) && (!query || `${product.name} ${product.description}`.toLocaleLowerCase().includes(query)))
})
const buyNow = (item: CatalogItem) => cartStore.addItem({ id: item._id, name: item.name, price: item.price, image: item.imageUrl })
onMounted(async () => { products.value = await getCatalog('product'); loading.value = false })
</script>

<style scoped lang="scss">
.products-page { min-height:100vh; display:flex; flex-direction:column; background:#f4f7f8; color:#10233a; }.catalog-hero { padding:140px 24px 58px; background:linear-gradient(135deg,#062b4c,#0a5d81); color:#fff; display:flex; flex-direction:column; align-items:flex-start; gap:22px; }.eyebrow,.product-code { color:#82d6ec; font-size:11px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; }.catalog-hero h1 { margin:0; font-size:clamp(3.1rem,10vw,7rem); line-height:.9; letter-spacing:-.07em; }.catalog-hero h1 em { color:#a9e3c7; font-family:Georgia,serif; font-weight:400; }.catalog-hero>p { max-width:540px; margin:0; color:#d4e6ed; font-size:16px; line-height:1.6; }.trust-row { display:flex; flex-wrap:wrap; gap:12px 22px; color:#e4f6f5; font-size:12px; font-weight:700; }.trust-row i { color:#a9e3c7; margin-right:6px; }.catalog-controls { padding:24px; display:flex; flex-direction:column; gap:16px; border-bottom:1px solid #d9e3e7; background:#fff; }.catalog-controls label { display:flex; align-items:center; gap:10px; padding:13px 15px; border:1px solid #c9d7de; border-radius:10px; color:#39718b; }.catalog-controls input { width:100%; border:0; outline:0; color:#10233a; font:inherit; }.filters { display:flex; flex-wrap:wrap; gap:8px; }.filters button { border:1px solid #c9d7de; border-radius:20px; padding:9px 13px; background:#fff; color:#365168; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }.filters button.active { border-color:#0d6682; background:#0d6682; color:#fff; }.catalog-list { max-width:1200px; width:100%; margin:0 auto; padding:32px 24px 76px; display:flex; flex-wrap:wrap; gap:22px; align-items:stretch; }.product-card { flex:1 1 300px; max-width:calc(50% - 11px); overflow:hidden; border:1px solid #d8e3e8; border-radius:14px; background:#fff; box-shadow:0 12px 30px rgba(15,46,66,.07); display:flex; flex-direction:column; }.image-link { position:relative; height:220px; overflow:hidden; background:#e6eff2; display:flex; align-items:center; justify-content:center; }.image-link img { width:100%; height:100%; object-fit:cover; transition:transform .3s ease; }.image-link>i { color:#367b8e; font-size:58px; }.image-link:hover img { transform:scale(1.04); }.image-link span { position:absolute; top:14px; left:14px; padding:6px 9px; border-radius:5px; background:#fff; color:#14546c; font-size:10px; font-weight:800; text-transform:uppercase; }.product-copy { padding:22px; display:flex; flex:1; flex-direction:column; align-items:flex-start; gap:13px; }.product-code { color:#2d8a82; }.product-copy h2 { margin:0; font-size:clamp(1.6rem,3vw,2.3rem); letter-spacing:-.05em; line-height:1; }.description { margin:0; min-height:45px; color:#526775; font-size:13px; line-height:1.55; }.specs { width:100%; margin:0; padding:0; display:flex; flex-direction:column; border-top:1px solid #e4ebee; list-style:none; }.specs li { padding:8px 0; display:flex; justify-content:space-between; gap:10px; border-bottom:1px solid #e4ebee; color:#647784; font-size:11px; }.specs strong { color:#183c50; text-align:right; }.card-footer { width:100%; margin-top:auto; padding-top:8px; display:flex; align-items:flex-end; justify-content:space-between; gap:12px; }.price { display:flex; flex-direction:column; gap:2px; }.price small { color:#768a94; font-size:11px; text-decoration:line-through; }.price strong { color:#083d5b; font-size:25px; letter-spacing:-.05em; }.actions { display:flex; flex-direction:column; align-items:flex-end; gap:7px; }.actions a { color:#1a687d; font-size:11px; font-weight:800; text-decoration:none; }.actions button { border:0; border-radius:7px; padding:11px 13px; background:#d1a83a; color:#172d3e; font:inherit; font-size:12px; font-weight:800; cursor:pointer; }.actions button:hover { background:#ba9128; }.empty { width:100%; padding:75px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; text-align:center; color:#506673; }.empty i { color:#177f84; font-size:34px; }.empty h2,.empty p { margin:0; }.empty a { margin-top:8px; padding:12px 16px; border-radius:7px; background:#0d6682; color:#fff; text-decoration:none; font-size:13px; font-weight:800; }
@media (min-width:800px) { .catalog-hero { padding:160px max(7vw,60px) 78px; }.catalog-controls { padding:20px max(7vw,60px); flex-direction:row; align-items:center; justify-content:space-between; }.catalog-controls label { min-width:380px; }.catalog-list { padding-top:50px; } }
@media (max-width:620px) { .product-card { max-width:none; flex-basis:100%; } }
</style>
