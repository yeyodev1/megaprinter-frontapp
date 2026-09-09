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
    <div class="form-intro">
      <h3>¿A quién le entregamos?</h3>
      <p>Usamos estos datos para el comprobante y para coordinar la entrega contigo.</p>
    </div>

    <div class="fields">
      <label class="field">
        <span>Nombre completo</span>
        <input v-model="form.name" required autocomplete="name" placeholder="Carlos Mendoza" />
      </label>

      <label class="field">
        <span>Correo electrónico</span>
        <input
          v-model="form.email"
          required
          type="email"
          autocomplete="email"
          placeholder="correo@empresa.com"
        />
      </label>

      <label class="field">
        <span>WhatsApp</span>
        <input v-model="form.phone" required type="tel" autocomplete="tel" placeholder="099 802 8318" />
      </label>

      <label class="field">
        <span>Dirección de entrega / ciudad</span>
        <input
          v-model="form.address"
          required
          autocomplete="street-address"
          placeholder="Guayaquil, Ecuador"
        />
      </label>
    </div>

    <p v-if="error" class="form-error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ error }}
    </p>

    <div class="actions">
      <button class="pay-action" type="submit" :disabled="loading">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-lock'" aria-hidden="true"></i>
        {{ loading ? 'Preparando pago…' : 'Continuar al pago seguro' }}
      </button>

      <span class="divider"><span>o</span></span>

      <button class="whatsapp-action" type="button" :disabled="loading" @click="emit('whatsapp')">
        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Finalizar por WhatsApp
      </button>
    </div>

    <p class="helper">
      <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
      Por WhatsApp un asesor confirma stock, forma de pago y entrega contigo.
    </p>
  </form>
</template>

<style scoped lang="scss">
.customer-form {
  @include stack($space-5);
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
}

.form-intro {
  @include stack($space-1);

  h3 {
    font-size: $text-heading;
  }

  p {
    @include body-text($text-body, $text-body-sm);
  }
}

.fields {
  @include stack($space-3);
}

.field {
  @include stack($space-2);

  > span {
    @include field-label;
  }

  input {
    @include input-base;
  }
}

.form-error {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border: 1px solid rgba($danger, 0.35);
  border-radius: $radius-sm;
  background: $danger-wash;
  color: $danger;
  font-size: $text-caption;
  line-height: $leading-body;
}

.actions {
  @include stack($space-3);
}

.pay-action {
  @include button-primary;
  width: 100%;
  min-height: 48px;
  border-radius: $radius-md;
  font-size: $text-body-md;
}

.whatsapp-action {
  @include button-whatsapp;
  width: 100%;
  min-height: 48px;
  border-radius: $radius-md;
  font-size: $text-body-md;
}

.divider {
  display: flex;
  align-items: center;
  gap: $space-3;
  color: $text-muted;
  font-size: $text-eyebrow;
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $border-subtle;
  }
}

.helper {
  @include row($space-2, flex-start);
  color: $text-muted;
  font-size: $text-caption;
  line-height: $leading-body;

  i {
    margin-top: 3px;
    color: $brand-500;
  }
}
</style>
