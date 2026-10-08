<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppSelect from '@/components/ui/AppSelect.vue'
import OrderCard from '@/components/admin/OrderCard.vue'
import OrderDetailModal from '@/components/admin/OrderDetailModal.vue'
import {
  listOrders,
  ORDER_STATUSES,
  orderStatusMeta,
  reviewTransfer,
  updateOrderStatus,
  updateShipping,
  type Order,
  type OrderStatus,
} from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatMoney, needsTransferReview, orderCode } from '@/components/admin/orderHelpers'

useAdminEntrance()

const route = useRoute()
const dialog = useDialogStore()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const notice = ref('')
const busyId = ref('')
const selected = ref<Order | null>(null)

const search = ref('')
const statusFilter = ref<string>('all')
const sourceFilter = ref<string>('all')
const reviewOnly = ref(false)

const STATUS_VALUES = ORDER_STATUSES.map((meta) => meta.value as string)

const sourceOptions = [
  { value: 'all', label: 'Todos los orígenes', icon: 'fa-solid fa-layer-group' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  { value: 'payphone', label: 'Payphone', icon: 'fa-solid fa-credit-card' },
  { value: 'transfer', label: 'Transferencia', icon: 'fa-solid fa-building-columns' },
  { value: 'bot', label: 'Bot de WhatsApp', icon: 'fa-solid fa-robot' },
]

const SOURCE_VALUES = sourceOptions.map((option) => option.value)

const reviewCount = computed(() => orders.value.filter(needsTransferReview).length)
// Pagados que todavía no se preparan: el equipo tiene que moverlos.
const toPrepareCount = computed(() => orders.value.filter((order) => order.status === 'paid').length)

const PAID: string[] = ['paid', 'processing', 'shipped', 'delivered']
const openCount = computed(() => orders.value.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length)
// Lo cobrado en el mes en curso (pedidos con pago confirmado).
const monthSales = computed(() => {
  const now = new Date()
  return orders.value
    .filter((order) => PAID.includes(order.status))
    .filter((order) => {
      const created = new Date(order.createdAt)
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
    })
    .reduce((sum, order) => sum + order.totalAmount, 0)
})

const countByStatus = computed(() => {
  const counts: Record<string, number> = {}
  for (const order of orders.value) counts[order.status] = (counts[order.status] ?? 0) + 1
  return counts
})

const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return orders.value.filter((order) => {
    if (reviewOnly.value && !needsTransferReview(order)) return false
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) return false
    if (sourceFilter.value === 'bot' && order.channel !== 'whatsapp_bot') return false
    if (!['all', 'bot'].includes(sourceFilter.value) && order.source !== sourceFilter.value) return false
    if (!query) return true
    const haystack = [
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order._id,
      orderCode(order),
      ...order.items.map((item) => item.name),
    ]
      .join(' ')
      .toLocaleLowerCase()
    return query.split(/\s+/).every((term) => haystack.includes(term))
  })
    // Lo más reciente arriba.
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

const toggleStatus = (status: string) => {
  statusFilter.value = statusFilter.value === status ? 'all' : status
}

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

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

const changeStatus = async (order: Order, status: OrderStatus) => {
  if (order.status === status) return
  const from = orderStatusMeta(order.status).label
  const to = orderStatusMeta(status).label

  const confirmed = await dialog.confirm({
    title: '¿Cambiar estado del pedido?',
    message: `Pasará de «${from}» a «${to}».`,
    detail: `${order.customerName} · ${formatMoney(order.totalAmount)}`,
    confirmLabel: 'Cambiar estado',
    tone: status === 'cancelled' ? 'danger' : 'default',
    icon: orderStatusMeta(status).icon,
  })
  if (!confirmed) return

  busyId.value = order._id
  try {
    const updated = await updateOrderStatus(order._id, status)
    orders.value = orders.value.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    if (selected.value?._id === updated._id) selected.value = { ...selected.value, ...updated }
    flash(`Pedido de ${order.customerName} ahora está en «${to}». Le enviamos un correo con la novedad.`)
  } catch (caught) {
    await dialog.notify({
      title: 'No se pudo cambiar el estado',
      message: errorMessage(caught, 'Intenta nuevamente en unos segundos.'),
      tone: 'danger',
    })
  } finally {
    busyId.value = ''
  }
}

const applyReview = async (order: Order, decision: 'approve' | 'reject', note: string) => {
  const approve = decision === 'approve'
  const confirmed = await dialog.confirm({
    title: approve ? '¿Aprobar la transferencia?' : '¿Rechazar el comprobante?',
    message: approve
      ? 'El pedido pasará a «Pagado». Confírmalo solo si ya viste el dinero en la cuenta.'
      : 'El pedido sigue pendiente y el cliente puede enviar otro comprobante.',
    detail: `${orderCode(order)} · ${order.customerName} · ${formatMoney(order.totalAmount)}`,
    confirmLabel: approve ? 'Aprobar pago' : 'Rechazar',
    tone: approve ? 'success' : 'danger',
    icon: approve ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark',
  })
  if (!confirmed) return

  busyId.value = order._id
  try {
    const updated = await reviewTransfer(order._id, decision, note)
    orders.value = orders.value.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    if (selected.value?._id === updated._id) selected.value = { ...selected.value, ...updated }
    flash(approve ? `Pago de ${order.customerName} aprobado: el pedido está «Pagado».` : `Comprobante de ${order.customerName} rechazado.`)
  } catch (caught) {
    await dialog.notify({
      title: 'No se pudo guardar la revisión',
      message: errorMessage(caught, 'Intenta nuevamente en unos segundos.'),
      tone: 'danger',
    })
  } finally {
    busyId.value = ''
  }
}

