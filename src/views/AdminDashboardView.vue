<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { listOrders, ORDER_STATUS_LABEL, type Order } from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useAdminEntrance } from '@/composables/useAdminEntrance'

useAdminEntrance()
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')

const whatsappOrders = computed(() => orders.value.filter((o) => o.source === 'whatsapp').length)
const paidOrders = computed(() => orders.value.filter((o) => o.status === 'paid').length)
const revenue = computed(() =>
  orders.value.filter((o) => o.status === 'paid').reduce((sum, o) => sum + o.totalAmount, 0),
)
const recent = computed(() => orders.value.slice(0, 6))

const formatDate = (value: string) => new Date(value).toLocaleString('es-EC')
const statusLabel = (status: string) => ORDER_STATUS_LABEL[status] ?? status

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    orders.value = await listOrders()
  } catch (caught) {
    // Antes esta promesa se rechazaba sin manejar y el panel quedaba vacio sin
    // explicar por que.
    error.value = errorMessage(caught, 'No pudimos cargar los pedidos.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="dashboard">
    <AdminNav />

    <main id="contenido">
      <header class="page-header" data-admin-reveal>
        <div>
          <p class="eyebrow"><i class="fa-solid fa-wave-square" aria-hidden="true"></i> Centro de control</p>
          <h1>Todo bajo<br /><em>control.</em></h1>
          <p>Una lectura rápida de las conversaciones y órdenes que llegaron a Megaprinter.</p>
        </div>
        <button class="refresh" type="button" :disabled="loading" @click="load">
          <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
          Actualizar
        </button>
      </header>

      <p v-if="error" class="error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
      </p>

      <section class="metrics" data-admin-reveal>
        <article>
          <div class="metric-icon blue"><i class="fa-solid fa-inbox" aria-hidden="true"></i></div>
          <div><span>Total de solicitudes</span><strong>{{ orders.length }}</strong><small>Últimos registros</small></div>
        </article>
        <article>
          <div class="metric-icon green"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></div>
          <div><span>Contacto por WhatsApp</span><strong>{{ whatsappOrders }}</strong><small>Esperando al equipo</small></div>
        </article>
        <article>
          <div class="metric-icon brand"><i class="fa-solid fa-credit-card" aria-hidden="true"></i></div>
          <div><span>Pagos confirmados</span><strong>{{ paidOrders }}</strong><small>Payphone aprobado</small></div>
        </article>
        <article>
          <div class="metric-icon amber"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i></div>
          <div><span>Ingresos confirmados</span><strong>${{ revenue.toFixed(2) }}</strong><small>Solo pagos aprobados</small></div>
        </article>
      </section>

      <section class="activity" data-admin-reveal>
        <header>
          <div>
            <p class="eyebrow"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Actividad</p>
            <h2>Lo más reciente</h2>
          </div>
          <router-link to="/admin/orders">
            Ver todos <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </header>

        <div v-if="loading" class="state">Cargando actividad…</div>

        <div v-else-if="recent.length" class="timeline">
          <article v-for="order in recent" :key="order._id">
            <div class="source-icon" :class="order.source">
              <i :class="order.source === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-credit-card'" aria-hidden="true"></i>
            </div>
            <div class="entry-copy">
              <strong>{{ order.customerName }}</strong>
              <span>{{ order.source === 'whatsapp' ? 'Solicitó contacto por WhatsApp' : 'Inició un pago con Payphone' }}</span>
              <small>{{ formatDate(order.createdAt) }}</small>
            </div>
            <div class="entry-amount">
              <strong>${{ order.totalAmount.toFixed(2) }}</strong>
              <span class="status" :class="order.status">{{ statusLabel(order.status) }}</span>
            </div>
          </article>
        </div>

        <div v-else class="empty">
          <i class="fa-solid fa-chart-simple" aria-hidden="true"></i>
          <h3>Sin actividad por ahora</h3>
          <p>Las nuevas solicitudes aparecerán aquí automáticamente.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
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

.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;

  article {
    @include row($space-3);
    @include admin-card($space-5);
    flex: 1 1 220px;
    min-width: 0;
  }

  > article > div:last-child {
    @include stack(2px);
    flex: 1;
    min-width: 0;
  }

  span {
    color: $text-muted;
    font-size: $text-eyebrow;
    font-weight: $weight-bold;
  }

  strong {
    font-size: 1.75rem;
    font-weight: $weight-black;
    line-height: 1.1;
    letter-spacing: $tracking-display;
  }

  small {
    color: $text-muted;
    font-size: 0.6875rem;
  }
}

.metric-icon {
  display: flex;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  font-size: 1.1rem;

  &.blue {
    background: $brand-100;
    color: $brand-600;
  }

  &.green {
    background: $accent-100;
    color: $accent-600;
  }

  &.brand {
    background: rgba(32, 148, 210, 0.14);
    color: $brand-700;
  }

  &.amber {
    background: $warning-100;
    color: $warning-500;
  }
}

.activity {
  @include admin-card;
  margin-top: $space-6;

  > header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $space-4;
    margin-bottom: $space-5;

    h2 {
      margin-top: $space-2;
      font-size: $text-heading;
    }

    a {
      @include row($space-2);
      color: $brand-600;
      font-size: $text-caption;
      font-weight: $weight-bold;
      @include focus-ring;
    }
  }
}

.timeline {
  display: flex;
  flex-direction: column;

  article {
    @include row($space-3);
    padding-block: $space-4;
    border-top: 1px solid $border-subtle;
  }
}

.source-icon {
  display: flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;

  &.whatsapp {
    background: $accent-100;
    color: $accent-600;
  }

  &.payphone {
    background: $brand-100;
    color: $brand-600;
  }
}

.entry-copy {
  @include stack(3px);
  min-width: 0;
  flex: 1;

  strong {
    font-size: $text-body-sm;
  }

  span,
  small {
    color: $text-muted;
    font-size: $text-eyebrow;
  }
}

.entry-amount {
  @include stack($space-1);
  align-items: flex-end;

  strong {
    font-size: $text-body-sm;
  }

  .status {
    @include admin-status-badge;
  }
}

.state {
  padding-block: $space-8;
  color: $text-muted;
  text-align: center;
}

.empty {
  @include empty-state;
}
</style>
