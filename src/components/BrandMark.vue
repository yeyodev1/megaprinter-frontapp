<script setup lang="ts">
/**
 * Wordmark tipografico de Megaprinter. Reemplaza al avatar de Instagram en
 * toda la interfaz: hereda currentColor, por lo que funciona igual sobre
 * fondos claros y oscuros sin recortes ni halos blancos.
 */
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg'; tone?: 'light' | 'dark' }>(), {
  size: 'md',
  tone: 'dark',
})
</script>

<template>
  <span class="brand-mark" :class="[`is-${size}`, `tone-${tone}`]">
    <svg class="glyph" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7.5" />
      <path
        class="glyph-letter"
        d="M8 23V9h3.7l4.3 7.2L20.3 9H24v14h-3.4v-7.6l-3.5 5.8h-2.2l-3.5-5.8V23H8Z"
      />
    </svg>
    <span class="wordmark">
      <strong>Mega</strong><span>printer</span>
    </span>
  </span>
</template>

<style scoped lang="scss">
.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  color: inherit;
  white-space: nowrap;
}

.glyph {
  flex: none;
  height: 1.9em;
  width: 1.9em;

  rect {
    fill: none;
    stroke: $brand-500;
    stroke-width: 1.5;
  }

  .glyph-letter {
    fill: $brand-500;
  }
}

.wordmark {
  display: inline-flex;
  align-items: baseline;
  font-size: 1em;
  font-weight: $weight-black;
  letter-spacing: -0.035em;

  strong {
    font-weight: $weight-black;
  }

  > span {
    font-weight: $weight-medium;
    opacity: 0.72;
  }
}

.is-sm {
  font-size: 0.9375rem;
}

.is-md {
  font-size: 1.125rem;
}

.is-lg {
  font-size: 1.375rem;
}

.tone-light {
  color: $text-on-dark;
}

.tone-dark {
  color: $text-strong;
}
</style>
