<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import PayphoneStage from '@/components/checkout/PayphoneStage.vue'
import {
  choosePaymentBank,
  createPaymentIntent,
  getPaymentOrder,
  getPayphoneConfig,
  uploadTransferReceipt,
  type PaymentOrder,
} from '@/services/orders'
import { errorMessage } from '@/services/http'
import { whatsappLink } from '@/config/brand'

declare const PPaymentButtonBox: new (config: Record<string, unknown>) => {
  render: (containerId: string) => void
}

/**
 * Enlace privado de pago de un pedido ya creado. Lo abre el cliente desde el
 * bot de WhatsApp (tarjeta o transferencia) o tras elegir transferencia en el
 * checkout web. El token es la unica llave: no se muestran correo ni telefono.
 */

const route = useRoute()
const token = String(route.params.token || '')

const order = ref<PaymentOrder | null>(null)
const loading = ref(true)
const loadError = ref('')

const money = (value: number) => `$${value.toFixed(2)}`

const PAID = ['paid', 'processing', 'delivered']
const isPaid = computed(() => !!order.value && PAID.includes(order.value.status))
const isCancelled = computed(() => order.value?.status === 'cancelled' && order.value.source !== 'payphone')

const supportLink = computed(() =>
  whatsappLink(`Hola Megaprinter, necesito ayuda con el pago de mi pedido ${order.value?.orderNumber ?? ''}.`),
)

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    order.value = await getPaymentOrder(token)
  } catch (caught) {
    loadError.value = errorMessage(caught, 'No pudimos cargar tu pedido.')
  } finally {
    loading.value = false
  }
}

// ─── Tarjeta (Payphone) ──────────────────────────────────────────────────────

const showCard = ref(false)
const cardReady = ref(false)
const cardLoading = ref(false)
const cardError = ref('')

const waitForBox = () => {
  const container = document.querySelector('#pp-button')
  if (!container) return
  const observer = new MutationObserver(() => {
    if (container.childElementCount) {
      cardReady.value = true
      observer.disconnect()
    }
  })
  observer.observe(container, { childList: true })
  window.setTimeout(() => {
    observer.disconnect()
    cardReady.value = true
  }, 4000)
}

const payWithCard = async () => {
  if (!order.value) return
  cardLoading.value = true
  cardError.value = ''
  try {
    if (typeof PPaymentButtonBox === 'undefined') {
      throw new Error('El servicio de pago no cargó. Revisa tu conexión o escríbenos por WhatsApp.')
    }
    const [config, intent] = await Promise.all([getPayphoneConfig(), createPaymentIntent(token)])
    showCard.value = true
    cardReady.value = false
    await nextTick()
    document.querySelector('#pp-button')?.replaceChildren()

    const amountInCents = Math.round(intent.amount * 100)
    const digits = intent.customerPhone.replace(/\D/g, '')
    new PPaymentButtonBox({
      token: config.token,
      storeId: config.storeId,
      clientTransactionId: intent.clientTransactionId,
      amount: amountInCents,
      amountWithoutTax: amountInCents,
      currency: 'USD',
      reference: `Pedido Megaprinter ${order.value.orderNumber}`,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
      responseUrl: `${window.location.origin}/pay-response`,
      cancellationUrl: `${window.location.origin}/pay-response`,
      ...(digits ? { phoneNumber: digits.startsWith('593') ? `+${digits}` : `+593${digits.replace(/^0/, '')}` } : {}),
      email: intent.customerEmail,
    }).render('pp-button')
    waitForBox()
  } catch (caught) {
    showCard.value = false
    cardError.value = errorMessage(caught, 'No fue posible preparar el pago. Intenta de nuevo en un momento.')
  } finally {
    cardLoading.value = false
  }
}

// ─── Transferencia ───────────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref('')
const copied = ref('')

const transferStatus = computed(() => order.value?.transfer?.status ?? 'awaiting_receipt')
const canUpload = computed(
  () =>
    order.value?.source === 'transfer' &&
    order.value.status === 'pending' &&
    transferStatus.value !== 'approved' &&
    Boolean(order.value.bank),
)

