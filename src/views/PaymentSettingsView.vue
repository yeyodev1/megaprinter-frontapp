<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { getPaymentSettings, savePaymentSettings, type TransferSettings } from '@/services/settings'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate } from '@/components/admin/orderHelpers'

/**
 * Cuenta para transferencias. Encendida, la web y el bot de WhatsApp ofrecen
 * pagar por transferencia; apagada, ninguno la ofrece.
 */

useAdminEntrance()
const dialog = useDialogStore()

const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const updatedBy = ref('')
const updatedAt = ref<string | null>(null)
const form = reactive<TransferSettings>({
  enabled: false,
  bank: '',
  accountType: '',
  accountNumber: '',
  accountHolder: '',
  holderId: '',
})
// Lo guardado, para saber si hay cambios sin guardar.
const saved = ref('')
const dirty = computed(() => JSON.stringify(form) !== saved.value)
const complete = computed(() => !!(form.bank.trim() && form.accountNumber.trim() && form.accountHolder.trim()))

const ACCOUNT_TYPES = ['corriente', 'de ahorros']

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

const apply = (data: { transfer: TransferSettings; updatedBy: string; updatedAt: string | null }) => {
  Object.assign(form, data.transfer)
  saved.value = JSON.stringify(form)
  updatedBy.value = data.updatedBy
  updatedAt.value = data.updatedAt
}

