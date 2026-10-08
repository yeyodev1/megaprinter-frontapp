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
  saveShipping: [order: Order, data: { carrier: string; trackingNumber: string; file: File | null }]
}>()

// Guía de envío: al guardarla el pedido pasa a «Enviado» y el cliente la recibe por correo.
const shippingForm = ref({ carrier: '', trackingNumber: '' })
const guideFile = ref<File | null>(null)
const guideInput = ref<HTMLInputElement | null>(null)
watch(
  () => props.order?._id,
  () => {
    shippingForm.value = { carrier: props.order?.shipping?.carrier ?? '', trackingNumber: props.order?.shipping?.trackingNumber ?? '' }
    guideFile.value = null
  },
  { immediate: true },
)
const canShip = computed(() => !!props.order && ['paid', 'processing', 'shipped'].includes(props.order.status))
const onGuideFile = (event: Event) => {
  guideFile.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
const submitShipping = () => {
  if (props.order) emit('saveShipping', props.order, { ...shippingForm.value, file: guideFile.value })
}

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
  shipped: 'Marcar enviado',
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
      <section class="hero">
        <span class="source" :class="order.source"><i :class="sourceIcon(order.source)" aria-hidden="true"></i></span>
        <div class="hero-copy">
          <p class="hero-label"><span class="mono">{{ orderCode(order) }}</span> · {{ sourceLabel(order.source) }}</p>
          <div class="hero-badges">
            <OrderStatusBadge :status="order.status" />
            <span class="channel-tag">
              <i :class="fromBot(order) ? 'fa-solid fa-robot' : 'fa-solid fa-globe'" aria-hidden="true"></i>
              {{ fromBot(order) ? 'Bot de WhatsApp' : 'Tienda web' }}
            </span>
          </div>
        </div>
        <div class="hero-total">
          <span>Total</span>
          <strong>{{ formatMoney(order.totalAmount) }}</strong>
        </div>
      </section>

      <section class="block panel">
        <h3 class="section-title"><i class="fa-solid fa-user" aria-hidden="true"></i> Cliente</h3>
        <dl class="facts">
          <div>
            <dt>Correo</dt>
            <dd><a :href="`mailto:${order.customerEmail}`">{{ order.customerEmail }}</a></dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd><a :href="phoneLink(order.customerPhone)">{{ order.customerPhone }}</a></dd>
          </div>
          <div class="wide">
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
        </dl>

        <div class="contact-actions">
          <a :href="chatLink(order)" target="_blank" rel="noopener" class="chat">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Abrir chat con el cliente
          </a>
          <router-link
            v-if="fromBot(order) && order.whatsappPhone"
            :to="{ name: 'AdminBot', query: { phone: order.whatsappPhone } }"
            class="bot-link"
          >
            <i class="fa-solid fa-robot" aria-hidden="true"></i> Ver conversación del bot
          </router-link>
        </div>
      </section>

      <section class="block panel">
        <h3 class="section-title"><i class="fa-solid fa-box" aria-hidden="true"></i> Artículos</h3>
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

      <section v-if="transfer" class="block panel transfer" :class="{ attention: canReview }">
        <div class="transfer-head">
          <h3 class="section-title"><i class="fa-solid fa-building-columns" aria-hidden="true"></i> Transferencia</h3>
          <span v-if="transferMeta" class="transfer-status" :class="transferMeta.tone">
            <i :class="transferMeta.icon" aria-hidden="true"></i>{{ transferMeta.label }}
          </span>
        </div>

        <p v-if="transfer.account?.accountNumber" class="transfer-account">
          <img v-if="transfer.account.logoUrl" :src="transfer.account.logoUrl" alt="" />
          <span>
            Eligió <strong>{{ transfer.account.bank }}</strong> · Cta. {{ transfer.account.accountType }}
            <span class="mono">{{ transfer.account.accountNumber }}</span>
          </span>
        </p>
        <p v-else class="transfer-empty">
          <i class="fa-solid fa-building-columns" aria-hidden="true"></i> Todavía no elige a qué banco transferir.
        </p>

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

      <section v-if="canShip || order.shipping?.trackingNumber || order.shipping?.guideUrl" class="block panel shipping">
        <h3 class="section-title"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Guía de envío</h3>
        <p v-if="order.shipping?.guideUrl || order.shipping?.trackingNumber" class="shipping-current">
          <i class="fa-solid fa-truck-fast" aria-hidden="true"></i>
          <span>
            {{ order.shipping?.carrier || 'Transportista' }}
            <template v-if="order.shipping?.trackingNumber"> · <span class="mono">{{ order.shipping.trackingNumber }}</span></template>
            <template v-if="order.shipping?.shippedAt"> · {{ formatDate(order.shipping.shippedAt) }}</template>
          </span>
          <a v-if="order.shipping?.guideUrl" :href="order.shipping.guideUrl" target="_blank" rel="noopener">Ver guía</a>
        </p>
        <form v-if="canShip" class="shipping-form" @submit.prevent="submitShipping">
          <label class="note">
            <span>Transportista</span>
            <input v-model="shippingForm.carrier" maxlength="80" placeholder="Servientrega, Tramaco, Laar…" />
          </label>
          <label class="note">
            <span>N.º de guía</span>
            <input v-model="shippingForm.trackingNumber" maxlength="80" placeholder="Número de guía" />
          </label>
          <div class="guide-file">
            <input ref="guideInput" type="file" accept="image/*,application/pdf" class="visually-hidden" @change="onGuideFile" />
            <button type="button" class="file-btn" @click="guideInput?.click()">
              <i class="fa-solid fa-paperclip" aria-hidden="true"></i> {{ guideFile ? guideFile.name : 'Adjuntar guía (PDF o foto)' }}
            </button>
          </div>
          <button type="submit" class="approve" :disabled="busy">
            <i :class="busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" aria-hidden="true"></i>
            {{ order.status === 'shipped' ? 'Actualizar guía y avisar' : 'Guardar guía y marcar enviado' }}
          </button>
          <p class="hint">El cliente recibe la guía por correo y la ve en su página de seguimiento.</p>
        </form>
      </section>

      <section class="block panel">
        <h3 class="section-title"><i class="fa-solid fa-route" aria-hidden="true"></i> Estado del pedido</h3>

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

        <ul v-if="order.statusHistory?.length" class="history" aria-label="Historial de estados">
          <li v-for="(entry, index) in [...order.statusHistory].reverse()" :key="index">
            <i :class="orderStatusMeta(entry.status).icon" aria-hidden="true"></i>
            <span><strong>{{ orderStatusMeta(entry.status).label }}</strong> · {{ formatDate(entry.at) }}<template v-if="entry.by"> · {{ entry.by }}</template></span>
          </li>
        </ul>

        <p class="hint">Cada cambio de estado le llega al cliente por correo.</p>

        <ul v-if="order.emailLog?.length" class="emails" aria-label="Correos enviados">
          <li v-for="(email, index) in order.emailLog" :key="index" :class="{ failed: !email.ok }">
            <i :class="email.ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation'" aria-hidden="true"></i>
            <span>
              {{ email.kind }} · {{ email.to }} · {{ formatDate(email.at) }}
              <template v-if="!email.ok"> · <strong>no se envió</strong> ({{ email.error }})</template>
            </span>
          </li>
        </ul>

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
  @include stack($space-4);
}

