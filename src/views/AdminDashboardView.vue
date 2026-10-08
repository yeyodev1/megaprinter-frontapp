<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { listOrders, type Order } from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate, formatMoney, needsTransferReview, sourceIcon } from '@/components/admin/orderHelpers'

useAdminEntrance()
const router = useRouter()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')

const whatsappPending = computed(() => orders.value.filter((o) => o.status === 'whatsapp').length)
const paymentPending = computed(() => orders.value.filter((o) => o.status === 'pending').length)
const inProgress = computed(() =>
  orders.value.filter((o) => o.status === 'paid' || o.status === 'processing' || o.status === 'shipped').length,
)
const paidOrders = computed(() => orders.value.filter((o) => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status)))
const revenue = computed(() => paidOrders.value.reduce((sum, o) => sum + o.totalAmount, 0))
// Lo más reciente primero, sin depender del orden en que responde la API.
const recent = computed(() => [...orders.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8))
const transfersToReview = computed(() => orders.value.filter(needsTransferReview).length)
const attention = computed(() => whatsappPending.value + paymentPending.value)

const ACTIVITY_TEXT: Record<Order['source'], string> = {
  whatsapp: 'Solicitó contacto por WhatsApp',
  payphone: 'Inició un pago con Payphone',
  transfer: 'Pagará por transferencia',
}
const activityText = (order: Order) =>
  `${ACTIVITY_TEXT[order.source] ?? 'Registró un pedido'}${order.channel === 'whatsapp_bot' ? ' · vía bot' : ''}`

const timeAgo = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return days < 7 ? `hace ${days} d` : formatDate(iso)
}

