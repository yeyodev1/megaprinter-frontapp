<script setup lang="ts">
import { computed } from 'vue'
import AppSelect, { type SelectOption } from '@/components/ui/AppSelect.vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import SpecificationsEditor from '@/components/SpecificationsEditor.vue'
import type { CatalogPayload, Category } from '@/services/catalog'
import { categoryIcon, sortCategories } from '@/config/categories'

/**
 * Campos del editor de publicaciones. Solo dibuja y valida; el estado vive en
 * el modal que lo contiene para poder mostrar la vista previa y detectar
 * cambios sin guardar.
 */
const props = defineProps<{ categories: Category[] }>()
const form = defineModel<Required<CatalogPayload>>('form', { required: true })

const kindOptions: SelectOption[] = [
  { value: 'product', label: 'Producto', icon: 'fa-solid fa-box', description: 'Se vende desde la tienda' },
  { value: 'service', label: 'Servicio', icon: 'fa-solid fa-screwdriver-wrench', description: 'Se cotiza con el equipo' },
]

const categoryOptions = computed<SelectOption[]>(() =>
  sortCategories(props.categories).map((category) => ({
    value: category._id,
    label: category.name,
    icon: categoryIcon(category.slug),
  })),
)

const priceError = computed(() => {
  const original = Number(form.value.originalPrice)
  if (!form.value.originalPrice || !Number.isFinite(original)) return ''
  return original <= Number(form.value.price) ? 'El precio anterior debe ser mayor al precio actual.' : ''
})

const setKind = (value: string | number | null) => {
  form.value.kind = value === 'service' ? 'service' : 'product'
}

const setCategory = (value: string | number | null) => {
  form.value.category = value ? String(value) : ''
}

defineExpose({ priceError })
</script>

<template>
  <div class="form-body">
    <label class="field">
      <span>Nombre visible</span>
      <input v-model="form.name" required placeholder="Ej. Impresora Epson EcoTank" />
    </label>

    <label class="field">
      <span>Descripción</span>
      <textarea v-model="form.description" required placeholder="Explica por qué este producto o servicio es relevante." />
    </label>

    <div class="field-row">
      <label class="field">
        <span>Precio USD</span>
        <div class="input-icon">
          <i class="fa-solid fa-dollar-sign" aria-hidden="true"></i>
          <input v-model.number="form.price" type="number" min="0" step="0.01" required />
        </div>
      </label>

      <label class="field">
        <span>Precio anterior <small>(opcional)</small></span>
        <div class="input-icon">
          <i class="fa-solid fa-tag" aria-hidden="true"></i>
          <input
            v-model.number="form.originalPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Se muestra tachado"
          />
        </div>
      </label>
    </div>

    <p v-if="priceError" class="field-error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ priceError }}
    </p>

    <div class="field-row">
      <div class="field">
        <span>Tipo</span>
        <AppSelect :model-value="form.kind" :options="kindOptions" aria-label="Tipo de publicación" @update:model-value="setKind" />
      </div>

      <div class="field">
        <span>Categoría</span>
        <AppSelect
          :model-value="form.category || null"
          :options="categoryOptions"
          placeholder="Selecciona una categoría"
          icon="fa-solid fa-folder-open"
          aria-label="Categoría"
          @update:model-value="setCategory"
        />
      </div>
    </div>

    <ImageUploadField v-model="form.imageUrl" />

    <label class="field">
      <span>URL externa de imagen <small>(opcional)</small></span>
      <div class="input-icon">
        <i class="fa-solid fa-link" aria-hidden="true"></i>
        <input v-model="form.imageUrl" type="url" placeholder="https://..." />
      </div>
    </label>

    <SpecificationsEditor v-model="form.specifications" />

    <label class="publish-toggle">
      <input v-model="form.active" type="checkbox" />
      <span class="toggle"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
      <span class="toggle-copy">
        <strong>Publicar en el sitio</strong>
        <small>{{ form.active ? 'Visible para los clientes al guardar.' : 'Se guarda como borrador, solo visible en el panel.' }}</small>
      </span>
    </label>
  </div>
</template>

<style scoped lang="scss">
.form-body {
  @include stack($space-4);
}

.field {
  @include admin-field;

  > span small {
    color: $text-muted;
    text-transform: none;
  }
}

.field-row {
  @include stack($space-4);
}

.field-error {
  @include row($space-2);
  color: $danger-500;
  font-size: $text-caption;
  font-weight: $weight-semibold;
}

.input-icon {
  @include admin-input-icon;
}

.publish-toggle {
  @include row($space-3);
  cursor: pointer;

  > input {
    @include visually-hidden;
  }

  .toggle {
    display: flex;
    width: 40px;
    height: 23px;
    flex: none;
    align-items: center;
    padding: 2px;
    border-radius: $radius-pill;
    background: $border-strong;
    transition: background $duration-base $ease-out;

    i {
      display: flex;
      width: 19px;
      height: 19px;
      align-items: center;
      justify-content: center;
      border-radius: $radius-pill;
      background: $white;
      color: transparent;
      font-size: 0.5625rem;
    }
  }

  > input:checked + .toggle {
    justify-content: flex-end;
    background: $brand-500;

    i {
      color: $brand-500;
    }
  }

  > input:focus-visible + .toggle {
    outline: 2px solid $brand-500;
    outline-offset: 2px;
  }
}

.toggle-copy {
  @include stack(2px);

  strong {
    font-size: $text-body-sm;
  }

  small {
    color: $text-muted;
    font-size: $text-eyebrow;
  }
}

@include from($bp-md) {
  .field-row {
    flex-direction: row;

    .field {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
