<script setup lang="ts">
export interface CustomerDetails {
  name: string
  email: string
  phone: string
  address: string
}

defineProps<{ loading: boolean; error: string }>()
const emit = defineEmits<{ pay: []; whatsapp: [] }>()

const form = defineModel<CustomerDetails>({ required: true })
</script>

<template>
  <form class="customer-form" @submit.prevent="emit('pay')">
    <p class="form-intro">
      Completa tus datos para habilitar un pago seguro o solicitar confirmación directa por
      WhatsApp.
    </p>

    <label>
      Nombre completo
      <input v-model="form.name" required autocomplete="name" placeholder="Carlos Mendoza" />
    </label>

    <label>
      Correo electrónico
      <input v-model="form.email" required type="email" autocomplete="email" placeholder="correo@empresa.com" />
    </label>

    <label>
      WhatsApp
      <input v-model="form.phone" required type="tel" autocomplete="tel" placeholder="099 802 8318" />
    </label>

    <label>
      Dirección de entrega / ciudad
      <input v-model="form.address" required autocomplete="street-address" placeholder="Guayaquil, Ecuador" />
    </label>

    <p v-if="error" class="form-error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
    </p>

    <button class="pay-action" type="submit" :disabled="loading">
      <i class="fa-solid fa-lock" aria-hidden="true"></i>
      {{ loading ? 'Preparando pago…' : 'Pagar de forma segura' }}
    </button>

    <button class="whatsapp-action" type="button" :disabled="loading" @click="emit('whatsapp')">
      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Finalizar por WhatsApp
    </button>
  </form>
</template>

<style scoped lang="scss">
.customer-form {
  @include stack($space-3);

  label {
    @include stack($space-2);
    @include field-label;
    color: $text-on-dark-muted;
  }

  input {
    @include input-on-dark;
  }
}

.form-intro {
  @include body-text($text-on-dark-muted, $text-body-sm);
}

.form-error {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border: 1px solid rgba(216, 74, 90, 0.4);
  border-radius: $radius-sm;
  background: rgba(216, 74, 90, 0.12);
  color: #ff9aa5;
  font-size: $text-caption;
  line-height: $leading-body;
}

.pay-action {
  @include button-primary;
  margin-top: $space-1;
  padding: $space-4;
  border-radius: $radius-md;
  font-size: $text-body-md;
}

.whatsapp-action {
  @include button-base;
  padding: $space-4;
  border-color: rgba(37, 211, 102, 0.35);
  border-radius: $radius-md;
  background: rgba(37, 211, 102, 0.12);
  color: #7ef0a8;
  font-size: $text-body-md;

  &:hover:not(:disabled) {
    background: rgba(37, 211, 102, 0.2);
    transform: translateY(-2px);
  }
}
</style>
