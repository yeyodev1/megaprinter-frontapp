<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { orderStatusMeta, type Order, type OrderStatus } from '@/services/orders'
import {
  chatLink,
  formatDate,
  formatMoney,
  fromBot,
  initialStatus,
  orderCode,
  orderPath,
  phoneLink,
  sourceIcon,
  sourceLabel,
  TRANSFER_STATUS,
} from '@/components/admin/orderHelpers'

const props = defineProps<{ order: Order | null; busy: boolean }>()
const emit = defineEmits<{
  close: []
  changeStatus: [order: Order, status: OrderStatus]
  reviewTransfer: [order: Order, decision: 'approve' | 'reject', note: string]
}>()

const transfer = computed(() => (props.order?.source === 'transfer' ? props.order.transfer ?? {} : null))
const transferMeta = computed(() => (transfer.value?.status ? TRANSFER_STATUS[transfer.value.status] : null))
const receipts = computed(() => [...(transfer.value?.receipts ?? [])].reverse())
const canReview = computed(
  () => !!props.order && props.order.status === 'pending' && !!transfer.value?.receipts?.length && transfer.value.status !== 'approved',
)
const rejectNote = ref('')
watch(
  () => props.order?._id,
  () => (rejectNote.value = ''),
)

const isPdf = (url: string) => /\.pdf($|\?)|\/raw\/upload\//i.test(url)
const check = (value: boolean | null | undefined) => (value === true ? 'ok' : value === false ? 'bad' : 'unknown')
const checkLabel = (value: boolean | null | undefined, yes: string, no: string) =>
  value === true ? yes : value === false ? no : 'Sin lectura'

const review = (decision: 'approve' | 'reject') => {
  if (props.order) emit('reviewTransfer', props.order, decision, rejectNote.value.trim())
}

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
  // Con comprobante por revisar, el pago se marca con «Aprobar pago» (queda registro de quién lo aprobó).
  if (!props.order || isCancelled.value || canReview.value) return null
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
            <dt>Pedido</dt>
            <dd class="mono">{{ orderCode(order) }}</dd>
          </div>
          <div>
            <dt>Canal</dt>
            <dd>{{ fromBot(order) ? 'Bot de WhatsApp' : 'Tienda web' }}</dd>
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

      <section v-if="transfer" class="block transfer">
        <div class="transfer-head">
          <p class="eyebrow">Transferencia</p>
          <span v-if="transferMeta" class="transfer-status" :class="transferMeta.tone">
            <i :class="transferMeta.icon" aria-hidden="true"></i>{{ transferMeta.label }}
          </span>
        </div>

        <p v-if="!receipts.length" class="transfer-empty">
          <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
          El cliente aún no envía el comprobante. Llega solo por WhatsApp o desde su enlace de pago.
        </p>

        <article v-for="(receipt, index) in receipts" :key="receipt.url" class="receipt">
          <a :href="receipt.url" target="_blank" rel="noopener" class="receipt-media">
            <span v-if="isPdf(receipt.url)" class="pdf"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Ver PDF</span>
            <img v-else :src="receipt.url" :alt="`Comprobante ${index + 1} del pedido ${orderCode(order)}`" loading="lazy" />
          </a>
          <div class="receipt-copy">
            <p class="receipt-meta">
              {{ index === 0 ? 'Último comprobante' : 'Anterior' }} · {{ receipt.via === 'web' ? 'Web' : 'WhatsApp' }} ·
              {{ formatDate(receipt.receivedAt) }}
            </p>
            <template v-if="receipt.analysis?.summary">
              <p class="receipt-summary">
                <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>{{ receipt.analysis.summary }}
              </p>
              <ul class="checks">
                <li :class="check(receipt.analysis.amountMatches)">
                  {{ checkLabel(receipt.analysis.amountMatches, 'Monto coincide', 'Monto distinto') }}
                  <span v-if="receipt.analysis.detectedAmount != null"> ({{ formatMoney(receipt.analysis.detectedAmount) }})</span>
                </li>
                <li :class="check(receipt.analysis.accountMatches)">
                  {{ checkLabel(receipt.analysis.accountMatches, 'Cuenta destino coincide', 'Otra cuenta destino') }}
                </li>
                <li v-if="receipt.analysis.detectedReference" class="unknown">Ref. {{ receipt.analysis.detectedReference }}</li>
              </ul>
            </template>
            <p v-else class="receipt-summary muted">Sin lectura automática: revisa la imagen.</p>
          </div>
        </article>

        <p v-if="receipts.length" class="hint">
          La lectura automática solo orienta. Confirma en la banca en línea que el dinero llegó antes de aprobar.
        </p>

        <p v-if="transfer.reviewedAt" class="reviewed">
          {{ transfer.status === 'approved' ? 'Aprobada' : 'Rechazada' }} por {{ transfer.reviewedBy || 'el equipo' }} ·
          {{ formatDate(transfer.reviewedAt) }}<span v-if="transfer.note"> · «{{ transfer.note }}»</span>
        </p>

        <div v-if="canReview" class="review-box">
          <label class="note">
            <span>Motivo si rechazas (lo verá el cliente)</span>
            <input v-model="rejectNote" type="text" maxlength="300" placeholder="Ej.: el monto no coincide, falta $20" />
          </label>
          <div class="review-actions">
            <button type="button" class="approve" :disabled="busy" @click="review('approve')">
              <i :class="busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-circle-check'" aria-hidden="true"></i>
              Aprobar pago
            </button>
            <button type="button" class="reject" :disabled="busy || !rejectNote.trim()" @click="review('reject')">
              <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i> Rechazar
            </button>
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

  &.transfer {
    background: $warning-100;
    color: $warning-500;
  }
}

