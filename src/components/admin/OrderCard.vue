<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/services/orders'
import { chatLink, formatDate, formatMoney, phoneLink, sourceIcon, sourceLabel } from '@/components/admin/orderHelpers'

const props = defineProps<{ order: Order; busy: boolean }>()
const emit = defineEmits<{ open: [order: Order]; changeStatus: [order: Order, status: OrderStatus] }>()

// Copia local del estado: si el usuario cancela la confirmación, el select
// vuelve al valor real sin esperar a que el padre lo reasigne.
const selected = ref<OrderStatus>(props.order.status)
watch(
  () => props.order.status,
  (status) => (selected.value = status),
)

const statusOptions = computed(() =>
  ORDER_STATUSES.map((meta) => ({ value: meta.value, label: meta.label, icon: meta.icon })),
)

const onStatusChange = (value: string | number | null) => {
  const status = value as OrderStatus
  if (status === props.order.status) return
  emit('changeStatus', props.order, status)
  selected.value = props.order.status
}
</script>

<template>
  <article class="order-card">
    <div class="source" :class="order.source">
      <i :class="sourceIcon(order.source)" aria-hidden="true"></i>
    </div>

    <div class="body">
      <div class="top">
        <div class="identity">
          <h2>{{ order.customerName }}</h2>
          <span class="source-label">{{ sourceLabel(order.source) }} · {{ formatDate(order.createdAt) }}</span>
        </div>
        <OrderStatusBadge :status="order.status" />
      </div>

      <div class="contact">
        <a :href="`mailto:${order.customerEmail}`">
          <i class="fa-solid fa-envelope" aria-hidden="true"></i>{{ order.customerEmail }}
        </a>
        <a :href="phoneLink(order.customerPhone)">
          <i class="fa-solid fa-phone" aria-hidden="true"></i>{{ order.customerPhone }}
        </a>
        <span>
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>{{ order.address || 'Sin dirección' }}
        </span>
      </div>

      <div class="products">
        <span v-for="item in order.items" :key="item.name">{{ item.quantity }}× {{ item.name }}</span>
      </div>
    </div>

    <aside class="side">
      <strong class="total">{{ formatMoney(order.totalAmount) }}</strong>

      <label class="status-control">
        <span>Cambiar estado</span>
        <AppSelect
          v-model="selected"
          :options="statusOptions"
          :disabled="busy"
          size="sm"
          aria-label="Cambiar estado del pedido"
          @change="onStatusChange"
        />
      </label>

      <div class="actions">
        <button type="button" class="detail" @click="emit('open', order)">
          <i class="fa-solid fa-eye" aria-hidden="true"></i> Ver detalle
        </button>
        <a :href="chatLink(order)" target="_blank" rel="noopener" class="chat">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Chat
        </a>
      </div>
    </aside>
  </article>
</template>

<style scoped lang="scss">
.order-card {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;
  padding: $space-5;
  border-bottom: 1px solid $border-subtle;

  &:last-child {
    border-bottom: 0;
  }
}

.source {
  display: flex;
  width: 42px;
  height: 42px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;

  &.whatsapp {
    background: $accent-100;
    color: $accent-600;
  }

  &.payphone {
    background: $brand-100;
    color: $brand-600;
  }
}

.body {
  @include stack($space-3);
  flex: 1 1 240px;
  min-width: 0;
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-2;
}

.identity {
  @include stack(2px);
  min-width: 0;

  h2 {
    font-size: $text-subheading;
  }
}

.source-label {
  @include mono-data($text-muted, $text-eyebrow);
}

.contact {
  @include stack($space-2);
  color: $text-body;
  font-size: $text-caption;

  a,
  span {
    @include row($space-2);
    min-width: 0;
    @include focus-ring;
  }

  a:hover {
    color: $brand-600;
  }

  i {
    width: 14px;
    flex: none;
    color: $brand-500;
  }
}

.products {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  span {
    padding: $space-1 $space-2;
    border-radius: $radius-xs;
    background: $surface-sunken;
    color: $text-body;
    font-size: $text-eyebrow;
  }
}

.side {
  @include stack($space-3);
  width: 100%;
  padding-top: $space-3;
  border-top: 1px solid $border-subtle;
}

.total {
  @include price(1.35rem);
}

.status-control {
  @include stack($space-1);

  > span {
    @include field-label;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.detail {
  @include button-secondary;
  flex: 1;
  padding: $space-2 $space-3;
  font-size: $text-caption;
}

.chat {
  @include button-whatsapp;
  padding: $space-2 $space-3;
  font-size: $text-caption;
}

@include from($bp-md) {
  .order-card {
    flex-wrap: nowrap;
    gap: $space-5;
    padding: $space-6;
  }

  .contact {
    flex-direction: row;
    flex-wrap: wrap;
    gap: $space-4;
  }

  .side {
    width: 220px;
    flex: none;
    padding-top: 0;
    border-top: 0;
  }
}
</style>
