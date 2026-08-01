<template>
  <transition name="payment-modal">
    <div v-if="cartStore.isPaymentOpen" class="modal-layer" @click.self="close">
      <section class="payment-modal" aria-modal="true" role="dialog" aria-label="Finalizar compra">
        <header class="modal-header">
          <div><span>FINALIZAR PEDIDO</span><h2>Detalles de pago</h2></div>
          <button @click="close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
        </header>

        <div class="progress"><span class="active">1. Datos</span><i></i><span :class="{ active: showPaymentBox }">2. Pago</span><i></i><span>3. Confirmación</span></div>

        <main class="modal-content">
          <aside class="payment-summary">
            <div class="summary-title"><span>Resumen</span><strong>{{ cartStore.totalItems }} artículo{{ cartStore.totalItems === 1 ? '' : 's' }}</strong></div>
            <div class="summary-items">
              <div v-for="item in cartStore.items" :key="item.id"><span>{{ item.quantity }}× {{ item.name }}</span><strong>${{ (item.price * item.quantity).toFixed(2) }}</strong></div>
            </div>
            <div class="summary-total"><span>Total</span><strong>${{ cartStore.totalAmount.toFixed(2) }}</strong></div>
          </aside>

          <form v-if="!showPaymentBox" class="customer-form" @submit.prevent="startPayphone">
            <p class="form-intro">Completa tus datos para habilitar un pago seguro o solicitar confirmación directa por WhatsApp.</p>
            <label>Nombre completo<input v-model="form.name" required autocomplete="name" placeholder="Carlos Mendoza" /></label>
            <label>Correo electrónico<input v-model="form.email" required type="email" autocomplete="email" placeholder="correo@empresa.com" /></label>
            <label>WhatsApp<input v-model="form.phone" required type="tel" autocomplete="tel" placeholder="099 802 8318" /></label>
            <label>Dirección de entrega / ciudad<input v-model="form.address" required autocomplete="street-address" placeholder="Guayaquil, Ecuador" /></label>
            <button class="payphone-action" :disabled="loading" type="submit"><i class="fa-solid fa-lock"></i>{{ loading ? 'Preparando pago...' : 'Pagar de forma segura' }}</button>
            <button class="whatsapp-action" type="button" @click="completeByWhatsApp"><i class="fa-brands fa-whatsapp"></i> Finalizar por WhatsApp</button>
          </form>

          <div v-else class="payphone-stage">
            <div class="stage-heading"><i class="fa-solid fa-shield-halved"></i><div><strong>Pago protegido por Payphone</strong><span>No compartimos los datos de tu tarjeta.</span></div></div>
            <div id="pp-button"></div>
            <button class="back-button" @click="showPaymentBox = false"><i class="fa-solid fa-arrow-left"></i> Volver a mis datos</button>
          </div>
        </main>
      </section>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import axios from 'axios'
import { useCartStore } from '@/stores/cart'
import { apiBase } from '@/services/api'

declare const PPaymentButtonBox: new (config: Record<string, unknown>) => { render: (containerId: string) => void }

const cartStore = useCartStore()
const loading = ref(false)
const showPaymentBox = ref(false)
const form = reactive({ name: '', email: '', phone: '', address: '' })

const close = () => {
  cartStore.setPaymentOpen(false)
  showPaymentBox.value = false
}

const buildOrder = (source: 'payphone' | 'whatsapp', clientTransactionId = '') => ({
  customerName: form.name,
  customerEmail: form.email,
  customerPhone: form.phone,
  address: form.address,
  items: cartStore.items,
  totalAmount: cartStore.totalAmount,
  source,
  clientTransactionId,
})

const startPayphone = async () => {
  loading.value = true
  try {
    const clientTransactionId = `MEGA-${Date.now()}`
    await axios.post(`${apiBase}/orders`, buildOrder('payphone', clientTransactionId))
    const { data } = await axios.get(`${apiBase}/orders/payphone/config`)
    showPaymentBox.value = true
    await nextTick()
    document.querySelector('#pp-button')?.replaceChildren()
    new PPaymentButtonBox({
      token: data.token,
      storeId: data.storeId,
      clientTransactionId,
      amount: Math.round(cartStore.totalAmount * 100),
      amountWithoutTax: Math.round(cartStore.totalAmount * 100),
      currency: 'USD',
      reference: `Pedido Megaprinter ${clientTransactionId}`,
      lang: 'es',
      defaultMethod: 'card',
      timeZone: -5,
      lat: '-2.170998',
      lng: '-79.922359',
      phoneNumber: formatPhone(),
      email: form.email,
    }).render('pp-button')
  } catch {
    alert('No fue posible preparar Payphone. Puedes finalizar tu pedido por WhatsApp.')
  } finally {
    loading.value = false
  }
}

const formatPhone = () => form.phone.startsWith('+') ? form.phone : `+593${form.phone.replace(/^0/, '')}`

