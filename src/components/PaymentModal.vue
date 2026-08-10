<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useScrollLock } from '@/composables/useScrollLock'
import OrderSummary from '@/components/OrderSummary.vue'
import PaymentCustomerForm, { type CustomerDetails } from '@/components/PaymentCustomerForm.vue'
import { createOrder, getPayphoneConfig, type OrderPayload } from '@/services/orders'
import { errorMessage } from '@/services/http'

declare const PPaymentButtonBox: new (config: Record<string, unknown>) => {
  render: (containerId: string) => void
}

const cartStore = useCartStore()
const loading = ref(false)
const showPaymentBox = ref(false)
const error = ref('')
const form = ref<CustomerDetails>({ name: '', email: '', phone: '', address: '' })

const isOpen = computed(() => cartStore.isPaymentOpen)
useScrollLock(isOpen)

const close = () => {
  cartStore.setPaymentOpen(false)
  showPaymentBox.value = false
  error.value = ''
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
  } catch (caught) {
    showPaymentBox.value = false
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
          <div>
            <p class="eyebrow">Finalizar pedido</p>
            <h2>Detalles de pago</h2>
          </div>
          <button type="button" aria-label="Cerrar" @click="close">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <ol class="progress">
          <li :class="{ active: !showPaymentBox }">1. Datos</li>
          <li aria-hidden="true" class="line"></li>
          <li :class="{ active: showPaymentBox }">2. Pago</li>
          <li aria-hidden="true" class="line"></li>
          <li>3. Confirmación</li>
        </ol>

        <div class="modal-content">
          <OrderSummary />

          <PaymentCustomerForm
            v-if="!showPaymentBox"
            v-model="form"
            :loading="loading"
            :error="error"
            @pay="startPayphone"
            @whatsapp="completeByWhatsApp"
          />

          <div v-else class="payphone-stage">
            <div class="stage-heading">
              <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
              <div>
                <strong>Pago protegido por Payphone</strong>
                <span>No compartimos los datos de tu tarjeta.</span>
              </div>
            </div>
            <div id="pp-button"></div>
            <button class="back-button" type="button" @click="showPaymentBox = false">
              <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver a mis datos
            </button>
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
  background: rgba($ink-900, 0.72);
  backdrop-filter: blur(12px);
}

.payment-modal {
  @include scroll-area;
  width: 100%;
  max-width: 760px;
  max-height: 94vh;
  border: 1px solid $border-on-dark;
  border-radius: $radius-xl $radius-xl 0 0;
  background: $ink-800;
  color: $text-on-dark;
  box-shadow: $shadow-lg;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-6 $space-6 $space-5;
  border-bottom: 1px solid $border-on-dark;

  h2 {
    margin-top: $space-1;
    font-size: 1.5rem;
  }

  button {
    display: flex;
    width: 38px;
    height: 38px;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-on-dark;
    border-radius: $radius-pill;
    background: transparent;
    color: $text-on-dark;
    cursor: pointer;
    @include focus-ring($brand-300);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.eyebrow {
  @include eyebrow($brand-300);
}

.progress {
  @include row($space-2);
  padding: $space-4 $space-6;
  color: $ink-400;
  font-size: $text-eyebrow;
  font-weight: $weight-bold;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  .active {
    color: $brand-300;
  }

  .line {
    flex: 1;
    height: 1px;
    background: $border-on-dark;
  }
}

.modal-content {
  @include stack($space-5);
  padding: $space-5 $space-6 $space-8;
}

.payphone-stage {
  @include stack($space-5);
  padding: $space-5;
  border: 1px solid rgba(32, 148, 210, 0.3);
  border-radius: $radius-md;
  background: rgba(32, 148, 210, 0.08);
}

.stage-heading {
  @include row($space-3);
  color: $brand-300;

  i {
    font-size: 1.25rem;
  }

  div {
    @include stack(2px);
  }

  strong {
    color: $text-on-dark;
    font-size: $text-body-sm;
  }

  span {
    color: $text-on-dark-muted;
    font-size: $text-caption;
  }
}

.back-button {
  @include button-ghost($text-on-dark-muted);
  align-self: center;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: $text-on-dark;
  }
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
    border-radius: $radius-xl;
  }

  .modal-content {
    flex-direction: row;
    align-items: flex-start;
    gap: $space-6;
  }

  .summary {
    width: 38%;
    flex: 0 0 38%;
  }

  .customer-form,
  .payphone-stage {
    flex: 1;
  }

  .payment-modal-enter-from,
  .payment-modal-leave-to .payment-modal {
    transform: translateY(20px) scale(0.98);
  }
}
</style>
