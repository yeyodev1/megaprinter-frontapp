<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useScrollLock } from '@/composables/useScrollLock'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    eyebrow?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    /** Si es falso, ni Escape ni el fondo cierran el modal. */
    dismissible?: boolean
    /** Prioridad sobre otros modales (los diálogos de confirmación van encima). */
    priority?: boolean
  }>(),
  { size: 'md', dismissible: true, priority: false },
)

const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)
const isOpen = computed(() => props.open)
useScrollLock(isOpen)

let previouslyFocused: HTMLElement | null = null

const focusablesIn = (root: HTMLElement) =>
  Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.offsetParent !== null)

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      previouslyFocused?.focus?.()
      previouslyFocused = null
      return
    }
    previouslyFocused = document.activeElement as HTMLElement | null
    await nextTick()
    const target = panel.value ? focusablesIn(panel.value)[0] : null
    ;(target ?? panel.value)?.focus()
  },
)

const requestClose = () => {
  if (props.dismissible) emit('close')
}

// El fondo solo cierra si el gesto empezó y terminó sobre él: un clic que abre
// el modal (o una selección de texto arrastrada hacia fuera) no debe cerrarlo.
const backdropPressed = ref(false)
const onBackdropDown = () => (backdropPressed.value = true)
const onBackdropClick = () => {
  if (backdropPressed.value) requestClose()
  backdropPressed.value = false
}

// Mantiene el foco dentro del modal al tabular: sin esto el teclado se
// escapa al contenido de fondo que sigue en el DOM.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopPropagation()
    requestClose()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const items = focusablesIn(panel.value)
  if (!items.length) return
  const first = items[0]!
  const last = items[items.length - 1]!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

onBeforeUnmount(() => previouslyFocused?.focus?.())
</script>

<template>
  <Teleport to="body">
    <Transition name="app-modal">
      <div
        v-if="open"
        class="modal-layer"
        :class="{ priority }"
        @pointerdown.self="onBackdropDown"
        @click.self="onBackdropClick"
        @keydown="onKeydown"
      >
        <section
          ref="panel"
          class="modal-panel"
          :class="`size-${size}`"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <div>
                <p v-if="eyebrow" class="modal-eyebrow">{{ eyebrow }}</p>
                <h2>{{ title }}</h2>
              </div>
            </slot>
            <button
              v-if="dismissible"
              class="modal-close"
              type="button"
              aria-label="Cerrar"
              @click="emit('close')"
            >
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </header>

          <div class="modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-layer {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba($key-900, 0.62);
  backdrop-filter: blur(6px);

  &.priority {
    z-index: $z-modal + 10;
  }
}

.modal-panel {
  display: flex;
  width: 100%;
  max-height: 94vh;
  flex-direction: column;
  border: 1px solid $border-subtle;
  border-radius: $radius-xl $radius-xl 0 0;
  background: $surface-card;
  color: $text-strong;
  box-shadow: $shadow-lg;
  outline: none;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $space-4;
  padding: $space-5 $space-6 $space-4;
  border-bottom: 1px solid $border-subtle;

  h2 {
    font-size: $text-heading;
  }
}

.modal-eyebrow {
  @include eyebrow;
  margin-bottom: $space-1;
}

.modal-close {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-card;
  color: $text-body;
  cursor: pointer;
  transition: background $duration-base $ease-out, color $duration-base $ease-out;
  @include focus-ring;

  &:hover {
    background: $surface-sunken;
    color: $text-strong;
  }
}

.modal-body {
  @include scroll-area;
  flex: 1;
  padding: $space-5 $space-6;
}

.modal-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-4 $space-6;
  border-top: 1px solid $border-subtle;
  background: $surface-page;
}

.app-modal-enter-active,
.app-modal-leave-active {
  transition: opacity $duration-base $ease-out;

  .modal-panel {
    transition: transform $duration-slow $ease-out, opacity $duration-base $ease-out;
  }
}

.app-modal-enter-from,
.app-modal-leave-to {
  opacity: 0;

  .modal-panel {
    transform: translateY(24px);
  }
}

@include from($bp-sm) {
  .modal-layer {
    align-items: center;
    padding: $space-6;
  }

  .modal-panel {
    border-radius: $radius-lg;

    &.size-sm {
      max-width: 440px;
    }

    &.size-md {
      max-width: 620px;
    }

    &.size-lg {
      max-width: 860px;
    }

    &.size-xl {
      max-width: 1080px;
    }
  }

  .app-modal-enter-from,
  .app-modal-leave-to {
    .modal-panel {
      transform: translateY(12px) scale(0.985);
    }
  }
}
</style>
