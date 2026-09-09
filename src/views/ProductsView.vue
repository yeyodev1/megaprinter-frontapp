<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import ProductCard from '@/components/ProductCard.vue'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import { useCartStore } from '@/stores/cart'
import { whatsappLink } from '@/config/brand'
import { categoriesFrom, categoryIcon } from '@/config/categories'

const cartStore = useCartStore()
const route = useRoute()

const products = ref<CatalogItem[]>([])
const loading = ref(true)
const search = ref('')
const category = ref('all')

// Los filtros salen de las categorías que realmente tienen productos: antes
// estaban escritos a mano (Laptops y Monitores) y cualquier categoría nueva
// creada desde el panel quedaba invisible en la tienda.
const filters = computed(() => [
  { label: 'Todo el catálogo', value: 'all', icon: 'fa-solid fa-border-all' },
  ...categoriesFrom(products.value).map((item) => ({
    label: item.name,
    value: item.slug,
    icon: categoryIcon(item.slug),
  })),
])

const advisoryLink = whatsappLink('Hola Megaprinter, quiero asesoría para elegir un equipo.')

const matchesSearch = (product: CatalogItem, query: string) => {
  if (!query) return true
  const haystack = [
    product.name,
    product.description,
    product.category.name,
    ...(product.specifications ?? []).map((spec) => `${spec.label} ${spec.value}`),
  ]
    .join(' ')
    .toLocaleLowerCase()
  return query.split(/\s+/).every((term) => haystack.includes(term))
}

const filteredProducts = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return products.value.filter(
    (product) =>
      (category.value === 'all' || product.category.slug === category.value) &&
      matchesSearch(product, query),
  )
})

/**
 * Con un solo tipo de producto una lista plana bastaba; con impresoras,
 * cámaras, laptops y monitores juntos la tienda se agrupa por categoría, cada
 * grupo ordenado por precio para comparar de un vistazo.
 */
const groups = computed(() =>
  categoriesFrom(filteredProducts.value).map((item) => ({
    category: item,
    items: filteredProducts.value
      .filter((product) => product.category.slug === item.slug)
      .sort((a, b) => a.price - b.price),
  })),
)

const buyNow = (item: CatalogItem) =>
  cartStore.addItem({ id: item._id, name: item.name, price: item.price, image: item.imageUrl })

const applyRouteFilters = () => {
  search.value = typeof route.query.q === 'string' ? route.query.q : ''
  category.value = typeof route.query.category === 'string' ? route.query.category : 'all'
}

watch(() => route.query, applyRouteFilters, { immediate: true })

// Si la URL pide una categoría que no existe (o que quedó sin productos) se
// vuelve a "todo" en vez de mostrar una tienda vacía.
watch([products, filters], () => {
  if (!loading.value && !filters.value.some((filter) => filter.value === category.value)) {
    category.value = 'all'
  }
})

