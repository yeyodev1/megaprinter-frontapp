<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useScrollLock } from '@/composables/useScrollLock'
import OrderSummary from '@/components/OrderSummary.vue'
import PaymentCustomerForm, { type CustomerDetails } from '@/components/PaymentCustomerForm.vue'
import CheckoutSteps from '@/components/checkout/CheckoutSteps.vue'
import PayphoneStage from '@/components/checkout/PayphoneStage.vue'
import { createOrder, getPayphoneConfig, type OrderPayload } from '@/services/orders'
import { errorMessage } from '@/services/http'

declare const PPaymentButtonBox: new (config: Record<string, unknown>) => {
  render: (containerId: string) => void
}

const cartStore = useCartStore()
const loading = ref(false)
const showPaymentBox = ref(false)
const boxReady = ref(false)
const error = ref('')
const form = ref<CustomerDetails>({ name: '', email: '', phone: '', address: '' })

const isOpen = computed(() => cartStore.isPaymentOpen)
useScrollLock(isOpen)

const step = computed<1 | 2 | 3>(() => (showPaymentBox.value ? 2 : 1))

// El resumen recapitula los datos solo cuando ya se pasó al pago.
const customerRecap = computed(() => (showPaymentBox.value ? form.value : null))

const close = () => {
  cartStore.setPaymentOpen(false)
  showPaymentBox.value = false
  boxReady.value = false
  error.value = ''
}

const backToDetails = () => {
  showPaymentBox.value = false
  boxReady.value = false
}

const normalisedPhone = () =>
  form.value.phone.startsWith('+') ? form.value.phone : `+593${form.value.phone.replace(/\D/g, '').replace(/^0/, '')}`

const buildOrder = (source: 'payphone' | 'whatsapp', clientTransactionId = ''): OrderPayload => ({
  customerName: form.value.name.trim(),
  customerEmail: form.value.email.trim(),
  customerPhone: form.value.phone.trim(),
  address: form.value.address.trim(),
  items: cartStore.items.map((item) => ({
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  })),
  totalAmount: cartStore.totalAmount,
  source,
  clientTransactionId,
})

// El SDK no avisa cuando termina de pintar la caja: se observa el contenedor
// y se retira el esqueleto en cuanto aparece contenido.
const waitForBox = () => {
  const container = document.querySelector('#pp-button')
  if (!container) return
  if (container.childElementCount) {
    boxReady.value = true
    return
  }
  const observer = new MutationObserver(() => {
    if (container.childElementCount) {
      boxReady.value = true
      observer.disconnect()
      // Payphone enfoca su primer campo al pintar y eso desplaza el cuerpo del
      // modal; se devuelve arriba para que la cabecera del paso quede visible.
      window.setTimeout(() => {
        document.querySelector('.payment-modal .modal-body')?.scrollTo({ top: 0 })
      }, 60)
    }
  })
  observer.observe(container, { childList: true })
  window.setTimeout(() => {
    observer.disconnect()
    boxReady.value = true
  }, 4000)
}

const startPayphone = async () => {
  if (cartStore.isEmpty) {
    error.value = 'Tu carrito está vacío.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    if (typeof PPaymentButtonBox === 'undefined') {
      throw new Error('El servicio de pago no cargó. Revisa tu conexión o finaliza por WhatsApp.')
    }

    // La configuracion se pide ANTES de registrar el pedido: al reves, si
    // Payphone no estaba configurado quedaba una orden "pending" huerfana en la
    // base por cada intento fallido.
    const config = await getPayphoneConfig()

    const clientTransactionId = `MEGA-${Date.now()}`
    await createOrder(buildOrder('payphone', clientTransactionId))

    showPaymentBox.value = true
    boxReady.value = false
    await nextTick()
    document.querySelector('#pp-button')?.replaceChildren()

    const amountInCents = Math.round(cartStore.totalAmount * 100)

    new PPaymentButtonBox({
      token: config.token,
      storeId: config.storeId,
      clientTransactionId,
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      currency: 'USD',
      reference: `Pedido Megaprinter ${clientTransactionId}`,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
      // Sin responseUrl Payphone no sabe a donde devolver al cliente y la vista
      // de confirmacion nunca recibia `id` ni `clientTransactionId`.
      responseUrl: `${window.location.origin}/pay-response`,
      cancellationUrl: `${window.location.origin}/pay-response`,
      phoneNumber: normalisedPhone(),
      email: form.value.email.trim(),
    }).render('pp-button')

    waitForBox()
  } catch (caught) {
    showPaymentBox.value = false
    boxReady.value = false
    error.value = errorMessage(
      caught,
      'No fue posible preparar Payphone. Puedes finalizar tu pedido por WhatsApp.',
    )
  } finally {
    loading.value = false
  }
}

