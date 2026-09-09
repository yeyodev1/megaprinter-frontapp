<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import ProductMedia from '@/components/ProductMedia.vue'
import { categoriesFrom, categoryIcon } from '@/config/categories'

const router = useRouter()
const query = ref('')
const products = ref<CatalogItem[]>([])
const loading = ref(true)

// Accesos directos a las categorías que tienen productos publicados, en el
// mismo orden que la tienda. Antes solo existían Laptops y Monitores.
const categories = computed(() =>
  categoriesFrom(products.value).map((item) => ({ ...item, icon: categoryIcon(item.slug) })),
)

// Un destacado por categoría (el más económico) para que la portada muestre la
// variedad del catálogo y no tres equipos del mismo tipo.
const featured = computed(() =>
  categories.value
    .map((item) =>
      products.value
        .filter((product) => product.category.slug === item.slug)
        .sort((a, b) => a.price - b.price)[0],
    )
    .filter((product): product is CatalogItem => !!product)
    .slice(0, 4),
)

const searchCatalog = () =>
  router.push({ path: '/products', query: query.value.trim() ? { q: query.value.trim() } : {} })

const openCategory = (category: string) => router.push({ path: '/products', query: { category } })

onMounted(async () => {
  try {
    products.value = await getCatalog('product')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="finder" aria-labelledby="finder-title" data-reveal>
    <div class="finder-inner">
      <header class="finder-head">
        <div>
          <p class="eyebrow">En stock</p>
          <h2 id="finder-title">Equipos listos<br /><em>para trabajar hoy.</em></h2>
        </div>

        <form class="search" @submit.prevent="searchCatalog">
          <label for="home-search" class="visually-hidden">Buscar en el catálogo</label>
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <input
            id="home-search"
            v-model="query"
            type="search"
            placeholder="Marca, modelo o procesador"
            autocomplete="off"
          />
          <button type="submit">
            Buscar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </form>
      </header>

      <div class="quick-links">
        <span class="quick-label">Ir directo a</span>
        <button
          v-for="category in categories"
          :key="category.slug"
          type="button"
          @click="openCategory(category.slug)"
        >
          <i :class="category.icon" aria-hidden="true"></i>{{ category.name }}
        </button>
      </div>

      <div class="results" aria-live="polite">
        <p v-if="loading" class="results-state">Cargando equipos…</p>

        <div v-else class="result-grid">
          <router-link
            v-for="product in featured"
            :key="product._id"
            :to="`/productos/${product.slug || product._id}`"
            class="result-card"
          >
            <div class="result-media"><ProductMedia :product="product" /></div>
            <div class="result-copy">
              <span class="result-cat">{{ product.category.name }}</span>
              <strong>{{ product.name }}</strong>
              <span class="result-price">${{ product.price.toFixed(0) }}</span>
            </div>
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </div>

        <router-link to="/products" class="see-all">
          Ver todo el catálogo <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </router-link>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.finder {
  background: $surface-sunken;
  border-block: 1px solid $border-subtle;
}

.finder-inner {
  @include container;
  @include stack($space-8);
  padding-block: $section-y;
}

.eyebrow {
  @include eyebrow;
}

.finder-head {
  @include stack($space-6);

  h2 {
    @include display-heading($text-display);
    max-width: 14ch;
  }
}

/* --------------------------------------------------------------- Buscador */
.search {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-2 $space-2 $space-4;
  border: 1px solid $key-200;
  border-radius: $radius-sm;
  background: $surface-card;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out;

  &:focus-within {
    border-color: $cyan;
    box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.18);
  }

  > i {
    color: $cyan-deep;
  }

  input {
    min-width: 0;
    flex: 1;
    padding-block: $space-2;
    border: 0;
    background: transparent;
    color: $text-strong;
    font-family: $font-sans;
    font-size: $text-body-md;
    outline: none;

    &::placeholder {
      color: $text-muted;
    }
  }

  button {
    @include button-primary;
    flex: none;
  }
}

/* ------------------------------------------------------------ Accesos */
.quick-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;

  button {
    @include chip;
    background: $surface-card;
  }
}

.quick-label {
  @include mono-data($text-muted, $text-eyebrow);
  margin-right: $space-1;
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;
}

/* ------------------------------------------------------------ Resultados */
.results {
  @include stack($space-4);
}

.results-state {
  @include mono-data($text-muted, $text-caption);
  padding-block: $space-8;
}

.result-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.result-card {
  display: flex;
  flex: 1 1 260px;
  align-items: center;
  gap: $space-4;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  transition: border-color $duration-base $ease-out, transform $duration-base $ease-out;
  @include focus-ring;

  &:hover {
    border-color: $cyan;
    transform: translateY(-2px);

    > i {
      transform: translateX(3px);
      color: $cyan;
    }
  }

  > i {
    flex: none;
    color: $key-300;
    font-size: $text-caption;
    transition: transform $duration-base $ease-out, color $duration-base $ease-out;
  }
}

.result-media {
  width: 72px;
  height: 60px;
  flex: none;
  overflow: hidden;
  border-radius: $radius-xs;
}

.result-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;

  strong {
    @include truncate;
    color: $text-strong;
    font-size: $text-body-sm;
    font-weight: $weight-semibold;
  }
}

.result-cat {
  @include mono-data($cyan-deep, $text-eyebrow);
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;
}

.result-price {
  @include price(1rem, $text-strong);
}

.see-all {
  @include row($space-2);
  align-self: flex-start;
  color: $cyan-dark;
  font-size: $text-body-sm;
  font-weight: $weight-semibold;
  @include focus-ring;

  &:hover i {
    transform: translateX(3px);
  }

  i {
    transition: transform $duration-base $ease-out;
  }
}

@include from($bp-md) {
  .finder-head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-10;
  }

  .search {
    width: min(46%, 460px);
    flex: none;
  }
}
</style>
