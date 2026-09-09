<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import OrderStatusBadge from '@/components/admin/OrderStatusBadge.vue'
import { listOrders, type Order } from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate, formatMoney, sourceIcon } from '@/components/admin/orderHelpers'

useAdminEntrance()
const router = useRouter()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')

const whatsappPending = computed(() => orders.value.filter((o) => o.status === 'whatsapp').length)
const paymentPending = computed(() => orders.value.filter((o) => o.status === 'pending').length)
const inProgress = computed(() =>
  orders.value.filter((o) => o.status === 'paid' || o.status === 'processing').length,
)
const paidOrders = computed(() => orders.value.filter((o) => o.status === 'paid' || o.status === 'processing' || o.status === 'delivered'))
const revenue = computed(() => paidOrders.value.reduce((sum, o) => sum + o.totalAmount, 0))
const recent = computed(() => orders.value.slice(0, 6))
const attention = computed(() => whatsappPending.value + paymentPending.value)

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
        <h1>Todo bajo<br /><em>control.</em></h1>
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

    <section class="metrics" data-admin-reveal>
      <article>
        <div class="metric-icon blue"><i class="fa-solid fa-inbox" aria-hidden="true"></i></div>
        <div><span>Total de pedidos</span><strong>{{ orders.length }}</strong><small>Últimos registros</small></div>
      </article>
      <article>
        <div class="metric-icon green"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></div>
        <div><span>Por contactar</span><strong>{{ whatsappPending }}</strong><small>Solicitudes por WhatsApp</small></div>
      </article>
      <article>
        <div class="metric-icon brand"><i class="fa-solid fa-box-open" aria-hidden="true"></i></div>
        <div><span>En curso</span><strong>{{ inProgress }}</strong><small>Pagados o en preparación</small></div>
      </article>
      <article>
        <div class="metric-icon amber"><i class="fa-solid fa-sack-dollar" aria-hidden="true"></i></div>
        <div><span>Ingresos</span><strong>{{ formatMoney(revenue) }}</strong><small>Pedidos pagados</small></div>
      </article>
    </section>

    <div class="panels">
      <section class="attention" data-admin-reveal>
        <div class="attention-head">
          <span class="attention-icon"><i class="fa-solid fa-bell" aria-hidden="true"></i></span>
          <div>
            <p class="eyebrow light">Pedidos por atender</p>
            <h2>{{ attention }} {{ attention === 1 ? 'pedido espera' : 'pedidos esperan' }} respuesta</h2>
          </div>
        </div>

        <ul class="attention-list">
          <li>
            <span><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Solicitudes por WhatsApp</span>
            <strong>{{ whatsappPending }}</strong>
          </li>
          <li>
            <span><i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> Pagos sin confirmar</span>
            <strong>{{ paymentPending }}</strong>
          </li>
        </ul>

        <div class="attention-actions">
          <button type="button" @click="goToOrders({ status: 'whatsapp' })">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Atender WhatsApp
          </button>
          <button type="button" class="ghost" @click="goToOrders({ status: 'pending' })">
            <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i> Revisar pagos
          </button>
        </div>
      </section>

      <section class="activity" data-admin-reveal>
        <header>
          <div>
            <p class="eyebrow"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> Actividad</p>
            <h2>Lo más reciente</h2>
          </div>
          <router-link :to="{ name: 'AdminOrders' }">
            Ver todos <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
        </header>

        <div v-if="loading" class="state">Cargando actividad…</div>

        <div v-else-if="recent.length" class="timeline">
          <article v-for="order in recent" :key="order._id">
            <div class="source-icon" :class="order.source">
              <i :class="sourceIcon(order.source)" aria-hidden="true"></i>
            </div>
            <div class="entry-copy">
              <strong>{{ order.customerName }}</strong>
              <span>{{ order.source === 'whatsapp' ? 'Solicitó contacto por WhatsApp' : 'Inició un pago con Payphone' }}</span>
              <small>{{ formatDate(order.createdAt) }}</small>
            </div>
            <div class="entry-amount">
              <strong>{{ formatMoney(order.totalAmount) }}</strong>
              <OrderStatusBadge :status="order.status" />
            </div>
          </article>
        </div>

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

  &.light {
    color: $brand-300;
  }
}

.refresh {
  @include admin-refresh-button;
}

.notice {
  @include admin-notice;
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
    background: rgba(0, 163, 224, 0.14);
    color: $brand-700;
  }

  &.amber {
    background: $warning-100;
    color: $warning-500;
  }
}

.panels {
  @include stack($space-5);
}

.attention {
  @include stack($space-5);
  padding: $space-6;
  border-radius: $radius-lg;
  background: $key-900;
  color: $text-on-dark;

  h2 {
    margin-top: $space-1;
    font-size: $text-heading;
  }
}

.attention-head {
  @include row($space-3, flex-start);
}

.attention-icon {
  display: flex;
  width: 42px;
  height: 42px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: rgba(0, 163, 224, 0.16);
  color: $brand-300;
}

.attention-list {
  @include stack($space-2);

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: $space-3 $space-4;
    border: 1px solid $border-on-dark;
    border-radius: $radius-sm;
    font-size: $text-body-sm;

    span {
      @include row($space-2);
      color: $text-on-dark-muted;
    }

    i {
      color: $brand-300;
    }

    strong {
      font-size: 1.1rem;
      font-weight: $weight-black;
    }
  }
}

.attention-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include button-primary;
    flex: 1;
  }

  .ghost {
    @include button-on-dark;
  }
}

.activity {
  @include admin-card;

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
}

.state {
  padding-block: $space-8;
  color: $text-muted;
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
    width: 340px;
    flex: none;
  }

  .activity {
    flex: 1;
    min-width: 0;
  }
}
</style>
