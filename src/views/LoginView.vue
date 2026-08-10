<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
import BrandMark from '@/components/BrandMark.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const expired = computed(() => route.query.expired === '1')

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    await auth.login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
    router.push(redirect)
  } catch (caught) {
    error.value = errorMessage(caught, 'Correo o contraseña incorrectos.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <router-link to="/" class="back">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver al sitio
    </router-link>

    <form @submit.prevent="submit">
      <BrandMark tone="light" size="lg" />

      <div class="intro">
        <p class="eyebrow">Acceso restringido</p>
        <h1>Panel interno</h1>
        <p class="lede">Acceso exclusivo para el equipo operativo de Megaprinter.</p>
      </div>

      <p v-if="expired" class="notice" role="status">
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        Tu sesión expiró. Vuelve a iniciar sesión para continuar.
      </p>

      <label>
        <span>Correo</span>
        <input
          v-model="email"
          type="email"
          required
          autofocus
          autocomplete="username"
          placeholder="correo@megaprinter.ec"
        />
      </label>

      <label>
        <span>Contraseña</span>
        <input
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="••••••••••"
        />
      </label>

      <p v-if="error" class="error" role="alert">
        <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
      </p>

      <button type="submit" :disabled="loading">
        <i v-if="loading" class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
        {{ loading ? 'Verificando…' : 'Entrar al panel' }}
        <i v-if="!loading" class="fa-solid fa-arrow-right" aria-hidden="true"></i>
      </button>
    </form>
  </main>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  padding: $space-6 $gutter $space-10;
  background: $ink-900;
  color: $text-on-dark;
}

.back {
  @include row($space-2);
  align-self: flex-start;
  color: $brand-300;
  font-size: $text-caption;
  font-weight: $weight-bold;
  @include focus-ring($brand-300);
}

form {
  @include stack($space-5);
  width: 100%;
  max-width: 420px;
  align-items: stretch;
  margin: auto;
}

.intro {
  @include stack($space-3);
}

.eyebrow {
  @include eyebrow($brand-300);
}

h1 {
  @include display-heading($text-display);
}

.lede {
  @include body-text($text-on-dark-muted, $text-body-sm);
}

label {
  @include stack($space-2);

  span {
    @include field-label;
    color: $text-on-dark-muted;
  }

  input {
    @include input-on-dark;
  }
}

.notice,
.error {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-sm;
  font-size: $text-caption;
  line-height: $leading-body;
}

.notice {
  border: 1px solid rgba(209, 138, 27, 0.4);
  background: rgba(209, 138, 27, 0.12);
  color: #f0c27a;
}

.error {
  border: 1px solid rgba(216, 74, 90, 0.4);
  background: rgba(216, 74, 90, 0.12);
  color: #ff9aa5;
}

button[type='submit'] {
  @include button-primary;
  padding: $space-4;
  font-size: $text-body-md;
}
</style>
