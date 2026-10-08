<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/services/orders'
import {
  chatLink,
  formatDate,
  formatMoney,
  fromBot,
  orderCode,
  phoneLink,
  sourceIcon,
  sourceLabel,
  TRANSFER_STATUS,
} from '@/components/admin/orderHelpers'

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

const transferMeta = computed(() =>
  props.order.source === 'transfer' && props.order.transfer?.status ? TRANSFER_STATUS[props.order.transfer.status] : null,
)

// "hace 2 h" se lee más rápido que la fecha completa; la fecha queda en el title.
const ago = computed(() => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(props.order.createdAt).getTime()) / 60000))
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days < 30 ? `hace ${days} d` : new Date(props.order.createdAt).toLocaleDateString('es-EC')
})

const onStatusChange = (value: string | number | null) => {
  const status = value as OrderStatus
  if (status === props.order.status) return
  emit('changeStatus', props.order, status)
  selected.value = props.order.status
}
</script>

<template>
  <article class="order-card" :class="{ attention: order.transfer?.status === 'in_review' && order.source === 'transfer' }">
    <div class="source" :class="order.source" :title="sourceLabel(order.source)">
      <i :class="sourceIcon(order.source)" aria-hidden="true"></i>
    </div>

    <div class="body">
      <div class="top">
        <div class="identity">
          <h2>{{ order.customerName }}</h2>
          <span class="meta">
            <span class="code">{{ orderCode(order) }}</span>
            <span>{{ sourceLabel(order.source) }}</span>
            <time :datetime="order.createdAt" :title="formatDate(order.createdAt)">{{ ago }}</time>
          </span>
        </div>
        <div class="badges">
          <span v-if="fromBot(order)" class="bot-tag"><i class="fa-solid fa-robot" aria-hidden="true"></i> Bot</span>
          <OrderStatusBadge :status="order.status" />
        </div>
      </div>

      <button
        v-if="transferMeta"
        type="button"
        class="transfer-chip"
        :class="transferMeta.tone"
        @click="emit('open', order)"
      >
        <i :class="transferMeta.icon" aria-hidden="true"></i>
        {{ transferMeta.label }}
        <span v-if="order.transfer?.status === 'in_review'" class="chip-cta">Revisar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
      </button>

      <ul class="products" aria-label="Productos">
        <li v-for="item in order.items" :key="item.name"><strong>{{ item.quantity }}×</strong> {{ item.name }}</li>
      </ul>

      <div class="contact">
        <a :href="`mailto:${order.customerEmail}`">
          <i class="fa-solid fa-envelope" aria-hidden="true"></i><span>{{ order.customerEmail }}</span>
        </a>
        <a :href="phoneLink(order.customerPhone)">
          <i class="fa-solid fa-phone" aria-hidden="true"></i><span>{{ order.customerPhone }}</span>
        </a>
        <span>
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>{{ order.address || 'Sin dirección' }}</span>
        </span>
      </div>
    </div>

    <aside class="side">
      <strong class="total">{{ formatMoney(order.totalAmount) }}</strong>

      <div class="status-control">
        <AppSelect
          v-model="selected"
          :options="statusOptions"
          :disabled="busy"
          size="sm"
          aria-label="Cambiar estado del pedido"
          @change="onStatusChange"
        />
      </div>

      <div class="actions">
        <button type="button" class="detail" @click="emit('open', order)">
          <i class="fa-solid fa-eye" aria-hidden="true"></i> Ver detalle
        </button>
        <a :href="chatLink(order)" target="_blank" rel="noopener" class="chat" aria-label="Abrir chat de WhatsApp">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Chat
        </a>
      </div>
    </aside>
  </article>
</template>

<style scoped lang="scss">
.order-card {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: $space-3 $space-4;
  padding: $space-5 $space-4;
  border-bottom: 1px solid $border-subtle;
  transition: background $duration-base $ease-out;

  &:last-child {
    border-bottom: 0;
  }

  @media (hover: hover) {
    &:hover {
      background: rgba($surface-sunken, 0.45);
    }
  }

  // Comprobante por revisar: una franja amarilla lo destaca en la lista.
  &.attention::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 3px;
    background: $yellow;
  }
}