const completeByWhatsApp = async () => {
  if (!form.name || !form.email || !form.phone || !form.address) {
    alert('Completa tus datos para enviar la solicitud al equipo Megaprinter.')
    return
  }
  try { await axios.post(`${apiBase}/orders`, buildOrder('whatsapp')) } catch { alert('No pudimos registrar tu solicitud. Intenta nuevamente.') ; return }
  const products = cartStore.items.map((item) => `${item.quantity}× ${item.name}`).join(', ')
  const text = encodeURIComponent(`Hola Megaprinter, deseo finalizar mi pedido.\nProductos: ${products}\nTotal: $${cartStore.totalAmount.toFixed(2)}\nCliente: ${form.name || 'Por confirmar'}\nWhatsApp: ${form.phone || 'Por confirmar'}\nDirección: ${form.address || 'Por confirmar'}`)
  window.open(`https://wa.me/593998028318?text=${text}`, '_blank')
}
</script>

<style scoped lang="scss">
.modal-layer { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: flex-end; justify-content: center; padding: 0; background: rgba(1,4,10,.76); backdrop-filter: blur(14px); }
.payment-modal { width: 100%; max-width: 760px; max-height: 94vh; overflow-y: auto; border: 1px solid rgba(255,255,255,.12); border-radius: 24px 24px 0 0; background: #0d121b; box-shadow: 0 -25px 70px rgba(0,0,0,.5); }
.modal-header { padding: 22px 22px 18px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.08); span { color: #51a9ff; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; } h2 { margin-top: 3px; color: #fff; font-size: 24px; letter-spacing: -1px; } button { width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.12); border-radius: 50%; color: #fff; background: transparent; cursor: pointer; } }
.progress { padding: 15px 22px; display: flex; align-items: center; gap: 8px; color: #697588; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; .active { color: #56aeff; } i { flex: 1; height: 1px; background: rgba(255,255,255,.12); } }
.modal-content { padding: 20px 22px 30px; display: flex; flex-direction: column; gap: 20px; }
.payment-summary { padding: 17px; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; background: rgba(255,255,255,.025); display: flex; flex-direction: column; gap: 14px; }.summary-title,.summary-items div,.summary-total { display: flex; align-items: center; justify-content: space-between; gap: 14px; }.summary-title { color: #fff; font-size: 14px; strong { color: #8794a5; font-size: 12px; } }.summary-items { display: flex; flex-direction: column; gap: 8px; color: #a7b0bd; font-size: 12px; div strong { color: #e5e9f1; white-space: nowrap; } }.summary-total { padding-top: 14px; border-top: 1px solid rgba(255,255,255,.09); color: #fff; font-weight: 700; strong { font-size: 23px; letter-spacing: -1px; } }
.customer-form { display: flex; flex-direction: column; gap: 13px; }.form-intro { color: #94a0b0; font-size: 13px; line-height: 1.55; margin-bottom: 2px; }.customer-form label { display: flex; flex-direction: column; gap: 6px; color: #b4bdc8; font-size: 11px; font-weight: 800; letter-spacing: .5px; text-transform: uppercase; }.customer-form input { width: 100%; padding: 14px 15px; border: 1px solid rgba(255,255,255,.1); border-radius: 11px; outline: none; background: rgba(255,255,255,.035); color: #fff; font: inherit; font-size: 14px; transition: .2s ease; &:focus { border-color: #278ff2; box-shadow: 0 0 0 3px rgba(0,112,243,.15); } }
.payphone-action,.whatsapp-action { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 15px; border: 0; border-radius: 12px; color: #fff; font-weight: 800; cursor: pointer; transition: transform .2s ease,box-shadow .2s ease; }.payphone-action { margin-top: 5px; background: linear-gradient(110deg,#0578eb,#36b4ff); box-shadow: 0 13px 26px rgba(0,112,243,.25); &:hover { transform: translateY(-2px); box-shadow: 0 17px 30px rgba(0,112,243,.4); } }.whatsapp-action { background: rgba(37,211,102,.12); border: 1px solid rgba(37,211,102,.35); color: #7ef0a8; &:hover { transform: translateY(-2px); } }
.payphone-stage { padding: 18px; border: 1px solid rgba(0,168,255,.28); border-radius: 16px; background: linear-gradient(135deg,rgba(0,112,243,.13),rgba(255,255,255,.02)); display: flex; flex-direction: column; gap: 18px; }.stage-heading { display: flex; align-items: center; gap: 12px; color: #55aeff; i { font-size: 20px; } div { display: flex; flex-direction: column; gap: 3px; } strong { color: #fff; font-size: 14px; } span { color: #9ba8b8; font-size: 12px; } }.back-button { align-self: center; border: 0; background: transparent; color: #a5b1c0; cursor: pointer; font-size: 12px; font-weight: 700; &:hover { color: #fff; } }
.payment-modal-enter-active,.payment-modal-leave-active { transition: opacity .3s ease; .payment-modal { transition: transform .4s cubic-bezier(.16,1,.3,1); } }.payment-modal-enter-from,.payment-modal-leave-to { opacity: 0; .payment-modal { transform: translateY(100%); } }
@media (min-width: 640px) { .modal-layer { align-items: center; padding: 20px; }.payment-modal { border-radius: 24px; }.modal-header { padding: 26px 30px 20px; }.progress { padding: 16px 30px; }.modal-content { padding: 26px 30px 32px; flex-direction: row; align-items: flex-start; }.payment-summary { width: 38%; flex: 0 0 38%; }.customer-form,.payphone-stage { flex: 1; }.payment-modal-enter-from,.payment-modal-leave-to { .payment-modal { transform: translateY(20px) scale(.98); } } }
</style>