.transfer-head {
  @include row($space-3);
  flex-wrap: wrap;
  justify-content: space-between;
}

.transfer-status {
  @include badge;

  &.review {
    background: $warning-100;
    color: $warning-500;
  }

  &.approved {
    background: $success-100;
    color: $success-500;
  }

  &.rejected {
    background: $danger-100;
    color: $danger-500;
  }
}

.transfer-empty,
.hint,
.reviewed {
  @include row($space-2, flex-start);
  color: $text-muted;
  font-size: $text-caption;
}

.receipt {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
}

.receipt-media {
  display: flex;
  overflow: hidden;
  border-radius: $radius-xs;
  background: $surface-sunken;
  @include focus-ring;

  img {
    width: 100%;
    max-height: 320px;
    object-fit: contain;
  }

  .pdf {
    @include row($space-2);
    padding: $space-6;
    color: $text-strong;
    font-weight: $weight-semibold;
  }
}

.receipt-copy {
  @include stack($space-2);
  min-width: 0;
}

.receipt-meta {
  @include mono-data($text-muted, $text-eyebrow);
}

.receipt-summary {
  @include row($space-2, flex-start);
  font-size: $text-body-sm;

  i {
    margin-top: 3px;
    color: $brand-500;
  }

  &.muted {
    color: $text-muted;
  }
}

.checks {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  li {
    @include badge;
  }

  .ok {
    background: $success-100;
    color: $success-500;
  }

  .bad {
    background: $danger-100;
    color: $danger-500;
  }
}

.review-box {
  @include stack($space-3);
}

.note {
  @include stack($space-1);

  > span {
    @include field-label;
  }

  input {
    @include input-base;
  }
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.approve {
  @include button-primary;
}

.reject {
  @include button-secondary;
  color: $danger-500;

  &:hover:not(:disabled) {
    border-color: $danger-500;
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
  .receipt {
    flex-direction: row;
    align-items: flex-start;
  }

  .receipt-media {
    width: 200px;
    flex: none;
  }

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
