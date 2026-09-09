<script setup lang="ts">
/**
 * Indicador de los tres pasos del checkout. Solo dibuja: el paso activo lo
 * decide el modal según si la caja de Payphone ya se mostró.
 */
defineProps<{ current: 1 | 2 | 3 }>()

const steps = [
  { number: 1, label: 'Datos' },
  { number: 2, label: 'Pago' },
  { number: 3, label: 'Confirmación' },
]
</script>

<template>
  <ol class="steps" aria-label="Progreso del pedido">
    <li
      v-for="step in steps"
      :key="step.number"
      :class="{ active: step.number === current, done: step.number < current }"
      :aria-current="step.number === current ? 'step' : undefined"
    >
      <span class="circle" aria-hidden="true">
        <i v-if="step.number < current" class="fa-solid fa-check"></i>
        <template v-else>{{ step.number }}</template>
      </span>
      <span class="label">{{ step.label }}</span>
      <span v-if="step.number < steps.length" class="line" aria-hidden="true"></span>
    </li>
  </ol>
</template>

<style scoped lang="scss">
.steps {
  display: flex;
  align-items: center;
  gap: $space-2;

  li {
    display: flex;
    flex: 1;
    align-items: center;
    gap: $space-2;
    color: $text-muted;

    &:last-child {
      flex: 0 0 auto;
    }
  }
}

.circle {
  display: flex;
  width: 26px;
  height: 26px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-strong;
  border-radius: $radius-pill;
  background: $surface-card;
  font-family: $font-mono;
  font-size: $text-eyebrow;
  font-weight: $weight-medium;
  transition: background $duration-base $ease-out, color $duration-base $ease-out,
    border-color $duration-base $ease-out;

  i {
    font-size: 0.6rem;
  }
}

.label {
  @include eyebrow($text-muted);
  white-space: nowrap;
}

.line {
  flex: 1;
  height: 1px;
  min-width: $space-3;
  background: $border-subtle;
}

li.active {
  .circle {
    border-color: $cyan;
    background: $cyan;
    color: $key-900;
  }

  .label {
    color: $cyan-deep;
  }
}

li.done {
  .circle {
    border-color: $ok;
    background: $ok-wash;
    color: $ok;
  }

  .label {
    color: $text-body;
  }

  .line {
    background: $ok;
    opacity: 0.4;
  }
}

@include until($bp-sm) {
  .label {
    display: none;
  }

  li.active .label {
    display: inline-flex;
  }
}
</style>
