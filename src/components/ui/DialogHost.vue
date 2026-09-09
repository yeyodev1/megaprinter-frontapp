<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import { useDialogStore, type DialogTone } from '@/stores/dialog'

const dialog = useDialogStore()
const current = computed(() => dialog.current)

const ICONS: Record<DialogTone, string> = {
  default: 'fa-solid fa-circle-question',
  danger: 'fa-solid fa-triangle-exclamation',
  success: 'fa-solid fa-circle-check',
  warning: 'fa-solid fa-circle-exclamation',
}

const tone = computed<DialogTone>(() => current.value?.options.tone ?? 'default')
const icon = computed(() => current.value?.options.icon ?? ICONS[tone.value])
const confirmLabel = computed(
  () => current.value?.options.confirmLabel ?? (current.value?.kind === 'confirm' ? 'Confirmar' : 'Entendido'),
)
const cancelLabel = computed(() => current.value?.options.cancelLabel ?? 'Cancelar')
</script>

<template>
  <AppModal :open="!!current" size="sm" priority :dismissible="current?.kind === 'notify'" @close="dialog.resolve(false)">
    <div v-if="current" class="dialog" :class="`tone-${tone}`">
      <span class="dialog-icon" aria-hidden="true"><i :class="icon"></i></span>
      <h2>{{ current.options.title }}</h2>
      <p v-if="current.options.message">{{ current.options.message }}</p>
      <code v-if="current.options.detail">{{ current.options.detail }}</code>
    </div>

    <template #footer>
      <button
        v-if="current?.kind === 'confirm'"
        class="cancel"
        type="button"
        @click="dialog.resolve(false)"
      >
        {{ cancelLabel }}
      </button>
      <button class="confirm" :class="`tone-${tone}`" type="button" @click="dialog.resolve(true)">
        {{ confirmLabel }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.dialog {
  @include stack($space-3);
  align-items: flex-start;
  padding-block: $space-2;

  h2 {
    font-size: $text-heading;
  }

  p {
    @include body-text($text-body, $text-body-sm);
  }

  code {
    @include mono-data($text-strong, $text-caption);
    padding: $space-2 $space-3;
    border-radius: $radius-xs;
    background: $surface-sunken;
  }
}

.dialog-icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-600;
  font-size: 1.2rem;

  .tone-danger & {
    background: $danger-100;
    color: $danger-500;
  }

  .tone-success & {
    background: $success-100;
    color: $success-500;
  }

  .tone-warning & {
    background: $warning-100;
    color: $warning-500;
  }
}

.cancel {
  @include button-secondary;
}

.confirm {
  @include button-primary;

  &.tone-danger {
    background: $danger-500;
    color: $white;
    box-shadow: none;

    &:hover:not(:disabled) {
      background: darken($danger-500, 8);
    }
  }
}
</style>
