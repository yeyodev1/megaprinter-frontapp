<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import FooterSection from '@/components/FooterSection.vue'
import CheckoutModal from '@/components/CheckoutModal.vue'
import ProductMedia from '@/components/ProductMedia.vue'
import { getCatalog, type CatalogItem } from '@/services/catalog'
import { useCartStore } from '@/stores/cart'
import { whatsappLink } from '@/config/brand'

const route = useRoute()
const cartStore = useCartStore()

const products = ref<CatalogItem[]>([])
const loading = ref(true)

const product = computed(() =>
  products.value.find((item) => (item.slug || item._id) === route.params.slug),
)

const consultLink = computed(() =>
  whatsappLink(
    `Hola Megaprinter, deseo información para comprar: ${product.value?.name ?? ''}. Precio publicado: $${
      product.value?.price.toFixed(2) ?? ''
    }.`,
  ),
)

const buyNow = () => {
  if (!product.value) return
  cartStore.addItem({
    id: product.value._id,
    name: product.value.name,
    price: product.value.price,
    image: product.value.imageUrl,
  })
}

onMounted(async () => {
  try {
    products.value = await getCatalog('product')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="product-page">
    <Navbar />

    <main v-if="loading" id="contenido" class="state-panel">
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
      <p>Cargando producto…</p>
    </main>

    <main v-else-if="product" id="contenido" class="product-layout">
      <router-link to="/products" class="back">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al catálogo
      </router-link>

      <section class="product-main">
        <div class="visual">
          <ProductMedia :product="product" />
          <span class="tag">{{ product.category.name }}</span>
        </div>

        <div class="summary">
          <p class="eyebrow">Equipo disponible para compra</p>
          <h1>{{ product.name }}</h1>
          <p class="description">{{ product.description }}</p>

          <div class="pricing">
            <small v-if="product.originalPrice">Precio anterior: ${{ product.originalPrice.toFixed(2) }}</small>
            <strong>${{ product.price.toFixed(2) }}</strong>
            <span>Precio final en USD</span>
          </div>

          <div class="purchase-actions">
            <button type="button" @click="buyNow">
              Comprar ahora <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
            <a :href="consultLink" target="_blank" rel="noopener">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Consultar por WhatsApp
            </a>
          </div>

          <p class="assurance">
            <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
            Compra con atención local de Megaprinter. Te acompañamos antes y después de tu compra.
          </p>
        </div>
      </section>

      <section v-if="product.specifications?.length" class="details">
        <div>
          <p class="eyebrow">Especificaciones</p>
          <h2>Todo lo que necesitas saber.</h2>
        </div>
        <dl>
          <div v-for="spec in product.specifications" :key="spec.label">
            <dt>{{ spec.label }}</dt>
            <dd>{{ spec.value }}</dd>
          </div>
        </dl>
      </section>
    </main>

    <main v-else id="contenido" class="state-panel">
      <i class="fa-solid fa-box-open" aria-hidden="true"></i>
      <h1>Producto no encontrado</h1>
      <p>El equipo que buscas ya no está publicado o cambió de dirección.</p>
      <router-link to="/products">Ir al catálogo</router-link>
    </main>

    <FooterSection />
    <CheckoutModal />
  </div>
</template>

<style scoped lang="scss">
.product-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: $surface-page;
  color: $text-strong;
}

.product-layout {
  @include container;
  padding-block: calc(72px + #{$space-8}) $space-20;
}

.back {
  @include row($space-2);
  margin-bottom: $space-6;
  color: $brand-600;
  font-size: $text-body-sm;
  font-weight: $weight-bold;
  @include focus-ring;

  &:hover {
    color: $brand-700;
  }
}

.product-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-md;
}

.visual {
  position: relative;
  min-height: 320px;

  .tag {
    @include badge($brand-700, rgba(255, 255, 255, 0.92));
    position: absolute;
    top: $space-4;
    left: $space-4;
    box-shadow: $shadow-xs;
  }
}

.summary {
  @include stack($space-5);
  align-items: flex-start;
  padding: $space-8 $space-6;
}

.eyebrow {
  @include eyebrow;
}

h1 {
  @include display-heading($text-display);
}

.description {
  @include body-text($text-body, $text-body-lg);
  max-width: 55ch;
}

.pricing {
  @include stack(2px);

  small {
    @include mono-data($text-muted, $text-body-sm);
    text-decoration: line-through;
  }

  strong {
    @include price(2.5rem);
  }

  span {
    @include mono-data($text-muted, $text-eyebrow);
    text-transform: uppercase;
    letter-spacing: $tracking-eyebrow;
  }
}

.purchase-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  button {
    @include button-primary;
    min-height: 48px;
    padding-inline: $space-5;
  }

  a {
    @include button-whatsapp;
    min-height: 48px;
    padding-inline: $space-5;
  }
}

.assurance {
  @include body-text($text-body, $text-caption);
  padding-top: $space-4;
  border-top: 1px solid $border-subtle;

  i {
    margin-right: $space-2;
    color: $accent-600;
  }
}

.details {
  @include stack($space-6);
  margin-top: $space-8;
  padding: $space-8 $space-6;
  border-radius: $radius-lg;
  background: $surface-sunken;

  h2 {
    max-width: 14ch;
    margin-top: $space-2;
    @include display-heading($text-title);
  }

  dl {
    display: flex;
    flex-direction: column;
    border-top: 1px solid $border-strong;
  }

  dl div {
    display: flex;
    justify-content: space-between;
    gap: $space-5;
    padding-block: $space-3;
    border-bottom: 1px solid $border-strong;
  }

  dt {
    @include mono-data($text-muted, $text-caption);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  dd {
    @include mono-data($text-strong, $text-body-sm);
    font-weight: $weight-medium;
    text-align: right;
  }
}

.state-panel {
  @include empty-state;
  flex: 1;
  justify-content: center;
  padding-top: calc(72px + #{$space-16});

  h1 {
    font-size: $text-title;
  }

  a {
    @include button-primary;
    margin-top: $space-2;
  }
}

@include from($bp-md) {
  .product-main {
    min-height: 520px;
    flex-direction: row;
  }

  .visual,
  .summary {
    width: 50%;
  }

  .summary {
    justify-content: center;
    padding: $space-12;
  }

  .details {
    flex-direction: row;
    justify-content: space-between;
    padding: $space-10 $space-12;

    > div,
    dl {
      width: 46%;
    }
  }
}
</style>
