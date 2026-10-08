<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { createUser, deleteUser, listUsers, type InternalUser } from '@/services/users'
import { errorMessage } from '@/services/http'
import { useAuthStore } from '@/stores/auth'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'

useAdminEntrance()
const auth = useAuthStore()
const dialog = useDialogStore()

const users = ref<InternalUser[]>([])
const loading = ref(true)
const saving = ref(false)
const deletingId = ref('')
const notice = ref('')
const form = reactive({ name: '', email: '', password: '' })

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })

// Color estable por persona (tintas CMYK) para distinguir avatares de un vistazo.
const AVATAR_TONES = ['cyan', 'magenta', 'yellow', 'key']
const avatarTone = (email: string) => AVATAR_TONES[[...email].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_TONES.length]

// Lo más reciente primero.
const sortedUsers = computed(() => [...users.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)))

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

const fail = (title: string, caught: unknown, fallback: string) =>
  dialog.notify({ title, message: errorMessage(caught, fallback), tone: 'danger' })

const load = async () => {
  loading.value = true
  try {
    users.value = await listUsers()
  } catch (caught) {
    await fail('No pudimos cargar los accesos', caught, 'Intenta nuevamente en unos segundos.')
  } finally {
    loading.value = false
  }
}

const create = async () => {
  saving.value = true
  try {
    const created = await createUser({ ...form, name: form.name.trim(), email: form.email.trim() })
    Object.assign(form, { name: '', email: '', password: '' })
    flash(`Acceso creado para ${created.email}.`)
    await load()
  } catch (caught) {
    await fail('No se pudo crear el acceso', caught, 'Revisa los datos e intenta de nuevo.')
  } finally {
    saving.value = false
  }
}

const remove = async (user: InternalUser) => {
  const confirmed = await dialog.confirm({
    title: '¿Eliminar este acceso?',
    message: 'La persona dejará de poder entrar al panel de inmediato.',
    detail: `${user.name} · ${user.email}`,
    confirmLabel: 'Eliminar acceso',
    tone: 'danger',
  })
  if (!confirmed) return

  deletingId.value = user.id
  try {
    await deleteUser(user.id)
    flash(`Acceso de ${user.email} eliminado.`)
    await load()
  } catch (caught) {
    await fail('No se pudo eliminar el acceso', caught, 'Intenta nuevamente en unos segundos.')
  } finally {
    deletingId.value = ''
  }
}

onMounted(load)
</script>

<template>
  <div class="users-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-users-gear" aria-hidden="true"></i> Equipo interno</p>
        <h1>Usuarios</h1>
        <p>Crea accesos para quienes administran catálogo, pedidos y clientes.</p>
      </div>
      <div class="team-count">
        <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
        <strong>{{ users.length }}</strong>
        <span>{{ users.length === 1 ? 'acceso activo' : 'accesos activos' }}</span>
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
            <p class="eyebrow">Nuevo acceso</p>
            <h2>Invitar al equipo</h2>
          </div>
        </header>

        <div class="form-body">
          <label class="field">
            <span>Nombre completo</span>
            <input v-model="form.name" required placeholder="Nombre y apellido" autocomplete="name" />
          </label>

          <label class="field">
            <span>Correo corporativo</span>
            <div class="input-icon">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <input v-model="form.email" type="email" required placeholder="equipo@megaprinter.ec" autocomplete="email" />
            </div>
          </label>

          <label class="field">
            <span>Contraseña temporal</span>
            <div class="input-icon">
              <i class="fa-solid fa-key" aria-hidden="true"></i>
              <input
                v-model="form.password"
                type="password"
                minlength="8"
                required
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
              />
            </div>
          </label>

          <p class="security-note">
            <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
            Comparte la contraseña temporal por un canal seguro.
          </p>

          <button type="submit" :disabled="saving">
            <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" aria-hidden="true"></i>
            {{ saving ? 'Creando…' : 'Crear acceso' }}
          </button>
        </div>
      </form>

      <section class="member-card">
        <header class="card-head">
          <span class="title-icon"><i class="fa-solid fa-address-book" aria-hidden="true"></i></span>
          <div>
            <p class="eyebrow">Directorio</p>
            <h2>Accesos internos</h2>
          </div>
        </header>

        <p v-if="loading" class="state">Cargando accesos…</p>

        <ul v-else-if="users.length" class="members">
          <li v-for="user in sortedUsers" :key="user.id">
            <span class="avatar" :class="avatarTone(user.email)" aria-hidden="true">{{ initials(user.name) }}</span>
            <div class="member-copy">
              <strong>
                <span class="name">{{ user.name }}</span>
                <small v-if="user.id === auth.user?.id" class="you">Tú</small>
              </strong>
              <span class="email">{{ user.email }}</span>
            </div>
            <div class="member-side">
              <time :datetime="user.createdAt" title="Fecha de alta">
                <i class="fa-regular fa-calendar" aria-hidden="true"></i>{{ formatDate(user.createdAt) }}
              </time>
              <button
                v-if="user.id !== auth.user?.id"
                type="button"
                class="delete"
                :disabled="deletingId === user.id"
                aria-label="Eliminar acceso"
                title="Eliminar acceso"
                @click="remove(user)"
              >
                <i :class="deletingId === user.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-can'" aria-hidden="true"></i>
              </button>
            </div>
          </li>
        </ul>

        <div v-else class="empty">
          <i class="fa-solid fa-users" aria-hidden="true"></i>
          <p>No hay usuarios registrados.</p>
        </div>
      </section>
    </section>
  </div>
</template>

<style scoped lang="scss">
.users-page {
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
    @include row($space-3);
    padding: $space-4 $space-5;
    border-bottom: 1px solid $border-subtle;
    transition: background $duration-base $ease-out;

    &:last-child {
      border-bottom: 0;
    }

    @media (hover: hover) {
      &:hover {
        background: $surface-page;

        .delete {
          opacity: 1;
        }
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
  font-size: $admin-text-sm;
  font-weight: $weight-bold;
  letter-spacing: 0.02em;

  &.cyan {
    background: $cyan-mist;
    color: $cyan-dark;
  }

  &.magenta {
    background: $magenta-wash;
    color: $magenta-deep;
  }

  &.yellow {
    background: $yellow-wash;
    color: $yellow-deep;
  }

  &.key {
    background: $key-900;
    color: $text-on-dark;
  }
}

.member-copy {
  @include stack(2px);
  min-width: 0;
  flex: 1;

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

  .you {
    @include admin-badge($cyan-dark, $cyan-wash);
    flex: none;
  }

  .email {
    @include truncate;
    color: $text-body;
    font-size: $admin-text-sm;
  }
}

.member-side {
  @include row($space-2);
  flex: none;
}

.members time {
  display: none;
  align-items: center;
  gap: 6px;
  color: $text-muted;
  font-size: $admin-text-xs;
}

.delete {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  padding: 0;

  &:hover:not(:disabled) {
    background: $danger-100;
    color: $danger-500;
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

@include from($bp-sm) {
  .members time {
    display: inline-flex;
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

  .delete {
    opacity: 0.55;
  }
}
</style>
