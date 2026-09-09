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
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatMoney } from '@/components/admin/orderHelpers'

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

const STATUS_VALUES = ORDER_STATUSES.map((meta) => meta.value as string)

const statusOptions = computed(() => [
  { value: 'all', label: 'Todos los estados', icon: 'fa-solid fa-layer-group' },
  ...ORDER_STATUSES.map((meta) => ({ value: meta.value, label: meta.label, icon: meta.icon })),
])

const sourceOptions = [
  { value: 'all', label: 'Todos los orígenes', icon: 'fa-solid fa-layer-group' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'fa-brands fa-whatsapp' },
  { value: 'payphone', label: 'Payphone', icon: 'fa-solid fa-credit-card' },
]

const countByStatus = computed(() => {
  const counts: Record<string, number> = {}
  for (const order of orders.value) counts[order.status] = (counts[order.status] ?? 0) + 1
  return counts
})

const filtered = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return orders.value.filter((order) => {
    if (statusFilter.value !== 'all' && order.status !== statusFilter.value) return false
    if (sourceFilter.value !== 'all' && order.source !== sourceFilter.value) return false
    if (!query) return true
    const haystack = [
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order._id,
      ...order.items.map((item) => item.name),
    ]
      .join(' ')
      .toLocaleLowerCase()
    return query.split(/\s+/).every((term) => haystack.includes(term))
  })
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
    flash(`Pedido de ${order.customerName} ahora está en «${to}».`)
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

onMounted(() => {
  const status = route.query.status
  const source = route.query.source
  if (typeof status === 'string' && STATUS_VALUES.includes(status)) statusFilter.value = status
  if (source === 'whatsapp' || source === 'payphone') sourceFilter.value = source
  load()
})
</script>

<template>
  <div class="orders-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-receipt" aria-hidden="true"></i> Gestión comercial</p>
        <h1>Pedidos y<br /><em>conversaciones.</em></h1>
        <p>Revisa cada solicitud, cambia su estado y contacta al cliente desde un solo lugar.</p>
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

    <section class="status-strip" data-admin-reveal aria-label="Pedidos por estado">
      <button
        v-for="meta in ORDER_STATUSES"
        :key="meta.value"
        type="button"
        class="status-chip"
        :class="[meta.value, { active: statusFilter === meta.value }]"
        :aria-pressed="statusFilter === meta.value"
        @click="toggleStatus(meta.value)"
      >
        <i :class="meta.icon" aria-hidden="true"></i>
        <span class="chip-copy">
          <strong>{{ countByStatus[meta.value] ?? 0 }}</strong>
          <small>{{ meta.label }}</small>
        </span>
      </button>
    </section>

    <section class="board" data-admin-reveal>
      <div class="toolbar">
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <span class="visually-hidden">Buscar pedido</span>
          <input v-model="search" type="search" placeholder="Cliente, correo, teléfono, producto o referencia" />
        </label>
        <div class="filter">
          <AppSelect v-model="statusFilter" :options="statusOptions" size="sm" aria-label="Filtrar por estado" />
        </div>
        <div class="filter">
          <AppSelect v-model="sourceFilter" :options="sourceOptions" size="sm" aria-label="Filtrar por origen" />
        </div>
        <span class="count">{{ filtered.length }} de {{ orders.length }}</span>
      </div>

      <p v-if="loading" class="state">Cargando pedidos…</p>

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

.status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.status-chip {
  @include row($space-3);
  flex: 1 1 140px;
  padding: $space-3 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  color: $text-body;
  text-align: left;
  cursor: pointer;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out;
  @include focus-ring;

  > i {
    display: flex;
    width: 32px;
    height: 32px;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: $radius-sm;
    background: $surface-sunken;
    font-size: $text-caption;
  }

  &.paid > i {
    background: $success-100;
    color: $success-500;
  }

  &.processing > i {
    background: $brand-100;
    color: $brand-700;
  }

  &.delivered > i {
    background: $key-900;
    color: $text-on-dark;
  }

  &.cancelled > i {
    background: $danger-100;
    color: $danger-500;
  }

  &.whatsapp > i {
    background: $accent-100;
    color: $accent-600;
  }

  &.pending > i {
    background: $warning-100;
    color: $warning-500;
  }

  &:hover {
    border-color: $cyan;
  }

  &.active {
    border-color: $cyan;
    box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.18);
  }
}

.chip-copy {
  @include stack(0);
  min-width: 0;

  strong {
    font-size: 1.25rem;
    font-weight: $weight-black;
    line-height: 1.1;
    letter-spacing: $tracking-display;
    color: $text-strong;
  }

  small {
    @include truncate;
    font-size: $text-eyebrow;
  }
}

.board {
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.toolbar {
  @include admin-toolbar;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-subtle;
}

.search {
  @include admin-search;
  flex: 1 1 100%;
}

.filter {
  flex: 1 1 160px;
}

.count {
  @include mono-data($text-muted, $text-eyebrow);
  margin-left: auto;
}

.order-list {
  display: flex;
  flex-direction: column;
}

.state {
  padding: $space-12;
  color: $text-muted;
  text-align: center;
}

.empty {
  @include empty-state;
}

@include from($bp-md) {
  .toolbar {
    padding: $space-5 $space-6;
  }

  .search {
    flex: 1 1 280px;
  }

  .filter {
    flex: 0 1 200px;
  }
}
</style>
