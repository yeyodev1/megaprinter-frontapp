<template>
  <main class="confirmation-page">
    <div class="confirmation-card">
      <i :class="iconClass"></i>
      <span class="eyebrow">Megaprinter · Payphone</span>
      <h1>{{ title }}</h1>
      <p>{{ message }}</p>
      <div class="transaction" v-if="status !== 'loading'">Transacción: {{ clientTransactionId || 'No disponible' }}</div>
      <router-link to="/" class="home-link">Volver al inicio</router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import axios from 'axios'
import { apiBase } from '@/services/api'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const status = ref<'loading' | 'approved' | 'cancelled' | 'failed'>('loading')
const details = ref('')
const clientTransactionId = String(route.query.clientTransactionId || '')

const title = computed(() => status.value === 'loading' ? 'Confirmando tu pago' : status.value === 'approved' ? 'Pago confirmado' : status.value === 'cancelled' ? 'Pago cancelado' : 'No pudimos confirmar el pago')
const message = computed(() => status.value === 'loading' ? 'Estamos validando la transacción con Payphone.' : status.value === 'approved' ? 'Tu transacción fue aprobada. Nuestro equipo recibirá la confirmación para continuar con tu pedido.' : status.value === 'cancelled' ? 'La transacción fue cancelada en Payphone. No se acreditó ningún cobro; puedes volver a intentarlo cuando quieras.' : details.value || 'Comunícate con nosotros por WhatsApp para revisar tu pedido.')
const iconClass = computed(() => status.value === 'loading' ? 'fa-solid fa-spinner fa-spin' : status.value === 'approved' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark')

onMounted(async () => {
  const id = route.query.id
  if (!id || !clientTransactionId) {
    status.value = 'failed'
    details.value = 'Payphone no devolvió los datos de la transacción.'
    return
  }

  try {
    const { data } = await axios.post(`${apiBase}/orders/payphone/confirm`, { id, clientTransactionId })
    status.value = data.statusCode === 3 && data.transactionStatus === 'Approved' ? 'approved' : data.statusCode === 2 || data.transactionStatus === 'Canceled' ? 'cancelled' : 'failed'
    details.value = data.message || ''
  } catch {
    status.value = 'failed'
  }
})
</script>

<style scoped lang="scss">
.confirmation-page { min-height: 100vh; background: #080808; display: flex; align-items: center; justify-content: center; padding: 24px; }
.confirmation-card { max-width: 500px; padding: 48px 32px; border: 1px solid rgba(255,255,255,.1); background: #121212; border-radius: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; color: #fff; }
.confirmation-card > i { font-size: 48px; color: #0070f3; }
.confirmation-card h1 { font-size: 30px; }
.confirmation-card p { color: #aaa; line-height: 1.6; }
.transaction { padding: 9px 12px; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; color: #83bfff; font-size: 12px; word-break: break-all; }
.eyebrow { color: #3291ff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.home-link { color: #fff; background: #0070f3; padding: 13px 22px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-top: 8px; }
</style>