// Primero elige el banco; recién ahí se muestra esa cuenta.
const choosingBank = ref('')
const chooseBank = async (accountId: string) => {
  choosingBank.value = accountId
  uploadError.value = ''
  try {
    order.value = await choosePaymentBank(token, accountId)
  } catch (caught) {
    uploadError.value = errorMessage(caught, 'No pudimos guardar el banco. Intenta de nuevo.')
  } finally {
    choosingBank.value = ''
  }
}

const copy = async (label: string, value: string) => {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = label
    window.setTimeout(() => (copied.value = ''), 2000)
  } catch {
    copied.value = ''
  }
}

const onFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'El archivo pesa más de 10 MB. Envía una captura o foto más liviana.'
    return
  }
  uploading.value = true
  uploadError.value = ''
  try {
    order.value = await uploadTransferReceipt(token, file)
  } catch (caught) {
    uploadError.value = errorMessage(caught, 'No pudimos subir tu comprobante. Intenta nuevamente.')
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="pay-page">
    <section class="card">
      <header class="card-head">
        <BrandMark size="sm" />
        <p v-if="order" class="eyebrow">Pedido {{ order.orderNumber }}</p>
      </header>

      <div v-if="loading" class="state" role="status">
        <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Cargando tu pedido…
      </div>

      <div v-else-if="loadError || !order" class="state error" role="alert">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
        <p>{{ loadError || 'No encontramos este pedido.' }}</p>
        <a :href="whatsappLink('Hola Megaprinter, no puedo abrir el enlace de pago de mi pedido.')" target="_blank" rel="noopener" class="ghost">
          <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Escríbenos por WhatsApp
        </a>
      </div>

      <template v-else>
        <h1>
          <template v-if="isPaid">¡Pago confirmado!</template>
          <template v-else-if="isCancelled">Pedido cancelado</template>
          <template v-else-if="order.source === 'transfer'">Paga por transferencia</template>
          <template v-else-if="order.source === 'payphone'">Paga tu pedido</template>
          <template v-else>Pedido registrado</template>
        </h1>
        <p class="lead">
          Hola {{ order.customerName.split(' ')[0] }},
          <template v-if="isPaid">recibimos tu pago. Te contactamos para coordinar la entrega.
            <router-link :to="{ name: 'TrackOrder', params: { token } }">Ver el seguimiento</router-link>
          </template>
          <template v-else-if="isCancelled">este pedido fue cancelado. Si es un error, escríbenos.</template>
          <template v-else-if="order.source === 'whatsapp'">un asesor te contactará para coordinar el pago.</template>
          <template v-else>este es el resumen de tu pedido.</template>
        </p>

        <section class="summary" aria-label="Resumen del pedido">
          <div v-for="item in order.items" :key="item.name" class="line">
            <span class="name">{{ item.quantity }} × {{ item.name }}</span>
            <span class="amount">{{ money(item.price * item.quantity) }}</span>
          </div>
          <div class="line total">
            <span class="name">Total a pagar</span>
            <span class="amount">{{ money(order.totalAmount) }}</span>
          </div>
        </section>

        <!-- Tarjeta -->
        <template v-if="order.source === 'payphone' && !isPaid">
          <p v-if="cardError" class="notice error" role="alert">
            <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ cardError }}
          </p>
          <button v-if="!showCard" type="button" class="primary" :disabled="cardLoading" @click="payWithCard">
            <i :class="cardLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'" aria-hidden="true"></i>
            {{ cardLoading ? 'Preparando pago…' : `Pagar ${money(order.totalAmount)} con tarjeta` }}
          </button>
          <PayphoneStage v-else :ready="cardReady" @back="showCard = false" />
        </template>

        <!-- Transferencia -->
        <template v-if="order.source === 'transfer' && !isPaid && !isCancelled">
          <section v-if="!order.bank && order.banks.length" class="bank-choice" aria-label="Elige tu banco">
            <p class="section-title"><i class="fa-solid fa-building-columns" aria-hidden="true"></i> ¿A qué banco prefieres transferir?</p>
            <div class="bank-options">
              <button
                v-for="account in order.banks"
                :key="account.id"
                type="button"
                class="bank-option"
                :disabled="Boolean(choosingBank)"
                @click="chooseBank(account.id)"
              >
                <span class="bank-logo">
                  <img v-if="account.logoUrl" :src="account.logoUrl" alt="" loading="lazy" />
                  <i v-else class="fa-solid fa-building-columns" aria-hidden="true"></i>
                </span>
                <span>{{ account.bank }}</span>
                <i :class="choosingBank === account.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chevron-right'" aria-hidden="true"></i>
              </button>
            </div>
          </section>

          <section v-if="order.bank" class="bank" aria-label="Datos de la cuenta">
            <p class="section-title">
              <span class="bank-logo small">
                <img v-if="order.bank.logoUrl" :src="order.bank.logoUrl" alt="" />
                <i v-else class="fa-solid fa-building-columns" aria-hidden="true"></i>
              </span>
              Transfiere a esta cuenta
            </p>
            <dl>
              <div v-if="order.bank.bank"><dt>Banco</dt><dd>{{ order.bank.bank }}</dd></div>
              <div v-if="order.bank.accountType"><dt>Tipo</dt><dd>Cuenta {{ order.bank.accountType }}</dd></div>
              <div>
                <dt>Número</dt>
                <dd class="copyable">
                  <span class="mono">{{ order.bank.accountNumber }}</span>
                  <button type="button" @click="copy('cuenta', order.bank.accountNumber)">
                    <i :class="copied === 'cuenta' ? 'fa-solid fa-check' : 'fa-regular fa-copy'" aria-hidden="true"></i>
                    {{ copied === 'cuenta' ? 'Copiado' : 'Copiar' }}
                  </button>
                </dd>
              </div>
              <div v-if="order.bank.accountHolder"><dt>Titular</dt><dd>{{ order.bank.accountHolder }}</dd></div>
              <div v-if="order.bank.holderId"><dt>RUC / Cédula</dt><dd class="mono">{{ order.bank.holderId }}</dd></div>
              <div>
                <dt>Monto exacto</dt>
                <dd class="copyable">
                  <span class="mono strong">{{ money(order.totalAmount) }}</span>
                  <button type="button" @click="copy('monto', order.totalAmount.toFixed(2))">
                    <i :class="copied === 'monto' ? 'fa-solid fa-check' : 'fa-regular fa-copy'" aria-hidden="true"></i>
                    {{ copied === 'monto' ? 'Copiado' : 'Copiar' }}
                  </button>
                </dd>
              </div>
            </dl>
          </section>

          <p v-if="transferStatus === 'in_review'" class="notice review" role="status">
            <i class="fa-solid fa-magnifying-glass-dollar" aria-hidden="true"></i>
            Recibimos tu comprobante y lo estamos revisando. Te confirmamos apenas se valide el pago.
          </p>
          <p v-else-if="transferStatus === 'rejected'" class="notice error" role="alert">
            <i class="fa-solid fa-circle-xmark" aria-hidden="true"></i>
            No pudimos validar tu comprobante{{ order.transfer?.note ? `: ${order.transfer.note}` : '' }}. Sube uno nuevo.
          </p>

          <div v-if="canUpload" class="upload">
            <input
              ref="fileInput"
              class="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              @change="onFile"
            />
            <button type="button" class="primary" :disabled="uploading" @click="fileInput?.click()">
              <i :class="uploading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-upload'" aria-hidden="true"></i>
              {{
                uploading
                  ? 'Subiendo comprobante…'
                  : transferStatus === 'in_review'
                    ? 'Subir otro comprobante'
                    : 'Subir comprobante'
              }}
            </button>
            <p class="helper">Foto, captura o PDF del comprobante. También puedes enviarlo por WhatsApp.</p>
            <p v-if="uploadError" class="notice error" role="alert">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ uploadError }}
            </p>
          </div>
        </template>

        <div class="footer-actions">
          <router-link to="/" class="ghost">Volver a la tienda</router-link>
          <a :href="supportLink" target="_blank" rel="noopener" class="ghost">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Ayuda por WhatsApp
          </a>
        </div>
      </template>
    </section>
  </main>
