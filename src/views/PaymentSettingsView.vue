<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { getPaymentSettings, savePaymentSettings, type BankAccount, type KnownBank, type PaymentSettings } from '@/services/settings'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate } from '@/components/admin/orderHelpers'

/**
 * Cuentas para transferencias. Encendido, la web y el bot ofrecen transferir;
 * el bot pregunta a qué banco y solo envía la cuenta que el cliente elige.
 */

useAdminEntrance()
const dialog = useDialogStore()

const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const enabled = ref(false)
const accounts = ref<BankAccount[]>([])
const knownBanks = ref<KnownBank[]>([])
const updatedBy = ref('')
const updatedAt = ref<string | null>(null)

const activeAccounts = computed(() => accounts.value.filter((account) => account.active))

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

const apply = (data: PaymentSettings) => {
  enabled.value = data.transfer.enabled
  accounts.value = data.transfer.accounts
  knownBanks.value = data.knownBanks
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

/** Guarda todo (interruptor + cuentas). Devuelve false si el backend lo rechaza. */
const persist = async (next: { enabled: boolean; accounts: BankAccount[] }, successText: string) => {
  saving.value = true
  try {
    apply(await savePaymentSettings(next))
    flash(successText)
    return true
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Revisa los datos.'), tone: 'danger' })
    return false
  } finally {
    saving.value = false
  }
}

const toggleEnabled = async () => {
  const turningOn = !enabled.value
  if (turningOn && !activeAccounts.value.length) {
    await dialog.notify({ title: 'Agrega una cuenta primero', message: 'Necesitas al menos una cuenta activa para aceptar transferencias.', tone: 'warning' })
    return
  }
  const confirmed = await dialog.confirm({
    title: turningOn ? '¿Activar transferencias?' : '¿Desactivar transferencias?',
    message: turningOn
      ? `La web y el bot ofrecerán transferir a ${activeAccounts.value.length === 1 ? 'esta cuenta' : `estas ${activeAccounts.value.length} cuentas`}. El bot pregunta el banco y solo envía la cuenta elegida.`
      : 'Los clientes nuevos ya no verán la opción. Los pedidos por transferencia que ya existen siguen pudiendo pagar.',
    detail: turningOn ? activeAccounts.value.map((account) => account.bank).join(' · ') : undefined,
    confirmLabel: turningOn ? 'Activar' : 'Desactivar',
    tone: turningOn ? 'success' : 'warning',
    icon: 'fa-solid fa-building-columns',
  })
  if (!confirmed) return
  await persist({ enabled: turningOn, accounts: accounts.value }, turningOn ? 'Transferencias activadas en la web y el bot.' : 'Transferencias desactivadas.')
}

const toggleAccount = async (index: number) => {
  const target = accounts.value[index]
  if (!target) return
  const next = accounts.value.map((account, position) => (position === index ? { ...account, active: !account.active } : account))
  const stillActive = next.some((account) => account.active)
  // Si se apaga la ultima cuenta activa, se apagan tambien las transferencias.
  await persist(
    { enabled: enabled.value && stillActive, accounts: next },
    target.active ? `${target.bank} pausada: el bot ya no la ofrece.` : `${target.bank} activada.`,
  )
}

const removeAccount = async (index: number) => {
  const account = accounts.value[index]
  if (!account) return
  const confirmed = await dialog.confirm({
    title: '¿Eliminar esta cuenta?',
    message: 'Los pedidos que ya la eligieron conservan sus datos para pagar.',
    detail: `${account.bank} · ${account.accountNumber}`,
    confirmLabel: 'Eliminar',
    tone: 'danger',
  })
  if (!confirmed) return
  const next = accounts.value.filter((_, position) => position !== index)
  await persist({ enabled: enabled.value && next.some((item) => item.active), accounts: next }, `Cuenta de ${account.bank} eliminada.`)
}

// ─── Formulario de cuenta ────────────────────────────────────────────────────

const editing = ref<number | null>(null)
const formOpen = ref(false)
const form = reactive<BankAccount>({
  bankCode: 'pichincha',
  bank: '',
  accountType: 'de ahorros',
  accountNumber: '',
  accountHolder: '',
  holderId: '',
  logoUrl: '',
  active: true,
})
const ACCOUNT_TYPES = [
  { value: 'de ahorros', label: 'Ahorros' },
  { value: 'corriente', label: 'Corriente' },
]

const bankOptions = computed(() => [...knownBanks.value, { code: 'otro', name: 'Otro banco', logoUrl: '' }])
const formLogo = computed(() => form.logoUrl || knownBanks.value.find((bank) => bank.code === form.bankCode)?.logoUrl || '')

const openForm = (index: number | null) => {
  editing.value = index
  const base = index === null ? null : accounts.value[index]
  // Al agregar, se repite el titular de la ultima cuenta (suele ser el mismo).
  const last = accounts.value.at(-1)
  Object.assign(form, {
    id: base?.id,
    bankCode: base?.bankCode ?? 'pichincha',
    bank: base?.bankCode === 'otro' ? base.bank : '',
    accountType: base?.accountType ?? 'de ahorros',
    accountNumber: base?.accountNumber ?? '',
    accountHolder: base?.accountHolder ?? last?.accountHolder ?? '',
    holderId: base?.holderId ?? last?.holderId ?? '',
    logoUrl: base && !knownBanks.value.some((bank) => bank.logoUrl === base.logoUrl) ? base.logoUrl : '',
    active: base?.active ?? true,
  })
  formOpen.value = true
}

const submitForm = async () => {
  const known = knownBanks.value.find((bank) => bank.code === form.bankCode)
  const account: BankAccount = { ...form, bank: known ? known.name : form.bank.trim() }
  const next = editing.value === null ? [...accounts.value, account] : accounts.value.map((item, index) => (index === editing.value ? account : item))
  const ok = await persist({ enabled: enabled.value, accounts: next }, editing.value === null ? `Cuenta de ${account.bank} agregada.` : 'Cuenta actualizada.')
  if (ok) formOpen.value = false
}

// Vista previa de lo que el bot manda.
const previewQuestion = computed(() =>
  activeAccounts.value.length > 1
    ? `A qué banco te queda mejor transferir? 🏦✨\n${activeAccounts.value.map((account, index) => `*${index + 1}.* ${account.bank}`).join('\n')}\n\nRespóndeme con el número o el nombre del banco 😊`
    : '',
)
const previewAccount = computed(() => {
  const account = activeAccounts.value[0]
  if (!account) return ''
  return [
    `🏦 *${account.bank}*`,
    account.accountType && `Cuenta ${account.accountType}`,
    `N.º *${account.accountNumber}*`,
    account.accountHolder && `A nombre de: ${account.accountHolder}`,
    account.holderId && `RUC/Cédula: ${account.holderId}`,
  ]
    .filter(Boolean)
    .join('\n')
})
const bold = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')

onMounted(load)
</script>

<template>
  <div class="payments-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-building-columns" aria-hidden="true"></i> Métodos de pago</p>
        <h1>Pagos por transferencia</h1>
        <p>Carga las cuentas, actívalas o páusalas. El bot pregunta a qué banco prefiere el cliente y solo le envía esa cuenta.</p>
      </div>
      <button type="button" class="add" :disabled="saving || loading" @click="openForm(null)">
        <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar cuenta
      </button>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <p v-if="loading" class="state">Cargando configuración…</p>

    <template v-else>
      <section class="switch-card" :class="{ on: enabled }" data-admin-reveal>
        <span class="switch-icon"><i :class="enabled ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-pause'" aria-hidden="true"></i></span>
        <div class="switch-copy">
          <strong>{{ enabled ? 'Transferencias activas' : 'Transferencias desactivadas' }}</strong>
          <span>
            {{
              enabled
                ? `Se ofrecen ${activeAccounts.length} ${activeAccounts.length === 1 ? 'cuenta' : 'cuentas'} en la web y en WhatsApp.`
                : 'Ni la web ni el bot ofrecen transferencia. Solo tarjeta (Payphone) o WhatsApp.'
            }}
          </span>
          <small v-if="updatedAt">Último cambio: {{ updatedBy || 'equipo' }} · {{ formatDate(updatedAt) }}</small>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          :aria-checked="enabled"
          aria-label="Aceptar transferencias"
          :disabled="saving"
          @click="toggleEnabled"
        >
          <span class="knob"></span>
        </button>
      </section>

      <section class="workspace" data-admin-reveal>
        <div class="accounts">
          <header class="section-head">
            <h2>Cuentas de destino</h2>
            <span class="count">{{ activeAccounts.length }} de {{ accounts.length }} activas</span>
          </header>

          <div v-if="!accounts.length" class="empty">
            <i class="fa-solid fa-building-columns" aria-hidden="true"></i>
            <p>Todavía no hay cuentas. Agrega la primera para activar las transferencias.</p>
            <button type="button" class="add" :disabled="saving" @click="openForm(null)">
              <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar cuenta
            </button>
          </div>

          <div v-else class="account-list">
            <article v-for="(account, index) in accounts" :key="account.id || index" class="account" :class="{ paused: !account.active }">
              <div class="account-top">
                <span class="logo">
                  <img v-if="account.logoUrl" :src="account.logoUrl" :alt="`Logo de ${account.bank}`" loading="lazy" />
                  <i v-else class="fa-solid fa-building-columns" aria-hidden="true"></i>
                </span>
                <div class="account-title">
                  <strong>{{ account.bank }}</strong>
                  <span class="type">Cuenta {{ account.accountType || '—' }}</span>
                </div>
                <span class="state-badge" :class="{ on: account.active }">{{ account.active ? 'Activa' : 'Pausada' }}</span>
              </div>

              <p class="number">{{ account.accountNumber }}</p>
              <p class="holder">
                <i class="fa-regular fa-user" aria-hidden="true"></i>
                <span>{{ account.accountHolder }}<template v-if="account.holderId"> · {{ account.holderId }}</template></span>
              </p>

              <footer class="account-actions">
                <label class="toggle-label">
                  <button
                    type="button"
                    class="mini-switch"
                    role="switch"
                    :aria-checked="account.active"
                    :aria-label="`${account.active ? 'Pausar' : 'Activar'} ${account.bank}`"
                    :disabled="saving"
                    @click="toggleAccount(index)"
                  >
                    <span class="knob"></span>
                  </button>
                  <span aria-hidden="true">{{ account.active ? 'El bot la ofrece' : 'No se ofrece' }}</span>
                </label>
                <div class="icons">
                  <button type="button" class="icon" :aria-label="`Editar ${account.bank}`" title="Editar" :disabled="saving" @click="openForm(index)">
                    <i class="fa-solid fa-pen" aria-hidden="true"></i>
                  </button>
                  <button type="button" class="icon danger" :aria-label="`Eliminar ${account.bank}`" title="Eliminar" :disabled="saving" @click="removeAccount(index)">
                    <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
                  </button>
                </div>
              </footer>
            </article>
          </div>
        </div>

        <aside class="preview-card">
          <header class="preview-head">
            <span class="wa-avatar"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
            <div>
              <strong>Vista previa</strong>
              <span>Lo que recibe el cliente por WhatsApp</span>
            </div>
          </header>
          <div class="chat">
            <template v-if="activeAccounts.length">
              <!-- eslint-disable-next-line vue/no-v-html -- texto escapado en bold() -->
              <p v-if="previewQuestion" class="bubble" v-html="bold(previewQuestion)"></p>
              <p v-if="previewQuestion" class="hint-line">Cuando elige, recibe solo esa cuenta:</p>
              <!-- eslint-disable-next-line vue/no-v-html -- texto escapado en bold() -->
              <p class="bubble" v-html="bold(previewAccount)"></p>
            </template>
            <p v-else class="hint-line">Activa al menos una cuenta para ver el mensaje.</p>
          </div>
          <p class="hint">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            El cliente envía la foto del comprobante y aparece en Pedidos como «Comprobante por revisar». El pago lo aprueba
            siempre una persona del equipo.
          </p>
        </aside>
      </section>
    </template>

    <AppModal
      :open="formOpen"
      size="md"
      :eyebrow="editing === null ? 'Nueva cuenta' : 'Editar cuenta'"
      :title="editing === null ? 'Agregar cuenta bancaria' : 'Datos de la cuenta'"
      @close="formOpen = false"
    >
      <form id="account-form" class="account-form" @submit.prevent="submitForm">
        <fieldset class="field">
          <span>Banco</span>
          <div class="bank-picker">
            <label v-for="bank in bankOptions" :key="bank.code" class="bank-option" :class="{ active: form.bankCode === bank.code }">
              <input v-model="form.bankCode" type="radio" name="bank" :value="bank.code" class="visually-hidden" />
              <img v-if="bank.logoUrl" :src="bank.logoUrl" alt="" loading="lazy" />
              <i v-else class="fa-solid fa-building-columns" aria-hidden="true"></i>
              {{ bank.name }}
            </label>
          </div>
        </fieldset>

        <label v-if="form.bankCode === 'otro'" class="field">
          <span>Nombre del banco o cooperativa</span>
          <input v-model="form.bank" required maxlength="80" placeholder="Cooperativa Andalucía" />
        </label>

        <fieldset class="field">
          <span>Tipo de cuenta</span>
          <div class="choices">
            <label v-for="type in ACCOUNT_TYPES" :key="type.value" class="choice" :class="{ active: form.accountType === type.value }">
              <input v-model="form.accountType" type="radio" name="account-type" :value="type.value" class="visually-hidden" />
              {{ type.label }}
            </label>
          </div>
        </fieldset>

        <label class="field">
          <span>Número de cuenta</span>
          <input v-model="form.accountNumber" required inputmode="numeric" maxlength="30" placeholder="2203005219" />
        </label>
        <label class="field">
          <span>Titular</span>
          <input v-model="form.accountHolder" required maxlength="100" placeholder="Nombre del titular" />
        </label>
        <label class="field">
          <span>RUC o cédula del titular</span>
          <input v-model="form.holderId" inputmode="numeric" maxlength="13" placeholder="1314709419" />
        </label>
        <label class="field">
          <span>Logo (opcional, URL https)</span>
          <div class="logo-row">
            <span class="logo small">
              <img v-if="formLogo" :src="formLogo" alt="" />
              <i v-else class="fa-solid fa-building-columns" aria-hidden="true"></i>
            </span>
            <input v-model="form.logoUrl" type="url" maxlength="500" placeholder="Se usa el logo del banco automáticamente" />
          </div>
        </label>
      </form>
      <template #footer>
        <button type="button" class="ghost" @click="formOpen = false">Cancelar</button>
        <button type="submit" form="account-form" class="primary" :disabled="saving">
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
          {{ saving ? 'Guardando…' : 'Guardar cuenta' }}
        </button>
      </template>
    </AppModal>
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
  padding-block: $space-10;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.add {
  @include button-primary;
  align-self: flex-start;
  flex: none;
  box-shadow: none;
}

// ─── Interruptor general ────────────────────────────────────────────────────
.switch-card {
  @include admin-card($space-5);
  @include row($space-4);
  border-left: 4px solid $key-300;

  &.on {
    border-left-color: $ok;
  }
}

.switch-icon {
  display: none;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: $surface-sunken;
  color: $text-muted;
  font-size: 1.25rem;

  .on & {
    background: $ok-wash;
    color: $ok;
  }
}

.switch-copy {
  @include stack(4px);
  min-width: 0;
  flex: 1;

  strong {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }

  span {
    color: $text-body;
    font-size: $admin-text-md;
    line-height: $leading-body;
  }

  small {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

@mixin toggle($width, $height) {
  position: relative;
  display: flex;
  width: $width;
  height: $height;
  flex: none;
  align-items: center;
  padding: 3px;
  border: 0;
  border-radius: $radius-pill;
  background: $key-200;
  cursor: pointer;
  transition: background $duration-base $ease-out;
  @include focus-ring;

  .knob {
    width: $height - 6px;
    height: $height - 6px;
    border-radius: $radius-pill;
    background: $paper-white;
    box-shadow: $shadow-xs;
    transition: transform $duration-base $ease-out;
  }

  &[aria-checked='true'] {
    background: $ok;

    .knob {
      transform: translateX($width - $height);
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

.switch {
  @include toggle(56px, 32px);
}

.mini-switch {
  @include toggle(42px, 24px);
}

// ─── Cuentas ────────────────────────────────────────────────────────────────
.workspace {
  @include stack($space-6);
}

.accounts {
  @include stack($space-3);
  min-width: 0;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;

  h2 {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }

  .count {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

.empty {
  @include admin-card($space-10 $space-5);
  @include stack($space-3);
  align-items: center;
  color: $text-body;
  font-size: $admin-text-md;
  text-align: center;

  > i {
    color: $cyan;
    font-size: 1.75rem;
  }
}

.account-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.account {
  @include admin-card($space-5);
  @include stack($space-3);
  flex: 1 1 280px;
  min-width: 0;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out, opacity $duration-base $ease-out;

  @media (hover: hover) {
    &:hover {
      border-color: $border-strong;
      box-shadow: $shadow-sm;
    }
  }

  &.paused {
    background: $surface-page;

    .logo,
    .account-title,
    .number,
    .holder {
      opacity: 0.55;
    }
  }
}

.account-top {
  @include row($space-3);
}

.logo {
  display: flex;
  width: 48px;
  height: 48px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $paper-white;
  color: $text-muted;

  img {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }

  &.small {
    width: 44px;
    height: 44px;

    img {
      width: 28px;
      height: 28px;
    }
  }
}

.account-title {
  @include stack(2px);
  min-width: 0;
  flex: 1;

  strong {
    @include truncate;
    color: $text-strong;
    font-size: $admin-text-base;
    font-weight: $weight-bold;
  }

  .type {
    color: $text-body;
    font-size: $admin-text-sm;
  }
}

.state-badge {
  @include admin-badge($text-muted, $surface-sunken);
  flex: none;

  &.on {
    background: $ok-wash;
    color: $ok;
  }
}

.number {
  @include mono-data($text-strong, 1.25rem);
  font-weight: $weight-medium;
  letter-spacing: 0.06em;
  overflow-wrap: anywhere;
}

.holder {
  @include row($space-2, flex-start);
  color: $text-body;
  font-size: $admin-text-sm;

  i {
    margin-top: 3px;
    color: $text-muted;
  }
}

.account-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  margin-top: $space-1;
  padding-top: $space-3;
  border-top: 1px solid $border-subtle;
}

.toggle-label {
  @include row($space-2);
  color: $text-body;
  font-size: $admin-text-sm;
}

.icons {
  @include row($space-1);
}

.icon {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  padding: 0;

  &:hover:not(:disabled) {
    color: $text-strong;
  }

  &.danger:hover:not(:disabled) {
    background: $danger-100;
    color: $danger-500;
  }
}

// ─── Vista previa ───────────────────────────────────────────────────────────
.preview-card {
  @include admin-card(0);
  overflow: hidden;
}

.preview-head {
  @include row($space-3);
  padding: $space-4 $space-5;
  background: #075e54;
  color: $paper-white;

  div {
    @include stack(2px);
  }

  strong {
    font-size: $admin-text-md;
  }

  span {
    color: rgba(255, 255, 255, 0.78);
    font-size: $admin-text-xs;
  }
}

.wa-avatar {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.16);
  font-size: 1.15rem;
}

.chat {
  @include stack($space-3);
  padding: $space-5;
  background: #efeae2;
}

.bubble {
  align-self: flex-start;
  max-width: 92%;
  padding: $space-3 $space-4;
  border-radius: $radius-xs $radius-md $radius-md $radius-md;
  background: $paper-white;
  box-shadow: 0 1px 1px rgba(12, 12, 14, 0.12);
  color: $key-900;
  font-size: $admin-text-md;
  line-height: $leading-body;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.hint-line {
  align-self: center;
  padding: 4px 10px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.7);
  color: $text-body;
  font-size: $admin-text-xs;
  text-align: center;
}

.hint {
  @include row($space-2, flex-start);
  padding: $space-4 $space-5;
  color: $text-body;
  font-size: $admin-text-sm;
  line-height: $leading-body;

  i {
    margin-top: 3px;
    color: $cyan-deep;
  }
}

// ─── Formulario de cuenta ───────────────────────────────────────────────────
.account-form {
  @include stack($space-5);
}

.field {
  @include admin-field;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.bank-picker {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.bank-option {
  @include row($space-2);
  position: relative;
  flex: 1 1 170px;
  min-height: 48px;
  padding: $space-2 $space-3;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  background: $surface-card;
  color: $text-body;
  font-size: $admin-text-md;
  cursor: pointer;
  transition: border-color $duration-base $ease-out, background $duration-base $ease-out;

  img {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  &:hover {
    border-color: $cyan-soft;
  }

  &.active {
    border-color: $cyan;
    background: $cyan-wash;
    box-shadow: inset 0 0 0 1px $cyan;
    color: $text-strong;
    font-weight: $weight-semibold;
  }

  &:focus-within {
    outline: 2px solid $cyan;
    outline-offset: 2px;
  }
}

.choices {
  display: flex;
  gap: $space-2;
}

.choice {
  position: relative;
  flex: 1;
  min-height: 48px;
  padding: $space-3;
  border: 1px solid $border-strong;
  border-radius: $radius-md;
  color: $text-body;
  font-size: $admin-text-md;
  text-align: center;
  cursor: pointer;

  &:hover {
    border-color: $cyan-soft;
  }

  &.active {
    border-color: $cyan;
    background: $cyan-wash;
    box-shadow: inset 0 0 0 1px $cyan;
    color: $text-strong;
    font-weight: $weight-semibold;
  }

  &:focus-within {
    outline: 2px solid $cyan;
    outline-offset: 2px;
  }
}

.logo-row {
  @include row($space-2);

  input {
    flex: 1;
    min-width: 0;
  }
}

.ghost {
  @include button-secondary;
}

.primary {
  @include button-primary;
}

@include from($bp-sm) {
  .switch-icon {
    display: flex;
  }
}

@include from($bp-lg) {
  .workspace {
    flex-direction: row;
    align-items: flex-start;
  }

  .accounts {
    flex: 1;
  }

  .preview-card {
    position: sticky;
    top: $space-6;
    width: 360px;
    flex: none;
  }
}
</style>
