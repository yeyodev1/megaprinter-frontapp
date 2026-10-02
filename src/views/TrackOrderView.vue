<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import { trackOrderByToken, trackOrders, type OrderStatus, type TrackedOrder } from '@/services/orders'
import { errorMessage } from '@/services/http'
import { whatsappLink } from '@/config/brand'

/**
 * Seguimiento del pedido. El cliente busca con su código (MP-00012) o su
 * correo; desde el correo llega directo con /pedido/:token. No se muestran
 * correo, teléfono ni dirección.
 */

const route = useRoute()
const router = useRouter()

const query = ref('')
const searching = ref(false)
const error = ref('')
const results = ref<TrackedOrder[] | null>(null)
const order = ref<TrackedOrder | null>(null)

const money = (value: number) => `$${value.toFixed(2)}`
const date = (value?: string) => (value ? new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : '')

const STEPS: Array<{ status: OrderStatus; label: string; icon: string }> = [
  { status: 'paid', label: 'Pago confirmado', icon: 'fa-solid fa-circle-check' },
  { status: 'processing', label: 'En preparación', icon: 'fa-solid fa-box-open' },
  { status: 'shipped', label: 'Enviado', icon: 'fa-solid fa-truck-fast' },
  { status: 'delivered', label: 'Entregado', icon: 'fa-solid fa-house-circle-check' },
]

const STATUS_TEXT: Record<string, string> = {
  pending: 'Esperando el pago',
  whatsapp: 'Un asesor te contactará',
  paid: 'Pago confirmado',
  processing: 'En preparación',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusText = (item: TrackedOrder) => {
  if (item.status === 'pending' && item.source === 'transfer') {
    if (item.transferStatus === 'in_review') return 'Comprobante en revisión'
    if (item.transferStatus === 'rejected') return 'Comprobante no válido: sube otro'
    return 'Esperando la transferencia'
  }
  return STATUS_TEXT[item.status] ?? item.status
}

const stepIndex = computed(() => (order.value ? STEPS.findIndex((step) => step.status === order.value!.status) : -1))
const reachedAt = (status: OrderStatus) => order.value?.statusHistory.filter((entry) => entry.status === status).at(-1)?.at
const needsPayment = computed(() => order.value?.status === 'pending')
const supportLink = computed(() => whatsappLink(`Hola Megaprinter, consulto por mi pedido ${order.value?.orderNumber ?? ''}`))

const open = async (token: string) => {
  searching.value = true
  error.value = ''
  try {
    order.value = await trackOrderByToken(token)
  } catch (caught) {
    order.value = null
    error.value = errorMessage(caught, 'No encontramos este pedido.')
  } finally {
    searching.value = false
  }
}

const search = async () => {
  const value = query.value.trim()
  if (!value) return
  searching.value = true
  error.value = ''
  order.value = null
  try {
    const found = await trackOrders(value)
    results.value = found
    const only = found.length === 1 ? found[0] : null
    if (only) await router.push({ name: 'TrackOrder', params: { token: only.token } })
    else if (!found.length) error.value = 'No encontramos pedidos con ese código o correo. Revisa que esté bien escrito.'
  } catch (caught) {
    error.value = errorMessage(caught, 'No pudimos buscar tu pedido.')
  } finally {
    searching.value = false
  }
}

watch(
  () => route.params.token,
  (token) => {
    if (typeof token === 'string' && token) void open(token)
    else order.value = null
  },
)

onMounted(() => {
  const token = route.params.token
  if (typeof token === 'string' && token) void open(token)
})
</script>

<template>
  <main class="track-page">
    <section class="card">
      <header class="card-head">
        <router-link to="/" aria-label="Inicio"><BrandMark size="sm" /></router-link>
        <p class="eyebrow">Seguimiento de pedido</p>
      </header>

      <template v-if="!order">
        <h1>¿Dónde está mi pedido?</h1>
        <p class="lead">Escribe tu código de pedido (por ejemplo <strong>MP-00012</strong>) o el correo con el que compraste.</p>
        <form class="search" @submit.prevent="search">
          <label class="visually-hidden" for="track-query">Código o correo</label>
          <input id="track-query" v-model="query" autocomplete="email" placeholder="MP-00012 o tu@correo.com" required />
          <button type="submit" :disabled="searching">
            <i :class="searching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'" aria-hidden="true"></i>
            Buscar
          </button>
        </form>
        <p v-if="error" class="notice error" role="alert"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}</p>

        <ul v-if="results && results.length > 1" class="results">
          <li v-for="item in results" :key="item.token">
            <router-link :to="{ name: 'TrackOrder', params: { token: item.token } }">
              <strong>{{ item.orderNumber }}</strong>
              <span>{{ date(item.createdAt) }} · {{ money(item.totalAmount) }}</span>
              <em>{{ statusText(item) }}</em>
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </router-link>
          </li>
        </ul>
      </template>

      <template v-else>
        <button type="button" class="back" @click="router.push({ name: 'TrackOrder' })">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Buscar otro pedido
        </button>
        <h1>Pedido {{ order.orderNumber }}</h1>
        <p class="lead">Hola {{ order.customerName }}, tu pedido está: <strong>{{ statusText(order) }}</strong></p>

        <ol v-if="order.status !== 'cancelled' && order.status !== 'whatsapp'" class="steps" aria-label="Avance del pedido">
          <li v-for="(step, index) in STEPS" :key="step.status" :class="{ done: index < stepIndex, current: index === stepIndex }">
            <span class="dot"><i :class="step.icon" aria-hidden="true"></i></span>
            <span class="copy">
              <strong>{{ step.label }}</strong>
              <small v-if="reachedAt(step.status)">{{ date(reachedAt(step.status)) }}</small>
            </span>
          </li>
        </ol>

        <section v-if="order.shipping" class="shipping" aria-label="Envío">
          <p class="section-title"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i> Datos del envío</p>
          <p v-if="order.shipping.carrier">Transportista: <strong>{{ order.shipping.carrier }}</strong></p>
          <p v-if="order.shipping.trackingNumber">N.º de guía: <strong class="mono">{{ order.shipping.trackingNumber }}</strong></p>
          <a v-if="order.shipping.guideUrl" :href="order.shipping.guideUrl" target="_blank" rel="noopener" class="ghost">
            <i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i> Descargar guía
          </a>
        </section>

        <router-link v-if="needsPayment" :to="{ name: 'PayOrder', params: { token: order.token } }" class="primary">
          <i class="fa-solid fa-lock" aria-hidden="true"></i>
          {{ order.source === 'transfer' ? 'Ver cuenta y subir comprobante' : `Pagar ${money(order.totalAmount)}` }}
        </router-link>

        <section class="summary" aria-label="Productos">
          <div v-for="item in order.items" :key="item.name" class="line">
            <span>{{ item.quantity }} × {{ item.name }}</span>
            <span class="mono">{{ money(item.price * item.quantity) }}</span>
          </div>
          <div class="line total">
            <span>Total</span>
            <span class="mono">{{ money(order.totalAmount) }}</span>
          </div>
        </section>

        <a :href="supportLink" target="_blank" rel="noopener" class="ghost">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Preguntar por WhatsApp
        </a>
      </template>

      <p v-if="searching && !order && route.params.token" class="state">Cargando tu pedido…</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.track-page {
  display: flex;
  min-height: 100vh;
  justify-content: center;
  padding: $space-6 $space-4;
  background: $surface-page;
}

