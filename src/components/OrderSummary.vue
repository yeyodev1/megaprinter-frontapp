<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
</script>

<template>
  <aside class="summary">
    <div class="summary-title">
      <span>Resumen</span>
      <strong>{{ cartStore.totalItems }} artículo{{ cartStore.totalItems === 1 ? '' : 's' }}</strong>
    </div>

    <div class="summary-items">
      <div v-for="item in cartStore.items" :key="item.id">
        <span>{{ item.quantity }}× {{ item.name }}</span>
        <strong>${{ (item.price * item.quantity).toFixed(2) }}</strong>
      </div>
    </div>

    <div class="summary-total">
      <span>Total</span><strong>${{ cartStore.totalAmount.toFixed(2) }}</strong>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.summary {
  @include stack($space-4);
  padding: $space-5;
  border: 1px solid $border-on-dark;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.03);
  color: $text-on-dark;
}

.summary-title,
.summary-items div,
.summary-total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
}

.summary-title {
  font-size: $text-body-sm;

  strong {
    color: $text-on-dark-muted;
    font-size: $text-caption;
  }
}

.summary-items {
  @include stack($space-2);
  color: $text-on-dark-muted;
  font-size: $text-caption;

  strong {
    color: $text-on-dark;
    white-space: nowrap;
  }
}

.summary-total {
  padding-top: $space-4;
  border-top: 1px solid $border-on-dark;
  font-weight: $weight-bold;

  strong {
    font-size: 1.4rem;
    letter-spacing: $tracking-display;
  }
}
</style>
