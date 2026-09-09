<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { brand } from '@/config/brand'
import type { CustomerDetails } from '@/components/PaymentCustomerForm.vue'

/**
 * Columna de resumen del checkout. En móvil arranca plegada (solo total) y se
 * abre al tocar; en escritorio siempre está desplegada. Cuando ya hay datos del
 * cliente los recapitula con un enlace para volver a editarlos.
 */
defineProps<{ customer?: CustomerDetails | null }>()
const emit = defineEmits<{ edit: [] }>()

const cartStore = useCartStore()
const expanded = ref(false)
</script>

<template>
  <aside class="summary" :class="{ expanded }">
    <button
      class="summary-toggle"
      type="button"
      :aria-expanded="expanded"
      aria-controls="summary-body"
      @click="expanded = !expanded"
    >
      <span class="toggle-copy">
        <span class="eyebrow">Resumen</span>
        <strong>{{ cartStore.totalItems }} artículo{{ cartStore.totalItems === 1 ? '' : 's' }}</strong>
      </span>
      <span class="toggle-total">${{ cartStore.totalAmount.toFixed(2) }}</span>
      <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
    </button>

    <div id="summary-body" class="summary-body">
      <ul class="items">
        <li v-for="item in cartStore.items" :key="item.id">
          <span class="thumb" aria-hidden="true">
            <img v-if="item.image" :src="item.image" alt="" loading="lazy" />
            <i v-else class="fa-solid fa-cube"></i>
          </span>
          <span class="item-copy">
            <strong>{{ item.name }}</strong>
            <small>{{ item.quantity }} × ${{ item.price.toFixed(2) }}</small>
          </span>
          <span class="item-total">${{ (item.price * item.quantity).toFixed(2) }}</span>
        </li>
      </ul>

      <dl class="totals">
        <div>
          <dt>Subtotal</dt>
          <dd>${{ cartStore.totalAmount.toFixed(2) }}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd class="muted">Se coordina contigo</dd>
        </div>
        <div class="grand">
          <dt>Total</dt>
          <dd>${{ cartStore.totalAmount.toFixed(2) }}</dd>
        </div>
      </dl>

      <section v-if="customer" class="customer" aria-label="Datos del cliente">
        <header>
          <span class="eyebrow">Tus datos</span>
          <button type="button" @click="emit('edit')">
            <i class="fa-solid fa-pen" aria-hidden="true"></i> Editar
          </button>
        </header>
        <p><i class="fa-solid fa-user" aria-hidden="true"></i>{{ customer.name }}</p>
        <p><i class="fa-solid fa-envelope" aria-hidden="true"></i>{{ customer.email }}</p>
        <p><i class="fa-brands fa-whatsapp" aria-hidden="true"></i>{{ customer.phone }}</p>
        <p><i class="fa-solid fa-location-dot" aria-hidden="true"></i>{{ customer.address }}</p>
      </section>

      <ul class="trust">
        <li><i class="fa-solid fa-shield-halved" aria-hidden="true"></i>Pago protegido por Payphone</li>
        <li><i class="fa-brands fa-whatsapp" aria-hidden="true"></i>Atención directa por WhatsApp</li>
        <li><i class="fa-solid fa-store" aria-hidden="true"></i>Dos tiendas en {{ brand.city.split(',')[0] }}</li>
      </ul>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.summary {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-page;
}

.eyebrow {
  @include eyebrow;
}

.summary-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  gap: $space-3;
  padding: $space-3 $space-4;
  border: 0;
  background: transparent;
  color: $text-strong;
  text-align: left;
  cursor: pointer;
  @include focus-ring;

  > i {
    color: $text-muted;
    font-size: 0.7rem;
    transition: transform $duration-base $ease-out;
  }

  .expanded & > i {
    transform: rotate(180deg);
  }
}

.toggle-copy {
  @include stack(1px);
  flex: 1;

  strong {
    font-size: $text-body-sm;
  }
}

.toggle-total {
  @include price(1.125rem);
}

.summary-body {
  @include stack($space-4);
  display: none;
  padding: 0 $space-4 $space-4;

  .expanded & {
    display: flex;
  }
}

.items {
  @include stack($space-3);

  li {
    display: flex;
    align-items: center;
    gap: $space-3;
  }
}

.thumb {
  display: flex;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $surface-card;
  color: $brand-500;

  img {
    width: 100%;
    height: 100%;
    padding: 3px;
    object-fit: contain;
  }
}

.item-copy {
  @include stack(1px);
  min-width: 0;
  flex: 1;

  strong {
    @include truncate;
    font-size: $text-caption;
    font-weight: $weight-semibold;
  }

  small {
    @include mono-data($text-muted, $text-eyebrow);
  }
}

.item-total {
  @include mono-data($text-strong, $text-caption);
  white-space: nowrap;
}

.totals {
  @include stack($space-2);
  padding-top: $space-3;
  border-top: 1px solid $border-subtle;

  div {
    display: flex;
    justify-content: space-between;
    gap: $space-3;
    font-size: $text-caption;
  }

  dt {
    color: $text-body;
  }

  dd {
    @include mono-data($text-strong, $text-caption);
  }

  .muted {
    color: $text-muted;
    font-family: $font-sans;
  }

  .grand {
    margin-top: $space-1;
    padding-top: $space-2;
    border-top: 1px solid $border-subtle;

    dt {
      color: $text-strong;
      font-weight: $weight-semibold;
    }

    dd {
      @include price(1.375rem);
    }
  }
}

.customer {
  @include stack($space-2);
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $surface-card;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    button {
      @include row($space-1);
      color: $cyan-deep;
      font-size: $text-eyebrow;
      font-weight: $weight-bold;
      cursor: pointer;
      @include focus-ring;
    }
  }

  p {
    @include row($space-2);
    @include truncate;
    color: $text-body;
    font-size: $text-caption;

    i {
      width: 14px;
      flex: none;
      color: $brand-500;
      text-align: center;
    }
  }
}

.trust {
  @include stack($space-2);

  li {
    @include row($space-2);
    color: $text-body;
    font-size: $text-eyebrow;

    i {
      width: 14px;
      color: $ok;
      text-align: center;
    }
  }
}

@include from($bp-md) {
  .summary {
    height: 100%;
  }

  .summary-toggle {
    padding: $space-4 $space-5 $space-3;
    pointer-events: none;

    > i {
      display: none;
    }
  }

  .summary-body {
    display: flex;
    flex: 1;
    padding: 0 $space-5 $space-5;
  }

  .trust {
    margin-top: auto;
    padding-top: $space-3;
    border-top: 1px solid $border-subtle;
  }
}
</style>
