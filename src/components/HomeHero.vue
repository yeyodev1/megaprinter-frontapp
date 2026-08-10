<script setup lang="ts">
import { brand } from '@/config/brand'

/**
 * El hero es una orden de servicio: el artefacto que el cliente recibe cuando
 * deja un equipo en el taller. Explica el proceso —que es el argumento de
 * venta— en lugar de mostrar una foto de banco de imagenes.
 */
const ticket = {
  code: 'MP-2026-0412',
  equipment: 'Epson EcoTank L3250',
  received: 'Hoy · 09:14',
  bench: 'Taller Guayaquil',
}

const steps = [
  { name: 'Recepción', state: 'done' },
  { name: 'Diagnóstico', state: 'done' },
  { name: 'Aprobación', state: 'active' },
  { name: 'Entrega', state: 'pending' },
]

const inks = [
  { key: 'C', label: 'Cian', level: 82 },
  { key: 'M', label: 'Magenta', level: 61 },
  { key: 'Y', label: 'Amarillo', level: 74 },
  { key: 'K', label: 'Negro', level: 93 },
]
</script>

<template>
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-copy" data-hero-copy>
        <p class="eyebrow">
          <span class="reg" aria-hidden="true"></span>
          Taller técnico · Guayaquil · desde {{ brand.foundedYear }}
        </p>

        <h1>Tu equipo parado<br />cuesta más que<br /><em>repararlo.</em></h1>

        <p class="lede">
          Diagnosticamos impresoras y laptops en el taller, te decimos qué falla y cuánto cuesta
          antes de tocar nada.
        </p>

        <div class="hero-actions">
          <router-link to="/repairs" class="cta-primary">
            Agendar diagnóstico <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </router-link>
          <router-link to="/products" class="cta-ghost">Ver equipos en venta</router-link>
        </div>

        <dl class="proof">
          <div><dt>Respuesta</dt><dd>24 h</dd></div>
          <div><dt>Diagnóstico</dt><dd>Sin costo</dd></div>
          <div><dt>Presupuesto</dt><dd>Antes de intervenir</dd></div>
        </dl>
      </div>

      <aside class="ticket" data-hero-art aria-label="Ejemplo de orden de servicio">
        <header class="ticket-head">
          <span class="ticket-title">Orden de servicio</span>
          <span class="ticket-code">{{ ticket.code }}</span>
        </header>

        <div class="calibration-strip" aria-hidden="true"></div>

        <dl class="ticket-meta">
          <div><dt>Equipo</dt><dd>{{ ticket.equipment }}</dd></div>
          <div><dt>Ingreso</dt><dd>{{ ticket.received }}</dd></div>
          <div><dt>Banco</dt><dd>{{ ticket.bench }}</dd></div>
        </dl>

        <ol class="ticket-steps">
          <li v-for="step in steps" :key="step.name" :class="step.state">
            <span class="dot" aria-hidden="true"></span>
            <span class="step-name">{{ step.name }}</span>
            <span class="step-state">
              {{ step.state === 'done' ? 'Listo' : step.state === 'active' ? 'En curso' : '—' }}
            </span>
          </li>
        </ol>

        <div class="ticket-inks">
          <p class="ink-title">Nivel de tinta</p>
          <div v-for="ink in inks" :key="ink.key" class="ink">
            <span class="ink-key" :class="`k-${ink.key}`">{{ ink.key }}</span>
            <span class="ink-track">
              <span class="ink-fill" :class="`k-${ink.key}`" :style="{ width: `${ink.level}%` }"></span>
            </span>
            <span class="ink-value">{{ ink.level }}%</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero {
  @include halftone(0.045);
  padding: calc(72px + #{$space-12}) $gutter $space-16;
  background: $key-900;
  color: $text-on-dark;
}

.hero-inner {
  @include container;
  display: flex;
  flex-direction: column;
  gap: $space-12;
  padding-inline: 0;
}

/* --------------------------------------------------------------- Discurso */
.hero-copy {
  @include stack($space-6);
  align-items: flex-start;
  max-width: 640px;
}

.eyebrow {
  @include eyebrow($cyan-soft);
}

.reg {
  @include registration-mark(14px, $cyan);
  flex: none;
}

h1 {
  @include display-heading($text-hero);
  color: $text-on-dark;

  em {
    color: $cyan;
  }
}

.lede {
  @include body-text($text-on-dark-muted, $text-body-lg);
  max-width: 46ch;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.cta-primary {
  @include button-primary;
  padding: $space-4 $space-6;
}

.cta-ghost {
  @include button-on-dark;
  padding: $space-4 $space-6;
}

.proof {
  display: flex;
  flex-wrap: wrap;
  gap: $space-6 $space-8;
  padding-top: $space-5;
  border-top: 1px solid $border-on-dark;
  width: 100%;

  div {
    @include stack($space-1);
  }

  dt {
    @include mono-data($key-300, $text-eyebrow);
    text-transform: uppercase;
    letter-spacing: $tracking-eyebrow;
  }

  dd {
    color: $text-on-dark;
    font-family: $font-display;
    font-size: 1.0625rem;
    font-weight: $weight-semibold;
  }
}

/* ------------------------------------------------------- Orden de servicio */
.ticket {
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  border: 1px solid $border-on-dark;
  border-radius: $radius-md;
  background: $key-800;
  box-shadow: $shadow-lg;
}

.ticket-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-3;
  padding: $space-4 $space-5;
}

.ticket-title {
  @include mono-data($cyan-soft, $text-eyebrow);
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;
}

.ticket-code {
  @include mono-data($key-300, $text-caption);
}

.ticket-meta {
  @include stack($space-3);
  padding: $space-5;
  border-bottom: 1px solid $border-on-dark;

  div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: $space-4;
  }

  dt {
    @include mono-data($key-300, $text-eyebrow);
    text-transform: uppercase;
    letter-spacing: $tracking-eyebrow;
  }

  dd {
    color: $text-on-dark;
    font-size: $text-body-sm;
    font-weight: $weight-medium;
    text-align: right;
  }
}