</template>

<style scoped lang="scss">
.pay-page {
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

.state {
  @include stack($space-3);
  align-items: center;
  padding: $space-8 0;
  color: $text-muted;
  text-align: center;

  &.error > i {
    color: $danger-500;
    font-size: 2rem;
  }
}

.summary {
  display: flex;
  flex-direction: column;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
}

.line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-3 $space-4;
  border-top: 1px solid $border-subtle;
  font-size: $text-body-sm;

  &:first-child {
    border-top: 0;
  }

  .name {
    min-width: 0;
  }

  .amount {
    @include mono-data($text-strong, $text-caption);
    flex: none;
  }

  &.total {
    background: $surface-sunken;
    font-weight: $weight-semibold;

    .amount {
      @include price(1.2rem);
    }
  }
}

.bank {
  @include stack($space-3);
  padding: $space-4;
  border: 1px solid $cyan-mist;
  border-radius: $radius-md;
  background: $cyan-wash;

  dl {
    @include stack($space-2);
  }

  dl > div {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-1 $space-3;
  }

  dt {
    @include field-label;
  }

  dd {
    min-width: 0;
    font-size: $text-body-sm;
    text-align: right;
  }
}

.bank-choice {
  @include stack($space-3);
}

.bank-options {
  @include stack($space-2);
}

