<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import {
  createTechnician,
  formatPhone,
  listTechnicians,
  resetTechnicianPassword,
  updateTechnician,
} from '@/services/technicians'
import type { InternalUser } from '@/services/users'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'

/**
 * Técnicos del servicio técnico. Entran al panel con su WhatsApp, cédula o
 * correo (cualquiera de los que tengan) y solo ven el tablero de tickets.
 * Desactivar corta el acceso al instante sin perder su historial.
 */

useAdminEntrance()
const dialog = useDialogStore()

const technicians = ref<InternalUser[]>([])
const loading = ref(true)
const saving = ref(false)
const togglingId = ref('')
const notice = ref('')
const form = reactive({ name: '', phone: '', cedula: '', email: '', password: '' })

const editing = ref<InternalUser | null>(null)
const editForm = reactive({ name: '', phone: '', cedula: '', email: '' })
const newPassword = ref('')

const activeCount = computed(() => technicians.value.filter((tech) => tech.active).length)

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

/** Con qué puede entrar: lo que se le dice al técnico. */
const accessLines = (tech: InternalUser) =>
  [
    tech.phone && { icon: 'fa-brands fa-whatsapp', text: formatPhone(tech.phone) },
    tech.cedula && { icon: 'fa-solid fa-id-card', text: tech.cedula },
    tech.email && { icon: 'fa-solid fa-envelope', text: tech.email },
  ].filter(Boolean) as Array<{ icon: string; text: string }>

// Sin 0/O ni 1/l para que se pueda dictar por teléfono sin confusiones.
const generatePassword = () => {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  const values = crypto.getRandomValues(new Uint32Array(8))
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('')
}

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 5000)
}

const fail = (title: string, caught: unknown, fallback: string) =>
  dialog.notify({ title, message: errorMessage(caught, fallback), tone: 'danger' })

const load = async () => {
  loading.value = true
  try {
    technicians.value = await listTechnicians()
  } catch (caught) {
    await fail('No pudimos cargar los técnicos', caught, 'Intenta nuevamente en unos segundos.')
  } finally {
    loading.value = false
  }
}