onMounted(async () => {
  try {
    products.value = await getCatalog('product')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="products-page">
    <Navbar />

    <main id="contenido">
      <section class="catalog-hero">
        <p class="eyebrow">Megaprinter Ecuador / Catálogo</p>
        <h1>Compra tecnología<br /><em>con respaldo real.</em></h1>
        <p class="lede">
          Precios en USD, Windows y Office original en laptops seleccionadas, compra segura y
          atención directa por WhatsApp.
        </p>
        <ul class="trust-row">
          <li><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Compra protegida</li>
          <li><i class="fa-solid fa-store" aria-hidden="true"></i> Atención local</li>
          <li><i class="fa-solid fa-headset" aria-hidden="true"></i> Soporte humano</li>
        </ul>
      </section>

      <section class="controls" aria-label="Filtrar catálogo">
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <span class="visually-hidden">Buscar en el catálogo</span>
          <input v-model="search" type="search" placeholder="Busca por modelo, marca o característica" />
        </label>
        <div class="filters" role="group" aria-label="Categorías">
          <button
            v-for="option in filters"
            :key="option.value"
            type="button"
            :class="{ active: category === option.value }"
            :aria-pressed="category === option.value"
            @click="category = option.value"
          >
            <i :class="option.icon" aria-hidden="true"></i>{{ option.label }}
          </button>
        </div>
      </section>

      <div class="catalog-list" aria-live="polite">
        <section v-if="loading" class="group" aria-label="Cargando catálogo">
          <div class="group-grid">
            <div v-for="index in 6" :key="`skeleton-${index}`" class="skeleton-card">
              <div class="skeleton media"></div>
              <div class="skeleton-body">
                <div class="skeleton line"></div>
                <div class="skeleton line short"></div>
              </div>
            </div>
          </div>
        </section>

        <template v-else>
          <p v-if="filteredProducts.length" class="result-count">
            {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'equipo' : 'equipos' }}
            <template v-if="search.trim()">para “{{ search.trim() }}”</template>
          </p>

          <section
            v-for="group in groups"
            :key="group.category.slug"
            class="group"
            :aria-labelledby="`group-${group.category.slug}`"
          >
            <header class="group-head">
              <span class="group-icon"><i :class="categoryIcon(group.category.slug)" aria-hidden="true"></i></span>
              <h2 :id="`group-${group.category.slug}`">{{ group.category.name }}</h2>
              <span class="group-count">{{ group.items.length }}</span>
            </header>
            <div class="group-grid">
              <ProductCard
                v-for="product in group.items"
                :key="product._id"
                :product="product"
                @buy="buyNow"
              />
            </div>
          </section>

          <div v-if="!filteredProducts.length" class="empty">
            <i class="fa-solid fa-box-open" aria-hidden="true"></i>
            <h2>No encontramos ese equipo</h2>
            <p>Prueba otra búsqueda o escríbenos para ayudarte a elegir.</p>
            <a :href="advisoryLink" target="_blank" rel="noopener">Consultar por WhatsApp</a>
          </div>
        </template>
      </div>
    </main>

    <FooterSection />
    <CheckoutModal />
  </div>
</template>

<style scoped lang="scss">
.products-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: $surface-page;
  color: $text-strong;
}

.catalog-hero {
  @include stack($space-5);
  align-items: flex-start;
  padding: calc(72px + #{$space-12}) $gutter $space-12;
  background: $key-900;
  color: $text-on-dark;
}

.eyebrow {
  @include eyebrow($brand-300);
}

h1 {
  @include display-heading($text-hero);

  em {
    color: $brand-300;
  }
}

.lede {
  @include body-text($text-on-dark-muted, $text-body-lg);
  max-width: 52ch;
}

.trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3 $space-6;
  color: $text-on-dark;
  font-size: $text-caption;
  font-weight: $weight-semibold;

  i {
    margin-right: $space-2;
    color: $brand-300;
  }
}

.controls {
  @include stack($space-4);
  padding: $space-5 $gutter;
  border-bottom: 1px solid $border-subtle;
  background: $surface-card;
}

.search {
  @include row($space-3);
  padding: $space-3 $space-4;
  border: 1px solid $border-strong;
  border-radius: $radius-sm;
  color: $brand-600;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out;

  &:focus-within {
    border-color: $brand-500;
    box-shadow: 0 0 0 3px rgba(32, 148, 210, 0.16);
  }

  input {
    width: 100%;
    border: 0;
    background: transparent;
    color: $text-strong;
    font: inherit;
    outline: none;

    &::placeholder {
      color: $text-muted;
    }
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include chip;

    &.active {
      border-color: $brand-500;
      background: $brand-500;
      color: $white;
    }
  }
}

.catalog-list {
  @include container;
  @include stack($space-10);
  padding-block: $space-8 $space-20;
}

.result-count {
  @include mono-data($text-muted, $text-caption);
}

.group {
  @include stack($space-5);
}

.group-head {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding-bottom: $space-3;
  border-bottom: 1px solid $border-subtle;

  h2 {
    @include display-heading($text-heading);
  }
}

.group-icon {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-600;
}

.group-count {
  @include badge($brand-700, $brand-100);
}

.group-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: $space-5;
}

.empty {
  @include empty-state;
  width: 100%;

  h2 {
    color: $text-strong;
    font-size: $text-heading;
  }

  a {
    @include button-primary;
    margin-top: $space-2;
  }
}

/* Esqueletos de carga: antes la vista quedaba en blanco hasta que la API
   respondia y parecia que la pagina estaba rota. */
.skeleton-card {
  display: flex;
  flex: 1 1 300px;
  max-width: calc(50% - #{$space-3});
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
}

.skeleton-body {
  @include stack($space-3);
  padding: $space-5;
}

.skeleton {
  border-radius: $radius-sm;
  background: linear-gradient(90deg, $ink-100 25%, $ink-050 37%, $ink-100 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;

  &.media {
    height: 220px;
    border-radius: 0;
  }

  &.line {
    height: 14px;
    width: 100%;
  }

  &.short {
    width: 55%;
  }
}

@keyframes shimmer {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}

@include from($bp-md) {
  .controls {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .search {
    min-width: 380px;
  }
}

@include until($bp-sm) {
  .skeleton-card {
    max-width: none;
    flex-basis: 100%;
  }
}
</style>