.ticket-steps {
  padding: $space-5;
  border-bottom: 1px solid $border-on-dark;

  li {
    display: flex;
    align-items: center;
    gap: $space-3;
    padding-block: $space-2;
  }

  .dot {
    width: 8px;
    height: 8px;
    flex: none;
    border-radius: $radius-pill;
    background: $key-500;
  }

  .step-name {
    flex: 1;
    color: $key-300;
    font-size: $text-body-sm;
  }

  .step-state {
    @include mono-data($key-400, $text-eyebrow);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .done {
    .dot {
      background: $cyan;
    }

    .step-name {
      color: $text-on-dark;
    }

    .step-state {
      color: $cyan-soft;
    }
  }

  .active {
    .dot {
      background: $magenta;
      box-shadow: 0 0 0 4px rgba(229, 0, 126, 0.22);
    }

    .step-name {
      color: $text-on-dark;
      font-weight: $weight-semibold;
    }

    .step-state {
      color: $magenta;
    }
  }
}

.ticket-inks {
  @include stack($space-2);
  padding: $space-5;
}

.ink-title {
  @include mono-data($key-300, $text-eyebrow);
  margin-bottom: $space-1;
  text-transform: uppercase;
  letter-spacing: $tracking-eyebrow;
}

.ink {
  @include row($space-3);
}

.ink-key {
  @include mono-data($key-300, $text-eyebrow);
  width: 12px;
  flex: none;
  font-weight: $weight-medium;
}

.ink-track {
  flex: 1;
  height: 6px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.09);
}

.ink-fill {
  display: block;
  height: 100%;
  border-radius: $radius-pill;
  transform-origin: left center;
  animation: ink-fill 1.1s $ease-out both;
}

@keyframes ink-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.ink-value {
  @include mono-data($key-300, $text-eyebrow);
  width: 34px;
  flex: none;
  text-align: right;
}

.ink-fill {
  &.k-C { background: $cyan; }
  &.k-M { background: $magenta; }
  &.k-Y { background: $yellow; }
  &.k-K { background: $key-200; }
}

.ink-key {
  &.k-C { color: $cyan; }
  &.k-M { color: $magenta; }
  &.k-Y { color: $yellow; }
  &.k-K { color: $key-200; }
}

@include from($bp-lg) {
  .hero {
    padding-block: calc(72px + #{$space-16}) $space-20;
  }

  .hero-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: $space-16;
  }

  .ticket {
    flex: none;
    width: 420px;
  }
}
</style>
