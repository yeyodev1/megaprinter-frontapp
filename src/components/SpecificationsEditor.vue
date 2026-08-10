<script setup lang="ts">
import type { CatalogSpecification } from '@/services/catalog'

const specs = defineModel<CatalogSpecification[]>({ required: true })

const add = () => specs.value.push({ label: '', value: '' })
const remove = (index: number) => specs.value.splice(index, 1)
</script>

<template>
  <div class="spec-editor">
    <div class="spec-heading">
      <span>Ficha técnica</span>
      <small>Estos datos se muestran en la página del producto.</small>
    </div>

    <div v-for="(spec, index) in specs" :key="index" class="spec-row">
      <input v-model="spec.label" placeholder="Ej. Procesador" aria-label="Nombre del dato" />
      <input v-model="spec.value" placeholder="Ej. Intel Core i5" aria-label="Valor del dato" />
      <button type="button" aria-label="Eliminar especificación" @click="remove(index)">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>

    <button type="button" class="add-spec" @click="add">
      <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar especificación
    </button>
  </div>
</template>

<style scoped lang="scss">
.spec-editor {
  @include stack($space-2);
  padding: $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-sunken;
}

.spec-heading {
  @include stack(3px);

  span {
    @include eyebrow;
  }

  small {
    color: $text-muted;
    font-size: $text-eyebrow;
  }
}

.spec-row {
  display: flex;
  gap: $space-2;

  input {
    @include input-base;
    min-width: 0;
    flex: 1;
    padding: $space-2 $space-3;
    font-size: $text-caption;
  }

  button {
    @include button-ghost($danger-500);
    padding-inline: $space-2;
  }
}

.add-spec {
  @include button-ghost($brand-600);
  align-self: flex-start;
  padding-inline: 0;
}
</style>
