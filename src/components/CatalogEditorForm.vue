<script setup lang="ts">
import { reactive, watch } from 'vue'
import ImageUploadField from '@/components/ImageUploadField.vue'
import SpecificationsEditor from '@/components/SpecificationsEditor.vue'
import type { CatalogItem, CatalogPayload, Category } from '@/services/catalog'

const props = defineProps<{
  categories: Category[]
  editing: CatalogItem | null
  saving: boolean
}>()

const emit = defineEmits<{ save: [payload: CatalogPayload]; cancel: [] }>()

const emptyForm = (): Required<CatalogPayload> => ({
  name: '',
  description: '',
  price: 0,
  originalPrice: null,
  imageUrl: '',
  kind: 'product',
  active: true,
  category: '',
  specifications: [],
})

const form = reactive(emptyForm())

watch(
  () => props.editing,
  (item) => {
    if (!item) {
      Object.assign(form, emptyForm())
      return
    }
    Object.assign(form, {
      name: item.name,
      description: item.description,
      price: item.price,
      originalPrice: item.originalPrice ?? null,
      imageUrl: item.imageUrl,
      kind: item.kind,
      active: item.active,
      category: item.category?._id ?? '',
      specifications: (item.specifications ?? []).map((spec) => ({ ...spec })),
    })
  },
  { immediate: true },
)

const submit = () => {
  emit('save', {
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    // Un campo numérico vacío llega como '' o null: ambos significan "sin oferta".
    originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
    specifications: form.specifications.filter(
      (spec) => spec.label.trim() && spec.value.trim(),
    ),
  })
}
</script>

<template>
  <form class="editor" @submit.prevent="submit">
    <div class="card-title">
      <div class="title-icon">
        <i :class="editing ? 'fa-solid fa-pen-ruler' : 'fa-solid fa-circle-plus'" aria-hidden="true"></i>
      </div>
      <div>
        <span>{{ editing ? 'Modo edición' : 'Nueva publicación' }}</span>
        <h2>{{ editing ? 'Ajusta los detalles' : 'Crear producto o servicio' }}</h2>
      </div>
    </div>

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

        <label class="field">
          <span>Tipo</span>
          <div class="input-icon">
            <i class="fa-solid fa-tags" aria-hidden="true"></i>
            <select v-model="form.kind">
              <option value="product">Producto</option>
              <option value="service">Servicio</option>
            </select>
          </div>
        </label>
      </div>

      <label class="field">
        <span>Categoría</span>
        <div class="input-icon">
          <i class="fa-solid fa-folder-open" aria-hidden="true"></i>
          <select v-model="form.category" required>
            <option disabled value="">Selecciona una categoría</option>
            <option v-for="category in categories" :key="category._id" :value="category._id">
              {{ category.name }}
            </option>
          </select>
        </div>
      </label>

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
          <strong>Publicar inmediatamente</strong>
          <small>Será visible en el sitio público al guardar.</small>
        </span>
      </label>
    </div>

    <footer class="editor-footer">
      <button v-if="editing" type="button" class="secondary" @click="emit('cancel')">
        <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Cancelar
      </button>
      <button type="submit" class="primary" :disabled="saving">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
        {{ saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar ahora' }}
      </button>
    </footer>
  </form>
</template>

<style scoped lang="scss">
.editor {
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.card-title {
  @include admin-card-title;
}

.form-body {
  @include stack($space-4);
  padding: $space-6;
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

  // El foco del teclado va al input oculto: sin esto no habia ninguna pista
  // visual al tabular hasta el interruptor.
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

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: $space-2;
  padding: $space-4 $space-6;
  border-top: 1px solid $border-subtle;
}

.primary {
  @include button-primary;
}

.secondary {
  @include button-secondary;
}

@include from($bp-md) {
  .field-row {
    flex-direction: row;

    .field {
      flex: 1;
    }
  }
}
</style>