.source {
  display: flex;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  font-size: 1.05rem;

  &.whatsapp {
    background: $accent-100;
    color: $accent-600;
  }

  &.payphone {
    background: $brand-100;
    color: $brand-600;
  }

  &.transfer {
    background: $warning-100;
    color: $warning-500;
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
  @include stack(4px);
  min-width: 0;

  h2 {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
    line-height: 1.25;
  }
}

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px $space-2;
  color: $text-muted;
  font-size: $admin-text-sm;

  > * + *::before {
    content: '·';
    margin-right: $space-2;
    color: $border-strong;
  }
}

.code {
  @include mono-data($text-body, $admin-text-xs);
  font-weight: $weight-medium;
}

.badges {
  @include row($space-2);
  flex-wrap: wrap;
}

.bot-tag {
  @include admin-badge;
}

.transfer-chip {
  @include row($space-2);
  align-self: flex-start;
  padding: 6px 6px 6px $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-sunken;
  color: $text-body;
  font-size: $admin-text-sm;
  font-weight: $weight-semibold;
  cursor: pointer;
  @include focus-ring;

  &.waiting {
    padding-right: $space-3;
  }

  &.review {
    border-color: rgba($yellow-deep, 0.4);
    background: $warning-100;
    color: $text-strong;

    > i {
      color: $warning-500;
    }
  }

  &.approved {
    padding-right: $space-3;

    > i {
      color: $success-500;
    }
  }

  &.rejected {
    padding-right: $space-3;

    > i {
      color: $danger-500;
    }
  }
}

.chip-cta {
  @include row(6px);
  padding: 4px 10px;
  border-radius: $radius-pill;
  background: $key-900;
  color: $text-on-dark;
  font-size: $admin-text-xs;

  i {
    font-size: 0.7em;
  }
}

.products {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  li {
    max-width: 100%;
    padding: 5px 10px;
    border: 1px solid $border-subtle;
    border-radius: $radius-sm;
    background: $surface-card;
    color: $text-strong;
    font-size: $admin-text-sm;
    overflow-wrap: anywhere;

    strong {
      color: $cyan-deep;
      font-family: $font-mono;
      font-size: $admin-text-xs;
    }
  }
}

.contact {
  @include stack($space-2);
  color: $text-body;
  font-size: $admin-text-sm;

  a,
  > span {
    @include row($space-2);
    min-width: 0;
    @include focus-ring;

    span {
      @include truncate;
    }
  }

  a:hover {
    color: $brand-600;
  }

  i {
    width: 14px;
    flex: none;
    color: $text-muted;
    font-size: $admin-text-xs;
  }
}

.side {
  @include stack($space-3);
  width: 100%;
  padding-top: $space-4;
  border-top: 1px dashed $border-subtle;
}

.total {
  @include price(1.4rem);
  font-weight: $weight-bold;
}

.actions {
  display: flex;
  gap: $space-2;
}

.detail {
  @include button-secondary;
  flex: 1;
  padding: 10px $space-3;
  font-size: $admin-text-sm;
}

.chat {
  @include button-whatsapp;
  padding: 10px $space-3;
  font-size: $admin-text-sm;
}

@include from($bp-md) {
  .order-card {
    flex-wrap: nowrap;
    gap: $space-5;
    padding: $space-5 $space-6;
  }

  .contact {
    flex-direction: row;
    flex-wrap: wrap;
    gap: $space-2 $space-5;

    a,
    > span {
      max-width: 100%;
    }
  }

  .side {
    width: 240px;
    flex: none;
    align-items: stretch;
    padding-top: 0;
    padding-left: $space-5;
    border-top: 0;
    border-left: 1px solid $border-subtle;
  }

  .total {
    text-align: right;
  }
}
</style>