const load = async () => {
  loading.value = true
  try {
    apply(await getPaymentSettings())
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar la configuración', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const save = async (successText = 'Configuración guardada.') => {
  saving.value = true
  try {
    apply(await savePaymentSettings({ ...form }))
    flash(successText)
    return true
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Revisa los datos.'), tone: 'danger' })
    return false
  } finally {
    saving.value = false
  }
}

const toggle = async () => {
  const turningOn = !form.enabled
  if (turningOn && !complete.value) {
    await dialog.notify({
      title: 'Faltan datos de la cuenta',
      message: 'Completa banco, número de cuenta y titular antes de activar las transferencias.',
      tone: 'warning',
    })
    return
  }
  const confirmed = await dialog.confirm({
    title: turningOn ? '¿Activar transferencias?' : '¿Desactivar transferencias?',
    message: turningOn
      ? 'La web y el bot de WhatsApp ofrecerán pagar por transferencia a esta cuenta.'
      : 'Los clientes nuevos ya no verán la opción. Los pedidos por transferencia que ya existen siguen pudiendo pagar.',
    detail: turningOn ? `${form.bank} · ${form.accountNumber}` : undefined,
    confirmLabel: turningOn ? 'Activar' : 'Desactivar',
    tone: turningOn ? 'success' : 'warning',
    icon: 'fa-solid fa-building-columns',
  })
  if (!confirmed) return
  form.enabled = turningOn
  const ok = await save(turningOn ? 'Transferencias activadas en la web y el bot.' : 'Transferencias desactivadas.')
  if (!ok) form.enabled = !turningOn
}

const submit = async () => {
  if (form.enabled && !complete.value) {
    await dialog.notify({ title: 'Faltan datos', message: 'Con transferencias activas, banco, número y titular son obligatorios.', tone: 'warning' })
    return
  }
  await save()
}

// Vista previa de lo que el bot manda al cliente. WhatsApp pone en negrita el *texto*.
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
const previewHtml = computed(() => escapeHtml(preview.value).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>'))
const preview = computed(() =>
  [
    form.bank && `🏦 *${form.bank}*`,
    form.accountType && `Cuenta ${form.accountType}`,
    `N.º *${form.accountNumber || '—'}*`,
    form.accountHolder && `A nombre de: ${form.accountHolder}`,
    form.holderId && `RUC/Cédula: ${form.holderId}`,
  ]
    .filter(Boolean)
    .join('\n'),
)

onMounted(load)
</script>

<template>
  <div class="payments-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-building-columns" aria-hidden="true"></i> Métodos de pago</p>
        <h1>Pagos por<br /><em>transferencia.</em></h1>
        <p>Activa o desactiva la transferencia bancaria para la tienda web y el bot de WhatsApp.</p>
      </div>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <p v-if="loading" class="state">Cargando configuración…</p>

    <template v-else>
      <section class="switch-card" :class="{ on: form.enabled }" data-admin-reveal>
        <div class="switch-copy">
          <strong>{{ form.enabled ? 'Transferencias activas' : 'Transferencias desactivadas' }}</strong>
          <span>
            {{
              form.enabled
                ? 'Los clientes pueden elegir transferencia en la web y en WhatsApp.'
                : 'Ni la web ni el bot ofrecen transferencia. Solo tarjeta (Payphone) o WhatsApp.'
            }}
          </span>
          <small v-if="updatedAt">Último cambio: {{ updatedBy || 'equipo' }} · {{ formatDate(updatedAt) }}</small>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="form.enabled"
          aria-label="Aceptar transferencias"
          :disabled="saving"
          @click="toggle"
        >
          <span class="knob"></span>
        </button>
      </section>

      <section class="workspace" data-admin-reveal>
        <form class="account-card" @submit.prevent="submit">
          <div class="card-title">
            <div class="title-icon"><i class="fa-solid fa-landmark" aria-hidden="true"></i></div>
            <div><span>Cuenta de destino</span><h2>Datos bancarios</h2></div>
          </div>

          <div class="form-body">
            <label class="field">
              <span>Banco</span>
              <input v-model="form.bank" maxlength="80" placeholder="Banco Pichincha" />
            </label>

            <fieldset class="field">
              <span>Tipo de cuenta</span>
              <div class="choices">
                <label v-for="type in ACCOUNT_TYPES" :key="type" class="choice" :class="{ active: form.accountType === type }">
                  <input v-model="form.accountType" type="radio" name="account-type" :value="type" class="visually-hidden" />
                  {{ type === 'corriente' ? 'Corriente' : 'Ahorros' }}
                </label>
              </div>
            </fieldset>

            <label class="field">
              <span>Número de cuenta</span>
              <input v-model="form.accountNumber" inputmode="numeric" maxlength="30" placeholder="2100123456" />
            </label>

            <label class="field">
              <span>Titular</span>
              <input v-model="form.accountHolder" maxlength="100" placeholder="Megaprinter S.A." />
            </label>

            <label class="field">
              <span>RUC o cédula del titular</span>
              <input v-model="form.holderId" inputmode="numeric" maxlength="13" placeholder="0999999999001" />
            </label>

            <button type="submit" :disabled="saving || !dirty">
              <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
              {{ saving ? 'Guardando…' : dirty ? 'Guardar datos' : 'Sin cambios' }}
            </button>
          </div>
        </form>

        <aside class="preview-card">
          <header>
            <div><span>Vista previa</span><h2>Lo que ve el cliente</h2></div>
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
          </header>
          <!-- eslint-disable-next-line vue/no-v-html -- texto escapado arriba -->
          <p class="bubble" v-html="previewHtml"></p>
          <p class="hint">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            El cliente envía la foto del comprobante y aparece en Pedidos como «Comprobante por revisar». El pago lo
            aprueba siempre una persona del equipo.
          </p>
        </aside>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.payments-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.notice {
  @include admin-notice;
}

.state {
  padding-block: $space-8;
  color: $text-muted;
  text-align: center;
}

.switch-card {
  @include row($space-4);
  justify-content: space-between;
  padding: $space-5 $space-6;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;

  &.on {
    border-color: $success-500;
  }
}

.switch-copy {
  @include stack($space-1);
  min-width: 0;

  strong {
    font-size: $text-subheading;
  }

  span {
    color: $text-body;
    font-size: $text-body-sm;
  }

  small {
    @include mono-data($text-muted, $text-eyebrow);
  }
}

.switch {
  position: relative;
  display: flex;
  width: 56px;
  height: 32px;
  flex: none;
  align-items: center;
  padding: 3px;
  border: 0;
  border-radius: $radius-pill;
  background: $key-300;
  cursor: pointer;
  transition: background $duration-base $ease-out;
  @include focus-ring;

  .knob {
    width: 26px;
    height: 26px;
    border-radius: $radius-pill;
    background: $paper-white;
    box-shadow: $shadow-xs;
    transition: transform $duration-base $ease-out;
  }

  &[aria-checked='true'] {
    background: $success-500;

    .knob {
      transform: translateX(24px);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  @include reduced-motion {
    transition: none;

    .knob {
      transition: none;
    }
  }
}

.workspace {
  @include stack($space-5);
}

.account-card,
.preview-card {
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.card-title {
  @include admin-card-title;
}

.form-body {
  @include stack($space-4);
  padding: $space-6;
}

.field {
  @include admin-field;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.choices {
  display: flex;
  gap: $space-2;
}

.choice {
  // Ancla el radio oculto: sin esto queda fuera de pantalla y crea scroll horizontal.
  position: relative;
  flex: 1;
  padding: $space-3;
  border: 1px solid $border-strong;
  border-radius: $radius-sm;
  color: $text-body;
  font-size: $text-body-sm;
  text-align: center;
  cursor: pointer;

  &.active {
    border-color: $cyan;
    background: $brand-100;
    color: $text-strong;
    font-weight: $weight-semibold;
  }

  &:focus-within {
    outline: 2px solid $cyan;
    outline-offset: 2px;
  }
}

.form-body > button {
  @include button-primary;
  padding: $space-4;
}

.preview-card {
  @include stack($space-4);
  padding: $space-6;

  > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    span {
      @include eyebrow;
    }

    h2 {
      margin-top: 2px;
      font-size: $text-subheading;
    }

    > i {
      color: $whatsapp;
      font-size: 1.35rem;
    }
  }
}

.bubble {
  align-self: flex-start;
  max-width: 100%;
  padding: $space-3 $space-4;
  border-radius: $radius-md $radius-md $radius-md $radius-xs;
  background: rgba($whatsapp, 0.16);
  color: $key-900;
  font-size: $text-body-sm;
  line-height: $leading-body;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.hint {
  @include row($space-2, flex-start);
  color: $text-muted;
  font-size: $text-caption;
  line-height: $leading-body;

  i {
    margin-top: 3px;
    color: $brand-500;
  }
}

@include from($bp-md) {
  .workspace {
    flex-direction: row;
    align-items: flex-start;
  }

  .account-card {
    flex: 1;
    min-width: 0;
  }

  .preview-card {
    width: 38%;
    flex: none;
  }
}
</style>
