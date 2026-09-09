<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

export interface SelectOption<T extends string | number = string> {
  value: T
  label: string
  icon?: string
  description?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    /** Ícono decorativo a la izquierda del valor. */
    icon?: string
    tone?: 'light' | 'dark'
    size?: 'sm' | 'md'
    /** Texto para lectores de pantalla cuando no hay <label> visible. */
    ariaLabel?: string
  }>(),
  { placeholder: 'Selecciona una opción', disabled: false, tone: 'light', size: 'md' },
)

const model = defineModel<string | number | null>({ default: null })
const emit = defineEmits<{ change: [value: string | number | null] }>()

const trigger = ref<HTMLButtonElement | null>(null)
const list = ref<HTMLElement | null>(null)
const open = ref(false)
const highlighted = ref(-1)
const position = ref({ top: 0, left: 0, width: 0, above: false, bottom: 0 })

const id = `select-${Math.random().toString(36).slice(2, 8)}`
const selected = computed(() => props.options.find((option) => option.value === model.value) ?? null)

const select = (option: SelectOption) => {
  if (option.disabled) return
  model.value = option.value
  emit('change', option.value)
  close()
}

// Se posiciona con Teleport + fixed para que la lista no quede recortada por
// contenedores con overflow (modales, tarjetas con scroll).
const place = () => {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect) return
  const listHeight = Math.min(list.value?.scrollHeight ?? 280, 280)
  const above = rect.bottom + listHeight + 12 > window.innerHeight && rect.top > listHeight
  position.value = {
    top: rect.bottom + 6,
    bottom: window.innerHeight - rect.top + 6,
    left: rect.left,
    width: rect.width,
    above,
  }
}

const openList = async () => {
  if (props.disabled) return
  open.value = true
  highlighted.value = Math.max(
    props.options.findIndex((option) => option.value === model.value),
    0,
  )
  await nextTick()
  place()
  list.value?.focus()
}

const close = () => {
  if (!open.value) return
  open.value = false
  trigger.value?.focus()
}

const move = (delta: number) => {
  const total = props.options.length
  if (!total) return
  let next = highlighted.value
  for (let step = 0; step < total; step += 1) {
    next = (next + delta + total) % total
    if (!props.options[next]?.disabled) break
  }
  highlighted.value = next
  list.value?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.scrollIntoView({ block: 'nearest' })
}

const onTriggerKeydown = (event: KeyboardEvent) => {
  if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
    event.preventDefault()
    openList()
  }
}

const onListKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      move(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      move(-1)
      break
    case 'Home':
      event.preventDefault()
      highlighted.value = 0
      break
    case 'End':
      event.preventDefault()
      highlighted.value = props.options.length - 1
      break
    case 'Enter':
    case ' ': {
      event.preventDefault()
      const option = props.options[highlighted.value]
      if (option) select(option)
      break
    }
    case 'Escape':
    case 'Tab':
      event.preventDefault()
      close()
      break
  }
}

const onDocumentClick = (event: Event) => {
  const target = event.target as Node
  if (trigger.value?.contains(target) || list.value?.contains(target)) return
  open.value = false
}

watch(open, (isOpen) => {
  const method = isOpen ? 'addEventListener' : 'removeEventListener'
  document[method]('click', onDocumentClick, true)
  window[method]('resize', place)
  window[method]('scroll', place, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>

<template>
  <div class="app-select" :class="[`tone-${tone}`, `size-${size}`, { open, disabled }]">
    <button
      ref="trigger"
      type="button"
      class="select-trigger"
      role="combobox"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="open ? close() : openList()"
      @keydown="onTriggerKeydown"
    >
      <i v-if="icon" class="lead-icon" :class="icon" aria-hidden="true"></i>
      <span class="value" :class="{ placeholder: !selected }">
        <i v-if="selected?.icon" :class="selected.icon" aria-hidden="true"></i>
        {{ selected?.label ?? placeholder }}
      </span>
      <i class="chevron fa-solid fa-chevron-down" aria-hidden="true"></i>
    </button>

    <Teleport to="body">
      <Transition name="select-pop">
        <ul
          v-if="open"
          :id="id"
          ref="list"
          class="select-list"
          :class="[`tone-${tone}`, { above: position.above }]"
          role="listbox"
          tabindex="-1"
          :style="{
            top: position.above ? 'auto' : `${position.top}px`,
            bottom: position.above ? `${position.bottom}px` : 'auto',
            left: `${position.left}px`,
            minWidth: `${position.width}px`,
          }"
          @keydown="onListKeydown"
        >
          <li
            v-for="(option, index) in options"
            :key="String(option.value)"
            role="option"
            :aria-selected="option.value === model"
            :aria-disabled="option.disabled"
            :class="{ highlighted: index === highlighted, selected: option.value === model, disabled: option.disabled }"
            @mouseenter="highlighted = index"
            @click="select(option)"
          >
            <i v-if="option.icon" :class="option.icon" aria-hidden="true"></i>
            <span>
              <strong>{{ option.label }}</strong>
              <small v-if="option.description">{{ option.description }}</small>
            </span>
            <i v-if="option.value === model" class="check fa-solid fa-check" aria-hidden="true"></i>
          </li>
          <li v-if="!options.length" class="empty">Sin opciones</li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.app-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  @include input-base;
  display: flex;
  align-items: center;
  gap: $space-3;
  cursor: pointer;
  text-align: left;

  .open & {
    border-color: $cyan;
    box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.18);
  }

  .size-sm & {
    padding: $space-2 $space-3;
    font-size: $text-body-sm;
  }
}

.lead-icon {
  flex: none;
  color: $brand-500;
  font-size: $text-caption;
}

.value {
  @include truncate;
  display: flex;
  flex: 1;
  align-items: center;
  gap: $space-2;

  &.placeholder {
    color: $text-muted;
  }

  i {
    color: $brand-600;
    font-size: $text-caption;
  }
}

.chevron {
  flex: none;
  color: $text-muted;
  font-size: 0.7rem;
  transition: transform $duration-base $ease-out;

  .open & {
    transform: rotate(180deg);
  }
}

.tone-dark .select-trigger {
  @include input-on-dark;
  display: flex;
}

.select-list {
  position: fixed;
  z-index: $z-modal + 20;
  max-height: 280px;
  padding: $space-1;
  overflow-y: auto;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  box-shadow: $shadow-lg;
  outline: none;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    color: $text-strong;
    font-size: $text-body-sm;
    cursor: pointer;

    > i:first-child {
      width: 16px;
      color: $brand-600;
      font-size: $text-caption;
      text-align: center;
    }

    > span {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;

      strong {
        font-weight: $weight-medium;
      }

      small {
        color: $text-muted;
        font-size: $text-eyebrow;
      }
    }

    .check {
      color: $cyan-deep;
      font-size: $text-eyebrow;
    }

    &.highlighted {
      background: $brand-100;
    }

    &.selected strong {
      font-weight: $weight-semibold;
    }

    &.disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    &.empty {
      color: $text-muted;
      cursor: default;
    }
  }

  &.tone-dark {
    border-color: $border-on-dark;
    background: $key-700;

    li {
      color: $text-on-dark;

      &.highlighted {
        background: rgba(0, 163, 224, 0.16);
      }
    }
  }
}

.select-pop-enter-active,
.select-pop-leave-active {
  transition: opacity $duration-fast $ease-out, transform $duration-fast $ease-out;
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
