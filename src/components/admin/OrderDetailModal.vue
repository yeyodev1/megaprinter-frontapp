<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { orderStatusMeta, type Order, type OrderStatus } from '@/services/orders'
import {
  chatLink,
  formatDate,
  formatMoney,
  initialStatus,
  orderPath,
  phoneLink,
  sourceIcon,
  sourceLabel,
} from '@/components/admin/orderHelpers'

const props = defineProps<{ order: Order | null; busy: boolean }>()
const emit = defineEmits<{ close: []; changeStatus: [order: Order, status: OrderStatus] }>()

const path = computed(() => (props.order ? orderPath(props.order) : []))
const currentIndex = computed(() =>
  props.order ? path.value.indexOf(props.order.status) : -1,
)
const isCancelled = computed(() => props.order?.status === 'cancelled')

const stepState = (index: number) => {
  if (isCancelled.value) return 'muted'
  if (index < currentIndex.value) return 'done'
  if (index === currentIndex.value) return 'current'
  return 'upcoming'
}

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: 'Marcar como pagado',
  processing: 'Pasar a preparación',
  delivered: 'Marcar entregado',
}

const nextStatus = computed<OrderStatus | null>(() => {
  if (!props.order || isCancelled.value) return null
  return path.value[currentIndex.value + 1] ?? null
})

const reopenStatus = computed<OrderStatus | null>(() =>
  props.order && isCancelled.value ? initialStatus(props.order) : null,
)

const request = (status: OrderStatus | null) => {
  if (props.order && status) emit('changeStatus', props.order, status)
}
</script>

<template>
  <AppModal :open="!!order" size="lg" eyebrow="Detalle del pedido" :title="order?.customerName ?? ''" @close="emit('close')">
    <div v-if="order" class="detail">
      <section class="block customer">
        <div class="block-head">
          <span class="source" :class="order.source"><i :class="sourceIcon(order.source)" aria-hidden="true"></i></span>
          <div>
            <p class="eyebrow">{{ sourceLabel(order.source) }}</p>
            <OrderStatusBadge :status="order.status" />
          </div>
        </div>

        <dl class="facts">
          <div>
            <dt>Correo</dt>
            <dd><a :href="`mailto:${order.customerEmail}`">{{ order.customerEmail }}</a></dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd><a :href="phoneLink(order.customerPhone)">{{ order.customerPhone }}</a></dd>
          </div>
          <div>
            <dt>Dirección</dt>
            <dd>{{ order.address || 'Sin dirección' }}</dd>
          </div>
          <div>
            <dt>Creado</dt>
            <dd>{{ formatDate(order.createdAt) }}</dd>
          </div>
          <div>
            <dt>Actualizado</dt>
            <dd>{{ formatDate(order.updatedAt) }}</dd>
          </div>
          <div>
            <dt>Referencia</dt>
            <dd class="mono">{{ order._id }}</dd>
          </div>
        </dl>

        <a :href="chatLink(order)" target="_blank" rel="noopener" class="chat">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Abrir chat con el cliente
        </a>
      </section>

      <section class="block">
        <p class="eyebrow">Artículos</p>
        <div class="items">
          <div class="row head">
            <span class="name">Producto</span>
            <span class="qty">Cant.</span>
            <span class="unit">Unitario</span>
            <span class="sub">Subtotal</span>
          </div>
          <div v-for="item in order.items" :key="item.name" class="row">
            <span class="name">{{ item.name }}</span>
            <span class="qty">{{ item.quantity }}</span>
            <span class="unit">{{ formatMoney(item.price) }}</span>
            <span class="sub">{{ formatMoney(item.price * item.quantity) }}</span>
          </div>
          <div class="row total">
            <span class="name">Total</span>
            <span class="sub">{{ formatMoney(order.totalAmount) }}</span>
          </div>
        </div>
      </section>

      <section class="block">
        <p class="eyebrow">Estado del pedido</p>

        <ol class="timeline" :class="{ cancelled: isCancelled }">
          <li v-for="(status, index) in path" :key="status" :class="stepState(index)">
            <span class="dot"><i :class="orderStatusMeta(status).icon" aria-hidden="true"></i></span>
            <span class="step-copy">
              <strong>{{ orderStatusMeta(status).label }}</strong>
              <small>{{ orderStatusMeta(status).description }}</small>
            </span>
          </li>
        </ol>

        <p v-if="isCancelled" class="cancel-note">
          <i class="fa-solid fa-ban" aria-hidden="true"></i>
          Este pedido está cancelado. Puedes reabrirlo para retomar el flujo.
        </p>

        <div class="status-actions">
          <button v-if="nextStatus" type="button" class="advance" :disabled="busy" @click="request(nextStatus)">
            <i :class="busy ? 'fa-solid fa-spinner fa-spin' : orderStatusMeta(nextStatus).icon" aria-hidden="true"></i>
            {{ ADVANCE_LABEL[nextStatus] ?? orderStatusMeta(nextStatus).label }}
          </button>
          <button v-if="reopenStatus" type="button" class="advance" :disabled="busy" @click="request(reopenStatus)">
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reabrir pedido
          </button>
          <button v-if="!isCancelled" type="button" class="cancel" :disabled="busy" @click="request('cancelled')">
            <i class="fa-solid fa-ban" aria-hidden="true"></i> Cancelar pedido
          </button>
        </div>
      </section>
    </div>

    <template #footer>
      <button type="button" class="close" @click="emit('close')">Cerrar</button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.detail {
  @include stack($space-6);
}