const goToOrders = (query: Record<string, string> = {}) => router.push({ name: 'AdminOrders', query })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    orders.value = await listOrders()
  } catch (caught) {
    error.value = errorMessage(caught, 'No pudimos cargar los pedidos.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="dashboard">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-wave-square" aria-hidden="true"></i> Centro de control</p>
        <h1>Resumen</h1>
        <p>Una lectura rápida de las solicitudes y pedidos que llegaron a Megaprinter.</p>
      </div>
      <button class="refresh" type="button" :disabled="loading" @click="load">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
        Actualizar
      </button>
    </header>

    <p v-if="error" class="notice error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
    </p>

    <section class="metrics" data-admin-reveal aria-label="Indicadores">
      <article class="metric">
        <header><span class="metric-icon blue"><i class="fa-solid fa-inbox" aria-hidden="true"></i></span>Total de pedidos</header>
        <strong>{{ orders.length }}</strong>
        <small>Últimos registros</small>
      </article>
      <article class="metric">
        <header><span class="metric-icon green"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>Por contactar</header>
        <strong>{{ whatsappPending }}</strong>
        <small>Solicitudes por WhatsApp</small>
      </article>
      <article class="metric">
        <header><span class="metric-icon brand"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>En curso</header>
        <strong>{{ inProgress }}</strong>
        <small>Pagados o en preparación</small>
      </article>
      <article class="metric">
        <header><span class="metric-icon amber"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i></span>Ingresos</header>
        <strong>{{ formatMoney(revenue) }}</strong>
        <small>Pedidos pagados</small>
      </article>
    </section>

    <div class="panels">
      <section class="attention" :class="{ calm: !attention && !transfersToReview }" data-admin-reveal>
        <header class="card-head">
          <div>
            <p class="eyebrow"><i class="fa-solid fa-bell" aria-hidden="true"></i> Por atender</p>
            <h2>{{ attention }} {{ attention === 1 ? 'pedido espera' : 'pedidos esperan' }} respuesta</h2>
          </div>
        </header>

        <div class="attention-list">
          <button type="button" class="attention-row" @click="goToOrders({ status: 'whatsapp' })">
            <span class="row-icon green"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
            <span class="row-copy"><strong>Solicitudes por WhatsApp</strong><small>Escribirles para cerrar la venta</small></span>
            <span class="count" :class="{ zero: !whatsappPending }">{{ whatsappPending }}</span>
            <i class="fa-solid fa-chevron-right chevron" aria-hidden="true"></i>
          </button>
          <button type="button" class="attention-row" @click="goToOrders({ status: 'pending' })">
            <span class="row-icon amber"><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i></span>
            <span class="row-copy"><strong>Pagos sin confirmar</strong><small>Tarjeta o transferencia pendiente</small></span>
            <span class="count" :class="{ zero: !paymentPending }">{{ paymentPending }}</span>
            <i class="fa-solid fa-chevron-right chevron" aria-hidden="true"></i>
          </button>
          <button type="button" class="attention-row" @click="goToOrders({ transfer: 'in_review' })">
            <span class="row-icon magenta"><i class="fa-solid fa-magnifying-glass-dollar" aria-hidden="true"></i></span>
            <span class="row-copy"><strong>Comprobantes por revisar</strong><small>Aprobar o rechazar la transferencia</small></span>
            <span class="count" :class="{ zero: !transfersToReview, hot: transfersToReview }">{{ transfersToReview }}</span>
            <i class="fa-solid fa-chevron-right chevron" aria-hidden="true"></i>
          </button>
        </div>
      </section>

      <section class="activity" data-admin-reveal>
        <header class="card-head">
          <div>
            <p class="eyebrow"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Actividad</p>
            <h2>Lo más reciente</h2>
          </div>
          <router-link :to="{ name: 'AdminOrders' }" class="see-all">
            Ver todos <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </header>

        <div v-if="loading" class="state">Cargando actividad…</div>

        <ol v-else-if="recent.length" class="timeline">
          <li v-for="order in recent" :key="order._id">
            <span class="source-icon" :class="order.source">
              <i :class="sourceIcon(order.source)" aria-hidden="true"></i>
            </span>
            <div class="entry-copy">
              <strong>{{ order.customerName }}</strong>
              <span>{{ activityText(order) }}</span>
              <small>
                <template v-if="order.orderNumber">{{ order.orderNumber }} · </template>
                <time :datetime="order.createdAt" :title="formatDate(order.createdAt)">{{ timeAgo(order.createdAt) }}</time>
              </small>
            </div>
            <div class="entry-amount">
              <strong>{{ formatMoney(order.totalAmount) }}</strong>
              <OrderStatusBadge :status="order.status" />
            </div>
          </li>
        </ol>

        <div v-else class="empty">
          <i class="fa-solid fa-chart-simple" aria-hidden="true"></i>
          <h3>Sin actividad por ahora</h3>
          <p>Las nuevas solicitudes aparecerán aquí automáticamente.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.refresh {
  @include admin-refresh-button;
}

.notice {
  @include admin-notice;
}

// ─── Indicadores ────────────────────────────────────────────────────────────
.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.metric {
  @include admin-card($space-5);
  @include stack($space-2);
  flex: 1 1 140px;
  min-width: 0;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out;

  @media (hover: hover) {
    &:hover {
      border-color: $border-strong;
      box-shadow: $shadow-sm;
    }
  }

  header {
    @include row($space-2);
    color: $text-body;
    font-size: $admin-text-sm;
    font-weight: $weight-semibold;
  }

  strong {
    margin-top: $space-1;
    color: $text-strong;
    font-family: $font-display;
    font-size: clamp(1.5rem, 2.6vw, 2.25rem);
    font-weight: $weight-black;
    line-height: 1.05;
    letter-spacing: $tracking-display;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }

  small {
    color: $text-muted;
    font-size: $admin-text-xs;
  }

  @include from($bp-md) {
    flex-basis: 200px;
  }
}

.metric-icon,
.row-icon {
  display: flex;
  width: 32px;
  height: 32px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  font-size: $admin-text-sm;

  &.blue {
    background: $cyan-wash;
    color: $cyan-deep;
  }

  &.green {
    background: rgba($whatsapp, 0.14);
    color: #0d7a3c;
  }

  &.brand {
    background: $key-050;
    color: $key-700;
  }

  &.amber {
    background: $yellow-wash;
    color: $yellow-deep;
  }

  &.magenta {
    background: $magenta-wash;
    color: $magenta-deep;
  }
}

// ─── Paneles ────────────────────────────────────────────────────────────────
.panels {
  @include stack($space-5);
}

.attention,
.activity {
  @include admin-card(0);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5 $space-5 $space-4;
  border-bottom: 1px solid $border-subtle;

  h2 {
    margin-top: $space-1;
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
    line-height: 1.3;
  }
}

.attention {
  border-top: 3px solid $yellow;

  &.calm {
    border-top-color: $ok;
  }
}

.attention-list {
  display: flex;
  flex-direction: column;
}

.attention-row {
  @include row($space-3);
  width: 100%;
  padding: $space-4 $space-5;
  border: 0;
  border-bottom: 1px solid $border-subtle;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  @include focus-ring;
  transition: background $duration-base $ease-out;

  &:last-child {
    border-bottom: 0;
  }

  @media (hover: hover) {
    &:hover {
      background: $surface-page;

      .chevron {
        color: $cyan-deep;
        transform: translateX(2px);
      }
    }
  }
}

.row-copy {
  @include stack(2px);
  min-width: 0;
  flex: 1;

  strong {
    color: $text-strong;
    font-size: $admin-text-md;
    font-weight: $weight-semibold;
  }

  small {
    color: $text-muted;
    font-size: $admin-text-xs;
  }
}

.count {
  min-width: 34px;
  padding: 3px 10px;
  border-radius: $radius-pill;
  background: $key-900;
  color: $text-on-dark;
  font-family: $font-mono;
  font-size: $admin-text-sm;
  font-weight: $weight-medium;
  text-align: center;

  &.zero {
    background: $surface-sunken;
    color: $text-muted;
  }

  &.hot {
    background: $magenta;
    color: $paper-white;
  }
}

.chevron {
  color: $key-200;
  font-size: $admin-text-xs;
  transition: transform $duration-base $ease-out, color $duration-base $ease-out;
}

.see-all {
  @include row($space-2);
  flex: none;
  padding: 6px 12px;
  border-radius: $radius-pill;
  color: $cyan-deep;
  font-size: $admin-text-sm;
  font-weight: $weight-semibold;
  @include focus-ring;

  &:hover {
    background: $cyan-wash;
  }
}

.timeline {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    @include row($space-3);
    padding: $space-4 $space-5;
    border-bottom: 1px solid $border-subtle;

    &:last-child {
      border-bottom: 0;
    }
  }
}

.source-icon {
  display: flex;
  width: 40px;
  height: 40px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  font-size: $admin-text-md;

  &.whatsapp {
    background: rgba($whatsapp, 0.14);
    color: #0d7a3c;
  }

  &.payphone {
    background: $cyan-wash;
    color: $cyan-deep;
  }

  &.transfer {
    background: $yellow-wash;
    color: $yellow-deep;
  }
}

.entry-copy {
  @include stack(2px);
  min-width: 0;
  flex: 1;

  strong {
    @include truncate;
    color: $text-strong;
    font-size: $admin-text-base;
    font-weight: $weight-semibold;
  }

  span {
    color: $text-body;
    font-size: $admin-text-sm;
  }

  small {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

.entry-amount {
  @include stack(6px);
  flex: none;
  align-items: flex-end;

  strong {
    @include mono-data($text-strong, $admin-text-md);
    font-weight: $weight-medium;
  }
}

.state {
  padding: $space-10 $space-5;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.empty {
  @include empty-state;
}

@include from($bp-lg) {
  .panels {
    flex-direction: row;
    align-items: flex-start;
  }

  .attention {
    width: 380px;
    flex: none;
  }

  .activity {
    flex: 1;
    min-width: 0;
  }
}
</style>