const create = async () => {
  if (!form.phone.trim() && !form.cedula.trim() && !form.email.trim()) {
    await dialog.notify({
      title: 'Falta un dato de acceso',
      message: 'Agrega WhatsApp, cédula o correo: con cualquiera de ellos entra el técnico.',
      tone: 'warning',
    })
    return
  }
  saving.value = true
  try {
    const password = form.password
    const created = await createTechnician({
      name: form.name.trim(),
      phone: form.phone.trim(),
      cedula: form.cedula.trim(),
      email: form.email.trim(),
      password,
    })
    Object.assign(form, { name: '', phone: '', cedula: '', email: '', password: '' })
    await load()
    await dialog.notify({
      title: `${created.name} ya puede entrar`,
      message: `En megaprinter.ec/login, con su ${accessLines(created).length > 1 ? 'WhatsApp, cédula o correo' : 'dato de acceso'} y esta contraseña. Compártela por un canal seguro.`,
      detail: `${accessLines(created).map((line) => line.text).join(' · ')}  ·  ${password}`,
      tone: 'success',
      icon: 'fa-solid fa-user-check',
    })
  } catch (caught) {
    await fail('No se pudo crear el técnico', caught, 'Revisa los datos e intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (tech: InternalUser) => {
  if (tech.active) {
    const confirmed = await dialog.confirm({
      title: '¿Desactivar este técnico?',
      message: 'Dejará de poder entrar al panel de inmediato. Sus tickets e historial se conservan.',
      detail: tech.name,
      confirmLabel: 'Desactivar',
      tone: 'danger',
    })
    if (!confirmed) return
  }
  togglingId.value = tech.id
  try {
    await updateTechnician(tech.id, { active: !tech.active })
    flash(tech.active ? `${tech.name} quedó desactivado.` : `${tech.name} puede volver a entrar.`)
    await load()
  } catch (caught) {
    await fail('No se pudo cambiar el acceso', caught, 'Intenta nuevamente en unos segundos.')
  } finally {
    togglingId.value = ''
  }
}

const openEdit = (tech: InternalUser) => {
  editing.value = tech
  Object.assign(editForm, { name: tech.name, phone: formatPhone(tech.phone), cedula: tech.cedula, email: tech.email })
  newPassword.value = ''
}

const saveEdit = async () => {
  if (!editing.value) return
  saving.value = true
  try {
    const updated = await updateTechnician(editing.value.id, {
      name: editForm.name.trim(),
      phone: editForm.phone.trim(),
      cedula: editForm.cedula.trim(),
      email: editForm.email.trim(),
    })
    flash(`Datos de ${updated.name} actualizados.`)
    editing.value = null
    await load()
  } catch (caught) {
    await fail('No se pudo guardar', caught, 'Revisa los datos e intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

const savePassword = async () => {
  if (!editing.value) return
  saving.value = true
  try {
    const password = newPassword.value
    await resetTechnicianPassword(editing.value.id, password)
    newPassword.value = ''
    await dialog.notify({
      title: 'Contraseña cambiada',
      message: `Compártela con ${editing.value.name} por un canal seguro.`,
      detail: password,
      tone: 'success',
      icon: 'fa-solid fa-key',
    })
  } catch (caught) {
    await fail('No se pudo cambiar la contraseña', caught, 'Intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="techs-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-user-gear" aria-hidden="true"></i> Servicio técnico</p>
        <h1>Técnicos</h1>
        <p>Entran con su WhatsApp, cédula o correo y solo ven los tickets: los toman, los mueven y dejan notas.</p>
      </div>
      <div class="team-count">
        <i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i>
        <strong>{{ activeCount }}</strong>
        <span>{{ activeCount === 1 ? 'técnico activo' : 'técnicos activos' }}</span>
      </div>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <section class="workspace" data-admin-reveal>
      <form class="create-card" @submit.prevent="create">
        <header class="card-head">
          <span class="title-icon"><i class="fa-solid fa-user-plus" aria-hidden="true"></i></span>
          <div>
            <p class="eyebrow">Nuevo técnico</p>
            <h2>Dar acceso</h2>
          </div>
        </header>

        <div class="form-body">
          <label class="field">
            <span>Nombre</span>
            <input v-model="form.name" required maxlength="120" placeholder="Nombre y apellido" autocomplete="off" />
          </label>

          <label class="field">
            <span>WhatsApp</span>
            <div class="input-icon">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
              <input v-model="form.phone" type="tel" inputmode="tel" placeholder="0991234567" autocomplete="off" />
            </div>
          </label>

          <label class="field">
            <span>Cédula</span>
            <div class="input-icon">
              <i class="fa-solid fa-id-card" aria-hidden="true"></i>
              <input v-model="form.cedula" inputmode="numeric" maxlength="13" placeholder="0912345678" autocomplete="off" />
            </div>
          </label>

          <label class="field">
            <span>Correo (opcional)</span>
            <div class="input-icon">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <input v-model="form.email" type="email" placeholder="tecnico@correo.com" autocomplete="off" />
            </div>
          </label>

          <label class="field">
            <span>Contraseña inicial</span>
            <div class="password-row">
              <div class="input-icon">
                <i class="fa-solid fa-key" aria-hidden="true"></i>
                <input v-model="form.password" minlength="8" required placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              </div>
              <button type="button" class="generate" @click="form.password = generatePassword()">
                <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Generar
              </button>
            </div>
          </label>

          <p class="security-note">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            Con al menos uno basta: WhatsApp, cédula o correo. El técnico entra con cualquiera de ellos.
          </p>

          <button type="submit" :disabled="saving">
            <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-user-check'" aria-hidden="true"></i>
            {{ saving ? 'Creando…' : 'Crear técnico' }}
          </button>
        </div>
      </form>

      <section class="member-card">
        <header class="card-head">
          <span class="title-icon"><i class="fa-solid fa-address-book" aria-hidden="true"></i></span>
          <div>
            <p class="eyebrow">Equipo</p>
            <h2>Técnicos con acceso</h2>
          </div>
        </header>

        <p v-if="loading" class="state">Cargando técnicos…</p>

        <ul v-else-if="technicians.length" class="members">
          <li v-for="tech in technicians" :key="tech.id" :class="{ inactive: !tech.active }">
            <span class="avatar" aria-hidden="true">{{ initials(tech.name) }}</span>
            <div class="member-copy">
              <strong>
                <span class="name">{{ tech.name }}</span>
                <small v-if="!tech.active" class="off">Desactivado</small>
              </strong>
              <span v-for="line in accessLines(tech)" :key="line.text" class="access">
                <i :class="line.icon" aria-hidden="true"></i>{{ line.text }}
              </span>
            </div>
            <div class="member-side">
              <button type="button" class="action" :disabled="saving" title="Editar o cambiar contraseña" @click="openEdit(tech)">
                <i class="fa-solid fa-pen" aria-hidden="true"></i><span>Editar</span>
              </button>
              <button
                type="button"
                class="action"
                :class="tech.active ? 'danger' : 'ok'"
                :disabled="togglingId === tech.id"
                @click="toggleActive(tech)"
              >
                <i
                  :class="togglingId === tech.id ? 'fa-solid fa-spinner fa-spin' : tech.active ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check'"
                  aria-hidden="true"
                ></i>
                <span>{{ tech.active ? 'Desactivar' : 'Activar' }}</span>
              </button>
            </div>
          </li>
        </ul>

        <div v-else class="empty">
          <i class="fa-solid fa-user-gear" aria-hidden="true"></i>
          <p>Aún no hay técnicos. Crea el primero con el formulario.</p>
        </div>
      </section>
    </section>

    <AppModal :open="!!editing" eyebrow="Técnico" :title="editing?.name ?? ''" @close="editing = null">
      <div v-if="editing" class="edit">
        <form class="edit-form" @submit.prevent="saveEdit">
          <label class="field">
            <span>Nombre</span>
            <input v-model="editForm.name" required maxlength="120" />
          </label>
          <label class="field">
            <span>WhatsApp</span>
            <input v-model="editForm.phone" type="tel" inputmode="tel" placeholder="0991234567" />
          </label>
          <label class="field">
            <span>Cédula</span>
            <input v-model="editForm.cedula" inputmode="numeric" maxlength="13" placeholder="0912345678" />
          </label>
          <label class="field">
            <span>Correo</span>
            <input v-model="editForm.email" type="email" placeholder="Opcional" />
          </label>
          <button type="submit" class="primary" :disabled="saving">
            <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i> Guardar datos
          </button>
        </form>

        <form class="edit-form password" @submit.prevent="savePassword">
          <p class="eyebrow">Nueva contraseña</p>
          <div class="password-row">
            <div class="input-icon">
              <i class="fa-solid fa-key" aria-hidden="true"></i>
              <input v-model="newPassword" minlength="8" required placeholder="Mínimo 8 caracteres" autocomplete="new-password" aria-label="Nueva contraseña" />
            </div>
            <button type="button" class="generate" @click="newPassword = generatePassword()">
              <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Generar
            </button>
          </div>
          <button type="submit" class="ghost-btn" :disabled="saving">
            <i class="fa-solid fa-rotate" aria-hidden="true"></i> Cambiar contraseña
          </button>
        </form>
      </div>
      <template #footer>
        <button type="button" class="ghost-btn" @click="editing = null">Cerrar</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
.techs-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.team-count {
  @include row($space-2);
  align-self: flex-start;
  padding: $space-2 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-card;
  color: $text-body;
  font-size: $admin-text-sm;

  i {
    color: $cyan-deep;
  }

  strong {
    color: $text-strong;
    font-family: $font-mono;
    font-size: $admin-text-base;
  }
}

.notice {
  @include admin-notice;
}

.workspace {
  @include stack($space-5);
}

.create-card,
.member-card {
  @include admin-card(0);
  overflow: hidden;
}

.card-head {
  @include row($space-3);
  padding: $space-5;
  border-bottom: 1px solid $border-subtle;

  h2 {
    margin-top: 2px;
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }
}

.title-icon {
  display: flex;
  width: 40px;
  height: 40px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $cyan-wash;
  color: $cyan-deep;
}

.form-body {
  @include stack($space-4);
  padding: $space-5;
}

.field {
  @include admin-field;
}

.input-icon {
  @include admin-input-icon;
  flex: 1;
  min-width: 0;
}

.password-row {
  display: flex;
  align-items: stretch;
  gap: $space-2;
}

.generate {
  @include button-secondary;
  flex: none;
  padding: $space-2 $space-3;
  font-size: $admin-text-sm;
}

.security-note {
  @include row($space-2, flex-start);
  padding: $space-3;
  border-radius: $radius-sm;
  background: $cyan-wash;
  color: $cyan-dark;
  font-size: $admin-text-sm;
  line-height: $leading-body;

  i {
    margin-top: 3px;
    color: $cyan-deep;
  }
}

.form-body > button {
  @include button-primary;
  min-height: 48px;
  font-size: $admin-text-md;
}

.members {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-3;
    padding: $space-4 $space-5;
    border-bottom: 1px solid $border-subtle;

    &:last-child {
      border-bottom: 0;
    }

    &.inactive {
      background: $surface-page;

      .avatar {
        background: $surface-sunken;
        color: $text-muted;
      }

      .name {
        color: $text-muted;
      }
    }
  }
}

.avatar {
  display: flex;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: $cyan-mist;
  color: $cyan-dark;
  font-size: $admin-text-sm;
  font-weight: $weight-bold;
  letter-spacing: 0.02em;
}

.member-copy {
  @include stack(2px);
  min-width: 0;
  flex: 1 1 180px;

  strong {
    @include row($space-2);
    min-width: 0;
    color: $text-strong;
    font-size: $admin-text-base;
    font-weight: $weight-semibold;
  }

  .name {
    @include truncate;
  }

  .off {
    @include admin-badge($danger-500, $danger-100);
    flex: none;
  }

  .access {
    @include row(6px);
    @include truncate;
    color: $text-body;
    font-size: $admin-text-sm;

    i {
      width: 14px;
      color: $text-muted;
      text-align: center;
    }
  }
}

// En el celular las acciones bajan a su propia fila, a todo el ancho.
.member-side {
  display: flex;
  flex: 1 1 100%;
  gap: $space-2;
}

.action {
  @include button-secondary;
  flex: 1;
  padding: $space-2 $space-3;
  font-size: $admin-text-sm;

  &.danger:hover:not(:disabled) {
    border-color: $danger-500;
    color: $danger-500;
  }

  &.ok {
    border-color: $cyan;
    color: $cyan-dark;
  }
}

.state {
  padding: $space-10 $space-5;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.empty {
  @include empty-state;
}

.edit {
  @include stack($space-6);
}

// .field ocupa toda la fila en el celular y comparte fila desde tablet.
.edit-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: $space-3;

  .field {
    flex: 1 1 220px;
  }

  .eyebrow,
  .password-row {
    flex: 1 1 100%;
  }

  &.password {
    padding-top: $space-5;
    border-top: 1px solid $border-subtle;
  }
}

.primary {
  @include button-primary;
  margin-left: auto;
}

.ghost-btn {
  @include button-secondary;
}

@include from($bp-sm) {
  .member-side {
    flex: none;
  }

  .action {
    flex: none;
  }
}

@include from($bp-lg) {
  .workspace {
    flex-direction: row;
    align-items: flex-start;
  }

  .create-card {
    width: 400px;
    flex: none;
  }

  .member-card {
    flex: 1;
    min-width: 0;
  }
}
</style>