.block {
  @include stack($space-4);
}

.eyebrow {
  @include eyebrow;
}

.block-head {
  @include row($space-3, flex-start);

  > div {
    @include stack($space-2);
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

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  > div {
    @include stack(2px);
    flex: 1 1 160px;
    min-width: 0;
    padding: $space-3;
    border-radius: $radius-sm;
    background: $surface-sunken;
  }

  dt {
    @include field-label;
  }

  dd {
    @include truncate;
    font-size: $text-body-sm;

    a:hover {
      color: $brand-600;
    }
  }

  .mono {
    @include mono-data($text-body, $text-caption);
  }
}

.chat {
  @include button-whatsapp;
  align-self: flex-start;
}

.items {
  display: flex;
  flex-direction: column;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2 $space-3;
  padding: $space-3 $space-4;
  border-top: 1px solid $border-subtle;
  font-size: $text-body-sm;

  &:first-child {
    border-top: 0;
  }

  .name {
    flex: 1 1 100%;
    min-width: 0;
    font-weight: $weight-medium;
  }

  .qty,
  .unit,
  .sub {
    @include mono-data($text-body, $text-caption);
  }

  .sub {
    margin-left: auto;
    color: $text-strong;
  }

  &.head {
    display: none;
  }

  &.total {
    background: $surface-sunken;
    font-weight: $weight-semibold;

    .sub {
      @include price(1.15rem);
    }
  }
}

.timeline {
  @include stack($space-3);

  li {
    @include row($space-3, flex-start);
  }

  .dot {
    display: flex;
    width: 34px;
    height: 34px;
    flex: none;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-strong;
    border-radius: $radius-pill;
    background: $surface-card;
    color: $text-muted;
    font-size: $text-caption;
  }

  .step-copy {
    @include stack(2px);
    padding-top: 5px;

    strong {
      font-size: $text-body-sm;
    }

    small {
      color: $text-muted;
      font-size: $text-eyebrow;
    }
  }

  .done .dot {
    border-color: $success-500;
    background: $success-100;
    color: $success-500;
  }

  .current .dot {
    border-color: $cyan;
    background: $cyan;
    color: $key-900;
    box-shadow: $shadow-brand;
  }

  .current strong {
    color: $cyan-dark;
  }

  .upcoming,
  .muted {
    opacity: 0.55;
  }
}

.cancel-note {
  @include admin-notice;
  @include row($space-2);
  background: $danger-100;
  color: $danger-500;
}

.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.advance {
  @include button-primary;
}

.cancel {
  @include button-secondary;
  color: $danger-500;

  &:hover:not(:disabled) {
    border-color: $danger-500;
    color: $danger-500;
  }
}

.close {
  @include button-secondary;
}

@include from($bp-md) {
  .row {
    flex-wrap: nowrap;

    .name {
      flex: 1 1 auto;
    }

    .qty {
      width: 56px;
      text-align: center;
    }

    .unit,
    .sub {
      width: 110px;
      margin-left: 0;
      text-align: right;
    }

    &.head {
      display: flex;
      background: $surface-sunken;

      span {
        @include field-label;
      }
    }

    &.total .name {
      text-align: right;
    }
  }

  .timeline {
    flex-direction: row;
    align-items: flex-start;

    li {
      flex: 1;
      flex-direction: column;
      align-items: flex-start;
      gap: $space-2;
      position: relative;
      padding-right: $space-3;
    }

    // Conector entre pasos, solo entre etapas hermanas.
    li + li::before {
      content: '';
      position: absolute;
      top: 17px;
      right: calc(100% - #{$space-2});
      width: $space-4;
      height: 1px;
      background: $border-strong;
    }

    .step-copy {
      padding-top: 0;
    }
  }
}
</style>
