<script setup lang="ts">
import { computed } from 'vue'
import ProductMedia from '@/components/ProductMedia.vue'
import type { CatalogItem } from '@/services/catalog'
import { discountPercent } from '@/config/categories'

const props = defineProps<{ product: CatalogItem }>()
const emit = defineEmits<{ buy: [product: CatalogItem] }>()

const discount = computed(() => discountPercent(props.product.price, props.product.originalPrice))
</script>

<template>
  <article class="product-card">
    <router-link :to="`/productos/${product.slug || product._id}`" class="media-link">
      <ProductMedia :product="product" />
      <span class="tag">{{ product.category.name }}</span>
      <span v-if="discount" class="discount">-{{ discount }}%</span>
    </router-link>

    <div class="product-body">
      <p class="availability"><span class="dot" aria-hidden="true"></span>En stock</p>
      <h2>{{ product.name }}</h2>
      <p class="description">{{ product.description }}</p>

      <ul v-if="product.specifications?.length" class="specs">
        <li v-for="spec in product.specifications.slice(0, 3)" :key="spec.label">
          <span>{{ spec.label }}</span><strong>{{ spec.value }}</strong>
        </li>
      </ul>

      <div class="card-footer">
        <div class="price">
          <small v-if="product.originalPrice">Antes ${{ product.originalPrice.toFixed(0) }}</small>
          <strong>${{ product.price.toFixed(2) }}</strong>
        </div>
        <div class="actions">
          <router-link :to="`/productos/${product.slug || product._id}`">Ver detalle</router-link>
          <button type="button" @click="emit('buy', product)">
            Comprar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.product-card {
  display: flex;
  flex: 1 1 300px;
  max-width: calc(50% - #{$space-3});
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  transition: border-color $duration-base $ease-out, transform $duration-base $ease-out,
    box-shadow $duration-base $ease-out;

  &:hover {
    border-color: $cyan;
    transform: translateY(-3px);
    box-shadow: $shadow-md;
  }
}

.media-link {
  position: relative;
  display: block;
  height: 220px;
  @include focus-ring;

  .tag {
    @include badge($brand-700, rgba(255, 255, 255, 0.92));
    position: absolute;
    top: $space-3;
    left: $space-3;
    box-shadow: $shadow-xs;
  }

  .discount {
    @include badge($white, $accent-500);
    position: absolute;
    top: $space-3;
    right: $space-3;
    box-shadow: $shadow-xs;
  }
}

.product-body {
  @include stack($space-3);
  flex: 1;
  align-items: flex-start;
  padding: $space-5;

  h2 {
    @include display-heading($text-heading, $width-normal);
  }
}

.availability {
  @include eyebrow($ok);

  .dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: $ok;
  }
}

.description {
  @include body-text($text-body, $text-body-sm);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.specs {
  display: flex;
  width: 100%;
  flex-direction: column;
  border-top: 1px solid $border-subtle;

  li {
    display: flex;
    justify-content: space-between;
    gap: $space-3;
    padding-block: $space-2;
    border-bottom: 1px solid $border-subtle;
    @include mono-data($text-muted, $text-eyebrow);
  }

  strong {
    color: $text-strong;
    font-weight: $weight-medium;
    text-align: right;
  }
}

.card-footer {
  display: flex;
  width: 100%;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-3;
  margin-top: auto;
  padding-top: $space-2;
}

.price {
  @include stack(2px);

  small {
    @include mono-data($text-muted, $text-eyebrow);
    text-decoration: line-through;
  }

  strong {
    @include price(1.4rem);
  }
}

.actions {
  @include stack($space-2);
  align-items: flex-end;

  a {
    color: $brand-600;
    font-size: $text-eyebrow;
    font-weight: $weight-bold;
    @include focus-ring;
  }

  button {
    @include button-primary;
  }
}

@include until($bp-sm) {
  .product-card {
    max-width: none;
    flex-basis: 100%;
  }
}
</style>
