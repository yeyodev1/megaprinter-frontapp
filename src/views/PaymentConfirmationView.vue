<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmPayphonePayment } from '@/services/orders'
import { errorMessage } from '@/services/http'
import { useCartStore } from '@/stores/cart'
import { whatsappLink } from '@/config/brand'
import BrandMark from '@/components/BrandMark.vue'

const route = useRoute()
const cartStore = useCartStore()

type Status = 'loading' | 'approved' | 'cancelled' | 'failed'

const status = ref<Status>('loading')
const details = ref('')
const clientTransactionId = String(route.query.clientTransactionId || '')

const supportLink = whatsappLink(
  `Hola Megaprinter, necesito ayuda con mi pago. Transacción: ${clientTransactionId || 'sin referencia'}.`,
)

const title = computed(
  () =>
    ({
      loading: 'Confirmando tu pago',
      approved: 'Pago confirmado',
      cancelled: 'Pago cancelado',
      failed: 'No pudimos confirmar el pago',
    })[status.value],
)

const message = computed(() => {
  if (status.value === 'loading') return 'Estamos validando la transacción con Payphone.'
  if (status.value === 'approved')
    return 'Tu transacción fue aprobada. Nuestro equipo recibirá la confirmación para continuar con tu pedido.'
  if (status.value === 'cancelled')
    return 'La transacción fue cancelada en Payphone. No se acreditó ningún cobro; puedes volver a intentarlo cuando quieras.'
  return details.value || 'Comunícate con nosotros por WhatsApp para revisar tu pedido.'
})

const iconClass = computed(
  () =>
    ({
      loading: 'fa-solid fa-spinner fa-spin',
      approved: 'fa-solid fa-circle-check',
      cancelled: 'fa-solid fa-circle-xmark',
      failed: 'fa-solid fa-triangle-exclamation',
    })[status.value],
)

onMounted(async () => {
  const id = route.query.id
  if (!id || !clientTransactionId) {
    status.value = 'failed'
    details.value = 'Payphone no devolvió los datos de la transacción.'
    return
  }

  try {
    const data = await confirmPayphonePayment(String(id), clientTransactionId)
    if (data.statusCode === 3 && data.transactionStatus === 'Approved') {
      status.value = 'approved'
      // El carrito seguia lleno despues de pagar: al volver al sitio el cliente
      // veia sus productos otra vez y podia pagarlos por segunda vez.
      cartStore.clearCart()
    } else if (data.statusCode === 2 || data.transactionStatus === 'Canceled') {
      status.value = 'cancelled'
    } else {
      status.value = 'failed'
    }
    details.value = data.message || ''
  } catch (caught) {
    status.value = 'failed'
    details.value = errorMessage(caught, '')
  }
})
</script>

<template>
  <main class="confirmation-page">
    <section class="card" :class="`is-${status}`">
      <i class="status-icon" :class="iconClass" aria-hidden="true"></i>

      <BrandMark tone="light" size="sm" />
      <p class="eyebrow">Confirmación de Payphone</p>

      <h1>{{ title }}</h1>
      <p class="message" role="status">{{ message }}</p>

      <p v-if="status !== 'loading'" class="transaction">
        Transacción: {{ clientTransactionId || 'No disponible' }}
      </p>

      <div v-if="status !== 'loading'" class="actions">
        <router-link to="/" class="primary">Volver al inicio</router-link>
        <a v-if="status !== 'approved'" :href="supportLink" target="_blank" rel="noopener" class="ghost">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Hablar con soporte
        </a>
      </div>
    </section>
  </main>
</template>

<style scoped lang="scss">
.confirmation-page {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  padding: $gutter;
  background: $ink-900;
}

.card {
  @include stack($space-4);
  max-width: 500px;
  align-items: center;
  padding: $space-12 $space-8;
  border: 1px solid $border-on-dark;
  border-radius: $radius-xl;
  background: $surface-dark-raised;
  color: $text-on-dark;
  text-align: center;
  box-shadow: $shadow-lg;
}

.status-icon {
  font-size: 3rem;
  color: $brand-400;
}

.is-approved .status-icon {
  color: $accent-500;
}

.is-cancelled .status-icon,
.is-failed .status-icon {
  color: $danger-500;
}

.eyebrow {
  @include eyebrow($brand-300);
}

h1 {
  font-size: $text-title;
}

.message {
  @include body-text($text-on-dark-muted, $text-body-md);
}

.transaction {
  padding: $space-2 $space-3;
  border: 1px solid $border-on-dark;
  border-radius: $radius-xs;
  color: $brand-300;
  font-size: $text-caption;
  word-break: break-all;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-3;
  margin-top: $space-2;
}

.primary {
  @include button-primary;
  padding: $space-3 $space-6;
}

.ghost {
  @include button-on-dark;
  padding: $space-3 $space-6;
}
</style>
