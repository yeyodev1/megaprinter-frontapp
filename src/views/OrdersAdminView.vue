<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { listOrders, ORDER_STATUS_LABEL, type Order } from '@/services/orders'
import { errorMessage } from '@/services/http'

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const filter = ref<'all' | 'whatsapp' | 'payphone'>('all')

const filtered = computed(() =>
  filter.value === 'all' ? orders.value : orders.value.filter((o) => o.source === filter.value),
)
const whatsappCount = computed(() => orders.value.filter((o) => o.source === 'whatsapp').length)
const payphoneCount = computed(() => orders.value.filter((o) => o.source === 'payphone').length)

const statusLabel = (status: string) => ORDER_STATUS_LABEL[status] ?? status
const sourceLabel = (source: string) =>
  source === 'whatsapp' ? 'Solicitud por WhatsApp' : 'Pago con Payphone'
const formatDate = (value: string) => new Date(value).toLocaleString('es-EC')
const phoneLink = (phone: string) => `tel:${phone.replace(/\s/g, '')}`

const chatLink = (order: Order) => {
  // Numeros ecuatorianos locales (09...) necesitan el prefijo 593 y sin el cero.
  const digits = order.customerPhone.replace(/\D/g, '').replace(/^0/, '593')
  const text = `Hola ${order.customerName}, te escribimos desde Megaprinter sobre tu solicitud.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
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

onMounted(load)
</script>

<template>
  <div class="orders-page">
    <AdminNav />

    <main id="contenido">
      <header class="page-header">
        <div>
          <p class="eyebrow"><i class="fa-solid fa-receipt" aria-hidden="true"></i> Gestión comercial</p>
          <h1>Pedidos y<br /><em>conversaciones.</em></h1>
          <p>Revisa cada solicitud, pago y contacto que llega desde el sitio web.</p>
        </div>
        <button class="refresh" type="button" :disabled="loading" @click="load">
          <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
          Actualizar
        </button>
      </header>

      <p v-if="error" class="error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
      </p>

      <section class="board">
        <div class="board-top">
          <div class="filters">
            <button type="button" :class="{ active: filter === 'all' }" @click="filter = 'all'">
              <i class="fa-solid fa-layer-group" aria-hidden="true"></i> Todos <b>{{ orders.length }}</b>
            </button>
            <button type="button" :class="{ active: filter === 'whatsapp' }" @click="filter = 'whatsapp'">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> WhatsApp <b>{{ whatsappCount }}</b>
            </button>
            <button type="button" :class="{ active: filter === 'payphone' }" @click="filter = 'payphone'">
              <i class="fa-solid fa-credit-card" aria-hidden="true"></i> Payphone <b>{{ payphoneCount }}</b>
            </button>
          </div>
          <span class="count">{{ filtered.length }} resultados</span>
        </div>

        <p v-if="loading" class="state">Cargando pedidos…</p>

        <div v-else-if="filtered.length" class="order-list">
          <article v-for="order in filtered" :key="order._id" class="order-card">
            <div class="source" :class="order.source">
              <i :class="order.source === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-credit-card'" aria-hidden="true"></i>
            </div>

            <div class="customer">
              <div class="customer-top">
                <div>
                  <h2>{{ order.customerName }}</h2>
                  <span class="source-label">{{ sourceLabel(order.source) }}</span>
                </div>
                <span class="status" :class="order.status">{{ statusLabel(order.status) }}</span>
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

            <aside>
              <strong>${{ order.totalAmount.toFixed(2) }}</strong>
              <time>{{ formatDate(order.createdAt) }}</time>
              <a :href="chatLink(order)" target="_blank" rel="noopener">
                <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Abrir chat
              </a>
            </aside>
          </article>
        </div>

        <div v-else class="empty">
          <i class="fa-solid fa-filter-circle-xmark" aria-hidden="true"></i>
          <h3>No hay resultados</h3>
          <p>Prueba con otro filtro o espera nuevas solicitudes.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.orders-page {
  @include admin-shell;
}

.page-header {
  @include admin-header;
}

.eyebrow {
  @include admin-eyebrow;
}

.refresh {
  @include admin-refresh-button;
}

.error {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-5;
  padding: $space-3 $space-4;
  border: 1px solid $danger-500;
  border-radius: $radius-sm;
  background: $danger-100;
  color: $danger-500;
  font-size: $text-body-sm;
}

.board {
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.board-top {
  @include stack($space-3);
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-subtle;
}

.count {
  color: $text-muted;
  font-size: $text-eyebrow;
  font-weight: $weight-bold;
}

.filters {
  display: flex;
  gap: $space-2;
  overflow-x: auto;

  button {
    @include chip;
    white-space: nowrap;

    b {
      display: flex;
      min-width: 18px;
      height: 18px;
      align-items: center;
      justify-content: center;
      border-radius: $radius-pill;
      background: $surface-sunken;
      font-size: 0.625rem;
    }

    &.active {
      border-color: $brand-500;
      background: $brand-500;
      color: $white;

      b {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }
}

.order-list {
  display: flex;
  flex-direction: column;
}

.order-card {
  @include stack($space-4);
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

.customer {
  @include stack($space-3);
  flex: 1;
}

.customer-top {
  display: flex;
  justify-content: space-between;
  gap: $space-3;

  h2 {
    font-size: $text-subheading;
  }
}

.source-label {
  color: $brand-600;
  font-size: $text-eyebrow;
  font-weight: $weight-bold;
}

.status {
  @include admin-status-badge;
  height: max-content;
}

.contact {
  @include stack($space-2);
  color: $text-body;
  font-size: $text-caption;

  a,
  span {
    @include row($space-2);
    @include focus-ring;
  }

  a:hover {
    color: $brand-600;
  }

  i {
    width: 14px;
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

.order-card aside {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
  padding-top: $space-3;
  border-top: 1px solid $border-subtle;

  strong {
    font-size: 1.25rem;
    letter-spacing: $tracking-display;
  }

  time {
    color: $text-muted;
    font-size: 0.6875rem;
  }

  a {
    @include row($space-2);
    color: $accent-600;
    font-size: $text-eyebrow;
    font-weight: $weight-bold;
    @include focus-ring;
  }
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
  .board-top {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: $space-5 $space-6;
  }

  .order-card {
    flex-direction: row;
    align-items: flex-start;
    gap: $space-5;
    padding: $space-6;
  }

  .contact {
    flex-direction: row;
    flex-wrap: wrap;
    gap: $space-4;
  }

  .order-card aside {
    width: 160px;
    flex-direction: column;
    align-items: flex-end;
    padding: 0;
    border: 0;
    text-align: right;
  }
}
</style>