const saveShipping = async (order: Order, data: { carrier: string; trackingNumber: string; file: File | null }) => {
  busyId.value = order._id
  try {
    const updated = await updateShipping(order._id, data)
    orders.value = orders.value.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
    if (selected.value?._id === updated._id) selected.value = { ...selected.value, ...updated }
    flash(`Guía guardada: el pedido de ${order.customerName} está «Enviado» y le llegó la guía por correo.`)
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar la guía', message: errorMessage(caught, 'Intenta nuevamente.'), tone: 'danger' })
  } finally {
    busyId.value = ''
  }
}

onMounted(() => {
  const status = route.query.status
  const source = route.query.source
  if (typeof status === 'string' && STATUS_VALUES.includes(status)) statusFilter.value = status
  if (typeof source === 'string' && SOURCE_VALUES.includes(source)) sourceFilter.value = source
  if (route.query.transfer === 'in_review') reviewOnly.value = true
  if (typeof route.query.search === 'string') search.value = route.query.search
  load()
})
</script>

<template>
  <div class="orders-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-receipt" aria-hidden="true"></i> Gestión comercial</p>
        <h1>Pedidos y <em>clientes</em></h1>
        <p>Revisa cada pedido, cambia su estado y escribe al cliente desde aquí.</p>
      </div>
      <button class="refresh" type="button" :disabled="loading" @click="load">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
        Actualizar
      </button>
    </header>

    <p v-if="error" class="notice error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
    </p>
    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <section class="kpis" data-admin-reveal aria-label="Resumen de pedidos">
      <button
        type="button"
        class="kpi warn"
        :class="{ active: reviewOnly, idle: !reviewCount }"
        :aria-pressed="reviewOnly"
        @click="reviewOnly = !reviewOnly"
      >
        <span class="kpi-icon"><i class="fa-solid fa-magnifying-glass-dollar" aria-hidden="true"></i></span>
        <span class="kpi-copy">
          <strong>{{ reviewCount }}</strong>
          <span>{{ reviewOnly ? 'Viendo comprobantes · quitar filtro' : 'Comprobantes por revisar' }}</span>
        </span>
      </button>
      <button
        type="button"
        class="kpi ok"
        :class="{ active: statusFilter === 'paid', idle: !toPrepareCount }"
        :aria-pressed="statusFilter === 'paid'"
        @click="toggleStatus('paid')"
      >
        <span class="kpi-icon"><i class="fa-solid fa-box-open" aria-hidden="true"></i></span>
        <span class="kpi-copy">
          <strong>{{ toPrepareCount }}</strong>
          <span>Pagados por preparar</span>
        </span>
      </button>
      <div class="kpi">
        <span class="kpi-icon"><i class="fa-solid fa-receipt" aria-hidden="true"></i></span>
        <span class="kpi-copy">
          <strong>{{ openCount }}</strong>
          <span>Pedidos abiertos</span>
        </span>
      </div>
      <div class="kpi">
        <span class="kpi-icon"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i></span>
        <span class="kpi-copy">
          <strong>{{ formatMoney(monthSales) }}</strong>
          <span>Cobrado este mes</span>
        </span>
      </div>
    </section>

    <section class="status-strip" data-admin-reveal aria-label="Pedidos por estado">
      <button type="button" class="pill" :class="{ active: statusFilter === 'all' }" :aria-pressed="statusFilter === 'all'" @click="statusFilter = 'all'">
        Todos <strong>{{ orders.length }}</strong>
      </button>
      <button
        v-for="meta in ORDER_STATUSES"
        :key="meta.value"
        type="button"
        class="pill"
        :class="[meta.value, { active: statusFilter === meta.value }]"
        :aria-pressed="statusFilter === meta.value"
        @click="toggleStatus(meta.value)"
      >
        <i :class="meta.icon" aria-hidden="true"></i>
        {{ meta.label }}
        <strong>{{ countByStatus[meta.value] ?? 0 }}</strong>
      </button>
    </section>

    <section class="board" data-admin-reveal>
      <div class="toolbar">
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <span class="visually-hidden">Buscar pedido</span>
          <input v-model="search" type="search" placeholder="Cliente, correo, teléfono, producto o N.º de pedido" />
        </label>
        <div class="filter">
          <AppSelect v-model="sourceFilter" :options="sourceOptions" size="sm" aria-label="Filtrar por origen" />
        </div>
        <span class="count">{{ filtered.length }} de {{ orders.length }} pedidos</span>
      </div>

      <p v-if="loading" class="state"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Cargando pedidos…</p>

      <div v-else-if="filtered.length" class="order-list">
        <OrderCard
          v-for="order in filtered"
          :key="order._id"
          :order="order"
          :busy="busyId === order._id"
          @open="selected = $event"
          @change-status="changeStatus"
        />
      </div>

      <div v-else class="empty">
        <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>
        <h3>No hay resultados</h3>
        <p>Prueba con otro filtro o espera nuevas solicitudes.</p>
      </div>
    </section>

    <OrderDetailModal
      :order="selected"
      :busy="!!selected && busyId === selected._id"
      @close="selected = null"
      @change-status="changeStatus"
      @review-transfer="applyReview"
      @save-shipping="saveShipping"
    />
  </div>