.card {
  @include stack($space-5);
  width: 100%;
  max-width: 560px;
  align-self: flex-start;
  padding: $space-6 $space-5;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.card-head {
  @include row($space-3);
  flex-wrap: wrap;
  justify-content: space-between;
}

.eyebrow {
  @include eyebrow;
}

h1 {
  font-size: $text-title;
}

.lead {
  @include body-text($text-body, $text-body-md);
}

.search {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  input {
    @include input-base;
    flex: 1 1 220px;
    min-width: 0;
  }

  button {
    @include button-primary;
    flex: 0 0 auto;
  }
}

.notice.error {
  @include row($space-2, flex-start);
  padding: $space-3;
  border: 1px solid rgba($danger, 0.35);
  border-radius: $radius-sm;
  background: $danger-wash;
  color: $danger;
  font-size: $text-caption;
}

.results {
  @include stack($space-2);

  a {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-1 $space-3;
    padding: $space-3 $space-4;
    border: 1px solid $border-strong;
    border-radius: $radius-md;
    color: $text-strong;
    @include focus-ring;

    &:hover {
      border-color: $cyan;
      background: $brand-100;
    }

    span {
      color: $text-muted;
      font-size: $text-caption;
    }

    em {
      flex: 1;
      font-size: $text-caption;
      font-style: normal;
      text-align: right;
    }
  }
}

.back {
  @include button-ghost;
  align-self: flex-start;
  padding: $space-1 0;
}

.steps {
  @include stack($space-3);

  li {
    @include row($space-3);
    opacity: 0.5;
  }

  .done,
  .current {
    opacity: 1;
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
    font-size: $text-caption;
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
  }

  .copy {
    @include stack(2px);

    strong {
      font-size: $text-body-sm;
    }

    small {
      color: $text-muted;
      font-size: $text-eyebrow;
    }
  }
}

.shipping {
  @include stack($space-2);
  padding: $space-4;
  border: 1px solid $cyan-mist;
  border-radius: $radius-md;
  background: $cyan-wash;
  font-size: $text-body-sm;
}

.section-title {
  @include row($space-2);
  font-weight: $weight-semibold;
}

.mono {
  @include mono-data($text-strong, $text-body-sm);
}

.summary {
  display: flex;
  flex-direction: column;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
}

.line {
  display: flex;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-top: 1px solid $border-subtle;
  font-size: $text-body-sm;

  &:first-child {
    border-top: 0;
  }

  &.total {
    background: $surface-sunken;
    font-weight: $weight-semibold;
  }
}

.primary {
  @include button-primary;
  justify-content: center;
  min-height: 48px;
}

.ghost {
  @include button-ghost;
  align-self: center;
}

.state {
  color: $text-muted;
  text-align: center;
}

@include from($bp-sm) {
  .track-page {
    padding: $space-12 $space-6;
  }

  .card {
    padding: $space-8;
  }
}
</style>
