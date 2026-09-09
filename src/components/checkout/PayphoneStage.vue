<script setup lang="ts">
/**
 * Contenedor donde Payphone renderiza su caja de pago. El `#pp-button` es el
 * id que espera el SDK; este componente solo lo enmarca y muestra un esqueleto
 * hasta que el widget aparece, para que no salte en pantalla.
 */
defineProps<{ ready: boolean }>()
const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <section class="stage" aria-label="Pago con Payphone">
    <header class="stage-head">
      <span class="shield" aria-hidden="true"><i class="fa-solid fa-shield-halved"></i></span>
      <div>
        <strong>Pago protegido por Payphone</strong>
        <span>No compartimos los datos de tu tarjeta.</span>
      </div>
    </header>

    <div class="box">
      <div v-if="!ready" class="skeleton" aria-hidden="true">
        <span class="line short"></span>
        <span class="line"></span>
        <span class="line"></span>
        <span class="line half"></span>
        <span class="line button"></span>
      </div>
      <div id="pp-button" :class="{ hidden: !ready }"></div>
    </div>

    <button class="back" type="button" @click="emit('back')">
      <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Volver a mis datos
    </button>
  </section>
</template>

<style scoped lang="scss">
.stage {
  @include stack($space-4);
  width: 100%;
  max-width: 520px;
  margin-inline: auto;
}

.stage-head {
  @include row($space-3);
  padding: $space-3 $space-4;
  border: 1px solid $cyan-mist;
  border-radius: $radius-md;
  background: $cyan-wash;

  div {
    @include stack(1px);
  }

  strong {
    font-size: $text-body-sm;
  }

  span {
    color: $text-body;
    font-size: $text-caption;
  }
}

.shield {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $cyan;
  color: $key-900;
}

.box {
  position: relative;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.hidden {
  position: absolute;
  visibility: hidden;
  pointer-events: none;
}

.skeleton {
  @include stack($space-3);
  padding: $space-3;

  .line {
    display: block;
    height: 14px;
    border-radius: $radius-xs;
    background: linear-gradient(90deg, $key-100 25%, $key-050 37%, $key-100 63%);
    background-size: 400% 100%;
    animation: shimmer 1.4s ease infinite;

    &.short {
      width: 45%;
    }

    &.half {
      width: 60%;
    }

    &.button {
      height: 44px;
      margin-top: $space-2;
      border-radius: $radius-sm;
    }
  }
}

@keyframes shimmer {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}

.back {
  @include button-ghost($text-body);
  align-self: center;
}
</style>