</template>

<style scoped lang="scss">
.orders-page {
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

.kpis {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.kpi {
  @include row($space-3);
  flex: 1 1 150px;
  min-width: 0;
  padding: $space-3 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-xs;
  color: $text-strong;
  font: inherit;
  text-align: left;
}

button.kpi {
  cursor: pointer;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out, transform $duration-base $ease-out;
  @include focus-ring;

  @media (hover: hover) {
    &:hover {
      box-shadow: $shadow-md;
      transform: translateY(-1px);
    }
  }
}

// En el celular el icono se oculta: dos tarjetas por fila sin apretar el número.
.kpi-icon {
  display: none;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $surface-sunken;
  color: $text-body;
  font-size: 1.05rem;
}

.kpi-copy {
  @include stack(2px);
  min-width: 0;

  strong {
    font-family: $font-display;
    font-size: 1.4rem;
    font-weight: $weight-black;
    line-height: 1.1;
    letter-spacing: $tracking-display;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: $text-body;
    font-size: $admin-text-sm;
  }
}

.kpi.warn {
  border-color: rgba($yellow-deep, 0.35);
  background: $yellow-wash;

  .kpi-icon {
    background: rgba($yellow, 0.35);
    color: $yellow-deep;
  }

  strong {
    color: $yellow-deep;
  }

  &.active {
    border-color: $yellow-deep;
    box-shadow: 0 0 0 3px rgba($yellow-deep, 0.2);
  }
}

.kpi.ok {
  border-color: rgba($ok, 0.3);
  background: $ok-wash;

  .kpi-icon {
    background: rgba($ok, 0.14);
    color: $ok;
  }

  strong {
    color: $ok;
  }

  &.active {
    border-color: $ok;
    box-shadow: 0 0 0 3px rgba($ok, 0.18);
  }
}

// Sin nada pendiente, la tarjeta de acción se apaga para no llamar la atención.
.kpi.idle:not(.active) {
  border-color: $border-subtle;
  background: $surface-card;

  .kpi-icon {
    background: $surface-sunken;
    color: $text-muted;
  }

  strong {
    color: $text-strong;
  }
}

// Pastillas por estado: en el celular se deslizan de lado sin mover la página.
.status-strip {
  display: flex;
  gap: $space-2;
  overflow-x: auto;
  margin-inline: calc(-1 * #{$space-4});
  padding: 2px $space-4 $space-1;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.pill {
  @include admin-pill;
  flex: none;

  > i {
    font-size: $admin-text-xs;
  }

  &.paid > i {
    color: $ok;
  }

  &.pending > i {
    color: $yellow-deep;
  }

  &.whatsapp > i {
    color: $magenta;
  }

  &.processing > i,
  &.shipped > i {
    color: $cyan-deep;
  }

  &.cancelled > i {
    color: $danger;
  }

  &.active > i {
    color: inherit;
  }
}

.board {
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-xs;
}

.toolbar {
  @include admin-toolbar;
  gap: $space-3;
  padding: $space-4;
  border-bottom: 1px solid $border-subtle;
  background: $surface-card;
}

.search {
  @include admin-search;
  flex: 1 1 100%;
}

.filter {
  flex: 1 1 200px;
}

.count {
  color: $text-muted;
  font-size: $admin-text-sm;
  margin-left: auto;
  white-space: nowrap;
}

.order-list {
  display: flex;
  flex-direction: column;
}

.state {
  @include row($space-2);
  justify-content: center;
  padding: $space-12;
  color: $text-muted;
  font-size: $admin-text-md;
}

.empty {
  @include empty-state;
}

@include from($bp-md) {
  .kpi {
    flex-basis: 200px;
    padding: $space-4 $space-5;
  }

  .kpi-icon {
    display: flex;
  }

  .kpi-copy strong {
    font-size: 1.6rem;
  }

  .toolbar {
    padding: $space-4 $space-5;
  }

  .search {
    flex: 1 1 320px;
  }

  .filter {
    flex: 0 1 230px;
  }

  .status-strip {
    flex-wrap: wrap;
    overflow: visible;
    margin-inline: 0;
    padding-inline: 0;
  }
}
</style>
