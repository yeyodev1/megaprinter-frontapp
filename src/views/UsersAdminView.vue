<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
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

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-EC')

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
        <h1>Personas que<br /><em>gestionan.</em></h1>
        <p>Crea accesos para quienes administran catálogo, pedidos y clientes.</p>
      </div>
      <div class="team-count">
        <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
        <strong>{{ users.length }}</strong>
        <span>accesos activos</span>
      </div>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <section class="workspace" data-admin-reveal>
      <form class="create-card" @submit.prevent="create">
        <div class="card-title">
          <div class="title-icon"><i class="fa-solid fa-user-plus" aria-hidden="true"></i></div>
          <div><span>Nuevo acceso</span><h2>Invitar al equipo</h2></div>
        </div>

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
        <header>
          <div><span>Directorio</span><h2>Accesos internos</h2></div>
          <i class="fa-solid fa-address-book" aria-hidden="true"></i>
        </header>

        <p v-if="loading" class="state">Cargando accesos…</p>

        <div v-else-if="users.length" class="members">
          <article v-for="user in users" :key="user.id">
            <div class="avatar" aria-hidden="true">{{ initials(user.name) }}</div>
            <div class="member-copy">
              <strong>
                {{ user.name }}
                <small v-if="user.id === auth.user?.id" class="you">Tú</small>
              </strong>
              <span>{{ user.email }}</span>
            </div>
            <div class="member-side">
              <time>
                <i class="fa-solid fa-calendar-day" aria-hidden="true"></i>{{ formatDate(user.createdAt) }}
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
          </article>
        </div>

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
  @include admin-stat-card;
}

.notice {
  @include admin-notice;
}

.workspace {
  @include stack($space-5);
}

.create-card,
.member-card {
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
}

.input-icon {
  @include admin-input-icon;
}

.security-note {
  display: flex;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-700;
  font-size: $text-eyebrow;
  line-height: $leading-body;

  i {
    color: $brand-600;
  }
}

.form-body > button {
  @include button-primary;
  padding: $space-4;
}

.member-card {
  padding: $space-6;

  > header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: $space-4;

    span {
      @include eyebrow;
    }

    h2 {
      margin-top: 2px;
      font-size: $text-subheading;
    }

    > i {
      color: $brand-400;
      font-size: 1.35rem;
    }
  }
}

.members {
  display: flex;
  flex-direction: column;

  article {
    @include row($space-3);
    padding-block: $space-3;
    border-top: 1px solid $border-subtle;
  }
}

.avatar {
  display: flex;
  width: 40px;
  height: 40px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: $brand-100;
  color: $brand-700;
  font-size: $text-caption;
  font-weight: $weight-black;
}

.member-copy {
  @include stack(3px);
  min-width: 0;
  flex: 1;

  strong {
    @include row($space-2);
    font-size: $text-body-sm;
  }

  .you {
    @include badge($brand-700, $brand-100);
  }

  span {
    @include truncate;
    color: $text-muted;
    font-size: $text-eyebrow;
  }
}

.member-side {
  @include row($space-2);
  flex: none;
}

.members time {
  @include row($space-1);
  color: $text-muted;
  font-size: 0.6875rem;

  i {
    color: $brand-400;
  }
}

.delete {
  @include button-ghost($text-muted);
  padding: $space-2 $space-3;

  &:hover:not(:disabled) {
    background: $danger-100;
    color: $danger-500;
  }
}

.state {
  padding-block: $space-8;
  color: $text-muted;
  text-align: center;
}

.empty {
  @include empty-state;
}

@include from($bp-md) {
  .workspace {
    flex-direction: row;
    align-items: flex-start;
  }

  .create-card {
    width: 44%;
  }

  .member-card {
    flex: 1;
    min-width: 0;
  }
}
</style>