const completeByWhatsApp = async () => {
  if (!form.value.name || !form.value.email || !form.value.phone || !form.value.address) {
    error.value = 'Completa tus datos para enviar la solicitud al equipo Megaprinter.'
    return
  }
  if (cartStore.isEmpty) {
    error.value = 'Tu carrito está vacío.'
    return
  }

  loading.value = true
  error.value = ''

  // La pestana se abre AHORA, dentro del gesto del usuario. Abrirla despues del
  // await la convierte en un popup y el navegador la bloquea: el pedido quedaba
  // registrado y el cliente nunca llegaba a WhatsApp.
  const tab = window.open('', '_blank')

  try {
    const { whatsappLink } = await createOrder(buildOrder('whatsapp'))
    if (tab) tab.location.href = whatsappLink
    else window.location.href = whatsappLink
    cartStore.clearCart()
    close()
  } catch (caught) {
    tab?.close()
    error.value = errorMessage(caught, 'No pudimos registrar tu solicitud. Intenta nuevamente.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <transition name="payment-modal">
    <div v-if="cartStore.isPaymentOpen" class="modal-layer" @click.self="close" @keydown.esc="close">
      <section class="payment-modal" role="dialog" aria-modal="true" aria-label="Finalizar compra">
        <header class="modal-header">
          <div class="header-copy">
            <p class="eyebrow">Finalizar pedido</p>
            <h2>{{ showPaymentBox ? 'Paga de forma segura' : 'Tus datos de entrega' }}</h2>
          </div>
          <button class="close" type="button" aria-label="Cerrar" @click="close">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div class="steps-bar">
          <CheckoutSteps :current="step" />
        </div>

        <div class="modal-body">
          <div class="summary-column">
            <OrderSummary :customer="customerRecap" @edit="backToDetails" />
          </div>

          <div class="step-column">
            <PaymentCustomerForm
              v-if="!showPaymentBox"
              v-model="form"
              :loading="loading"
              :error="error"
              @pay="startPayphone"
              @whatsapp="completeByWhatsApp"
            />
            <PayphoneStage v-else :ready="boxReady" @back="backToDetails" />
          </div>
        </div>
      </section>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.modal-layer {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba($key-900, 0.6);
  backdrop-filter: blur(8px);
}

.payment-modal {
  display: flex;
  width: 100%;
  max-height: 92vh;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-xl $radius-xl 0 0;
  background: $surface-card;
  color: $text-strong;
  box-shadow: $shadow-lg;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-4 $space-5;
  background: $key-900;
  color: $text-on-dark;

  h2 {
    margin-top: 2px;
    font-size: $text-heading;
  }
}

.eyebrow {
  @include eyebrow($brand-300);
}

.close {
  display: flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-on-dark;
  border-radius: $radius-pill;
  background: transparent;
  color: $text-on-dark;
  cursor: pointer;
  transition: background $duration-base $ease-out;
  @include focus-ring($brand-300);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.steps-bar {
  padding: $space-3 $space-5;
  border-bottom: 1px solid $border-subtle;
  background: $surface-page;
}

.modal-body {
  @include scroll-area;
  @include stack($space-4);
  flex: 1;
  padding: $space-4 $space-5 $space-6;
}

.step-column {
  display: flex;
  flex-direction: column;
}

.payment-modal-enter-active,
.payment-modal-leave-active {
  transition: opacity $duration-base $ease-out;

  .payment-modal {
    transition: transform $duration-slow $ease-out;
  }
}

.payment-modal-enter-from,
.payment-modal-leave-to {
  opacity: 0;

  .payment-modal {
    transform: translateY(100%);
  }
}

@include from($bp-sm) {
  .modal-layer {
    align-items: center;
    padding: $space-5;
  }

  .payment-modal {
    max-width: 960px;
    border-radius: $radius-lg;
  }

  .payment-modal-enter-from,
  .payment-modal-leave-to .payment-modal {
    transform: translateY(16px) scale(0.985);
  }
}

@include from($bp-md) {
  .modal-body {
    flex-direction: row;
    align-items: stretch;
    gap: $space-6;
    padding: $space-6;
  }

  .summary-column {
    display: flex;
    width: 320px;
    flex: 0 0 320px;
    flex-direction: column;
  }

  .step-column {
    flex: 1;
    min-width: 0;
    justify-content: center;
  }

  .steps-bar {
    padding: $space-3 $space-6;
  }
}
</style>
