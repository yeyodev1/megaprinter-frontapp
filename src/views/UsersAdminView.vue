<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import { http, errorMessage } from '@/services/http'

interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

const users = ref<User[]>([])
const loading = ref(true)
const saving = ref(false)
const feedback = reactive({ message: '', kind: '' as 'ok' | 'error' | '' })
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

const load = async () => {
  loading.value = true
  try {
    users.value = (await http.get<User[]>('/auth/users')).data
  } catch (caught) {
    feedback.message = errorMessage(caught, 'No pudimos cargar los accesos.')
    feedback.kind = 'error'
  } finally {
    loading.value = false
  }
}

const create = async () => {
  saving.value = true
  feedback.message = ''
  feedback.kind = ''
  try {
    await http.post('/auth/users', form)
    Object.assign(form, { name: '', email: '', password: '' })
    feedback.message = 'Acceso creado correctamente.'
    feedback.kind = 'ok'
    await load()
  } catch (caught) {
    feedback.message = errorMessage(caught, 'No se pudo crear el acceso.')
    feedback.kind = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="users-page">
    <AdminNav />

    <main id="contenido">
      <header class="page-header">
        <div>
          <p class="eyebrow"><i class="fa-solid fa-users-gear" aria-hidden="true"></i> Equipo interno</p>
          <h1>Personas que<br /><em>gestionan.</em></h1>
          <p>Crea accesos seguros para quienes administran catálogo, pedidos y clientes.</p>
        </div>
        <div class="team-count">
          <i class="fa-solid fa-user-shield" aria-hidden="true"></i>
          <strong>{{ users.length }}</strong>
          <span>accesos activos</span>
        </div>
      </header>

      <section class="workspace">
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
                  minlength="10"
                  required
                  placeholder="Mínimo 10 caracteres"
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

            <p v-if="feedback.message" class="feedback" :class="feedback.kind" role="status">
              {{ feedback.message }}
            </p>
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
                <strong>{{ user.name }}</strong>
                <span>{{ user.email }}</span>
              </div>
              <time>
                <i class="fa-solid fa-calendar-day" aria-hidden="true"></i>{{ formatDate(user.createdAt) }}
              </time>
            </article>
          </div>

          <div v-else class="empty">
            <i class="fa-solid fa-users" aria-hidden="true"></i>
            <p>No hay usuarios registrados.</p>
          </div>
        </section>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.users-page {
  @include admin-shell;
}

.page-header {
  @include admin-header;
}

.eyebrow {
  @include admin-eyebrow;
}

.team-count {
  @include admin-stat-card;
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

.feedback {
  font-size: $text-caption;
  font-weight: $weight-semibold;

  &.ok {
    color: $success-500;
  }

  &.error {
    color: $danger-500;
  }
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
    font-size: $text-body-sm;
  }

  span {
    @include truncate;
    color: $text-muted;
    font-size: $text-eyebrow;
  }
}

.members time {
  @include stack($space-1);
  align-items: flex-end;
  color: $text-muted;
  font-size: 0.6875rem;

  i {
    color: $brand-400;
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
  }
}
</style>