.bank-option {
  @include row($space-3);
  width: 100%;
  padding: $space-3 $space-4;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $surface-card;
  color: $text-strong;
  font-size: $text-body-sm;
  font-weight: $weight-semibold;
  text-align: left;
  cursor: pointer;
  @include focus-ring;

  > span:nth-child(2) {
    flex: 1;
  }

  > i {
    color: $text-muted;
  }

  &:hover:not(:disabled) {
    border-color: $cyan;
    background: $brand-100;
  }
}

.bank-logo {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $paper-white;
  color: $text-muted;

  img {
    width: 26px;
    height: 26px;
    object-fit: contain;
  }

  &.small {
    width: 28px;
    height: 28px;

    img {
      width: 20px;
      height: 20px;
    }
  }
}

.section-title {
  @include row($space-2);
  font-weight: $weight-semibold;
}

.copyable {
  @include row($space-2);
  justify-content: flex-end;

  button {
    @include row($space-1);
    padding: $space-1 $space-2;
    border: 1px solid $border-subtle;
    border-radius: $radius-xs;
    background: $surface-card;
    color: $text-body;
    font-size: $text-eyebrow;
    cursor: pointer;
    @include focus-ring;
  }
}

.mono {
  @include mono-data($text-strong, $text-body-sm);

  &.strong {
    font-weight: $weight-semibold;
  }
}

.upload {
  @include stack($space-2);
}

.helper {
  color: $text-muted;
  font-size: $text-caption;
  text-align: center;
}

.notice {
  @include row($space-2, flex-start);
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: $text-caption;
  line-height: $leading-body;

  i {
    margin-top: 2px;
  }

  &.error {
    border: 1px solid rgba($danger, 0.35);
    background: $danger-wash;
    color: $danger;
  }

  &.review {
    border: 1px solid $warning-500;
    background: $warning-100;
    color: $text-strong;
  }
}

.primary {
  @include button-primary;
  width: 100%;
  min-height: 48px;
  border-radius: $radius-md;
}

.footer-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: $space-2;
}

.ghost {
  @include button-ghost;
}

@include from($bp-sm) {
  .pay-page {
    padding: $space-12 $space-6;
  }

  .card {
    padding: $space-8;
  }
}
</style>