.block {
  @include stack($space-4);
}

.panel {
  padding: $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;

  &.attention {
    border-color: rgba($yellow-deep, 0.4);
    box-shadow: 0 0 0 3px rgba($yellow, 0.18);
  }
}

.section-title {
  @include row($space-2);
  color: $text-strong;
  font-family: $font-sans;
  font-size: $admin-text-base;
  font-weight: $weight-bold;

  i {
    color: $cyan-deep;
    font-size: $admin-text-sm;
  }
}

// Cabecera del pedido: origen, estado, canal y total de un vistazo.
.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3 $space-4;
  padding: $space-4;
  border-radius: $radius-lg;
  background: $surface-sunken;
}

.hero-copy {
  @include stack($space-2);
  flex: 1 1 200px;
  min-width: 0;
}

.hero-label {
  color: $text-body;
  font-size: $admin-text-sm;

  .mono {
    @include mono-data($text-strong, $admin-text-sm);
    font-weight: $weight-medium;
  }
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.channel-tag {
  @include admin-badge($text-body, $surface-card);
}

.hero-total {
  @include stack(2px);
  align-items: flex-end;
  margin-left: auto;

  span {
    @include admin-label($text-muted);
  }

  strong {
    @include price(1.6rem);
    font-weight: $weight-bold;
  }
}

.source {
  display: flex;
  width: 48px;
  height: 48px;
  font-size: 1.1rem;
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
  @include admin-badge;

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

.shipping-current {
  @include row($space-2);
  flex-wrap: wrap;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: $brand-100;
  font-size: $admin-text-md;

  i {
    color: $cyan-dark;
  }

  .mono {
    @include mono-data($text-strong, $admin-text-sm);
  }

  a {
    margin-left: auto;
    color: $cyan-dark;
    font-weight: $weight-semibold;
  }
}

.shipping-form {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  .note {
    flex: 1 1 200px;
  }

  .guide-file,
  .approve,
  .hint {
    flex: 1 1 100%;
  }
}

.file-btn {
  @include button-secondary;
  width: 100%;
  justify-content: flex-start;
}

.emails {
  @include stack(4px);
  font-size: $admin-text-sm;

  li {
    @include row($space-2, flex-start);
    color: $text-body;

    i {
      margin-top: 2px;
      color: $success-500;
    }

    &.failed {
      color: $danger-500;

      i {
        color: $danger-500;
      }
    }
  }
}

.history {
  @include stack($space-2);
  padding: $space-3;
  border-radius: $radius-md;
  background: $surface-sunken;
  color: $text-body;
  font-size: $admin-text-sm;

  li {
    @include row($space-2, flex-start);
  }

  i {
    width: 16px;
    margin-top: 3px;
    flex: none;
    color: $text-muted;
    font-size: $admin-text-xs;
    text-align: center;
  }

  strong {
    color: $text-strong;
  }
}

.transfer-account {
  @include row($space-2);
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: $surface-sunken;
  font-size: $admin-text-md;

  img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  .mono {
    @include mono-data($text-strong, $admin-text-sm);
  }
}

.transfer-empty,
.hint,
.reviewed {
  @include row($space-2, flex-start);
  color: $text-muted;
  font-size: $admin-text-sm;
}

.receipt {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-page;
}

.receipt-media {
  display: flex;
  max-height: 260px;
  overflow: hidden;
  border-radius: $radius-xs;
  background: $surface-sunken;
  @include focus-ring;

  img {
    width: 100%;
    max-height: 260px;
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
  color: $text-muted;
  font-size: $admin-text-sm;
}

.receipt-summary {
  @include row($space-2, flex-start);
  font-size: $admin-text-md;

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
    @include admin-badge;
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
    @include admin-label;
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
  gap: $space-4 $space-5;

  > div {
    @include stack(4px);
    flex: 1 1 140px;
    min-width: 0;

    &.wide {
      flex-basis: 100%;
    }
  }

  dt {
    @include admin-label($text-muted);
  }

  dd {
    color: $text-strong;
    font-size: $admin-text-md;
    overflow-wrap: anywhere;

    a {
      color: $cyan-dark;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .mono {
    @include mono-data($text-body, $admin-text-sm);
  }
}

.contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.chat {
  @include button-whatsapp;
}

.bot-link {
  @include button-secondary;
}

.items {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2 $space-3;
  padding: $space-3 $space-4;
  border-top: 1px solid $border-subtle;
  font-size: $admin-text-md;

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
    @include mono-data($text-body, $admin-text-sm);
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
    font-size: $admin-text-sm;
  }

  .step-copy {
    @include stack(2px);
    padding-top: 5px;

    strong {
      font-size: $admin-text-md;
    }

    small {
      color: $text-muted;
      font-size: $admin-text-xs;
      line-height: 1.4;
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

  // Pasos que faltan: grises pero legibles (antes con opacity quedaban ilegibles).
  .upcoming,
  .muted {
    .dot {
      border-style: dashed;
    }

    strong {
      color: $text-body;
    }
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
  .panel {
    padding: $space-5;
  }

  .hero {
    padding: $space-4 $space-5;
  }

  .receipt {
    flex-direction: row;
    align-items: flex-start;
  }

  .receipt-media {
    width: 180px;
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
        @include admin-label;
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
