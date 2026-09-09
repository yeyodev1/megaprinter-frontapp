<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import CatalogEditorForm from '@/components/CatalogEditorForm.vue'
import type { CatalogItem, CatalogPayload, Category } from '@/services/catalog'
import { categoryIcon, discountPercent } from '@/config/categories'
import { useDialogStore } from '@/stores/dialog'

export type EditorMode = 'create' | 'edit' | 'duplicate'

const props = defineProps<{
  open: boolean
  mode: EditorMode
  /** Publicación de origen al editar o duplicar. */
  source: CatalogItem | null
  categories: Category[]
  saving: boolean
}>()

const emit = defineEmits<{ save: [payload: CatalogPayload]; close: [] }>()

const dialog = useDialogStore()

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

const fromItem = (item: CatalogItem, duplicate: boolean): Required<CatalogPayload> => ({
  name: duplicate ? `${item.name} (copia)` : item.name,
  description: item.description,
  price: item.price,
  originalPrice: item.originalPrice ?? null,
  imageUrl: item.imageUrl,
  kind: item.kind,
  active: duplicate ? false : item.active,
  category: item.category?._id ?? '',
  specifications: (item.specifications ?? []).map((spec) => ({ ...spec })),
})

const form = ref<Required<CatalogPayload>>(emptyForm())
let snapshot = JSON.stringify(form.value)

// Cada apertura parte de un formulario limpio y guarda una foto para detectar
// cambios sin guardar al cerrar.
watch(
  () => props.open,
  (open) => {
    if (!open) return
    form.value = props.source ? fromItem(props.source, props.mode === 'duplicate') : emptyForm()
    snapshot = JSON.stringify(form.value)
  },
  { immediate: true },
)

const isDirty = computed(() => JSON.stringify(form.value) !== snapshot)

const title = computed(() =>
  props.mode === 'edit' ? 'Ajusta los detalles' : props.mode === 'duplicate' ? 'Duplicar publicación' : 'Crear producto o servicio',
)
const eyebrow = computed(() =>
  props.mode === 'edit' ? 'Modo edición' : props.mode === 'duplicate' ? 'Nueva copia' : 'Nueva publicación',
)

const priceError = computed(() => {
  const original = Number(form.value.originalPrice)
  if (!form.value.originalPrice || !Number.isFinite(original)) return ''
  return original <= Number(form.value.price) ? 'El precio anterior debe ser mayor al precio actual.' : ''
})

const canSave = computed(
  () =>
    !props.saving &&
    !!form.value.name.trim() &&
    !!form.value.description.trim() &&
    !!form.value.category &&
    Number(form.value.price) >= 0 &&
    !priceError.value,
)

const categoryName = computed(
  () => props.categories.find((category) => category._id === form.value.category) ?? null,
)
const previewDiscount = computed(() => discountPercent(Number(form.value.price) || 0, form.value.originalPrice))
const previewIcon = computed(() => categoryIcon(categoryName.value?.slug ?? ''))

const submit = () => {
  if (!canSave.value) return
  emit('save', {
    ...form.value,
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    price: Number(form.value.price),
    // Un campo numérico vacío llega como '' o null: ambos significan "sin oferta".
    originalPrice: form.value.originalPrice ? Number(form.value.originalPrice) : null,
    specifications: form.value.specifications.filter((spec) => spec.label.trim() && spec.value.trim()),
  })
}

const requestClose = async () => {
  if (props.saving) return
  if (isDirty.value) {
    const discard = await dialog.confirm({
      title: '¿Descartar cambios?',
      message: 'Hay cambios sin guardar en esta publicación. Si cierras ahora se perderán.',
      confirmLabel: 'Descartar',
      cancelLabel: 'Seguir editando',
      tone: 'warning',
    })
    if (!discard) return
  }
  emit('close')
}
</script>

<template>
  <AppModal :open="open" :title="title" :eyebrow="eyebrow" size="xl" :dismissible="!saving" @close="requestClose">
    <form :id="`catalog-editor-${mode}`" class="editor" @submit.prevent="submit">
      <div class="fields">
        <CatalogEditorForm v-model:form="form" :categories="categories" />
      </div>

      <aside class="preview" aria-label="Vista previa de la publicación">
        <p class="preview-label"><i class="fa-solid fa-eye" aria-hidden="true"></i> Así se verá en la tienda</p>

        <article class="preview-card" :class="{ draft: !form.active }">
          <div class="preview-media">
            <img v-if="form.imageUrl" :src="form.imageUrl" :alt="form.name || 'Vista previa'" />
            <div v-else class="placeholder"><i :class="previewIcon" aria-hidden="true"></i></div>
            <span v-if="categoryName" class="tag">{{ categoryName.name }}</span>
            <span v-if="previewDiscount" class="discount">-{{ previewDiscount }}%</span>
          </div>
          <div class="preview-body">
            <p class="availability">
              <span class="dot" aria-hidden="true"></span>{{ form.active ? 'En stock' : 'Borrador' }}
            </p>
            <h3>{{ form.name || 'Nombre del producto' }}</h3>
            <p class="description">{{ form.description || 'La descripción aparecerá aquí.' }}</p>
            <ul v-if="form.specifications.some((spec) => spec.label && spec.value)" class="specs">
              <li v-for="(spec, index) in form.specifications.filter((s) => s.label && s.value).slice(0, 3)" :key="index">
                <span>{{ spec.label }}</span><strong>{{ spec.value }}</strong>
              </li>
            </ul>
            <div class="price">
              <small v-if="form.originalPrice && !priceError">Antes ${{ Number(form.originalPrice).toFixed(0) }}</small>
              <strong>${{ (Number(form.price) || 0).toFixed(2) }}</strong>
            </div>
          </div>
        </article>
      </aside>
    </form>

    <template #footer>
      <button type="button" class="secondary" :disabled="saving" @click="requestClose">Cancelar</button>
      <button type="submit" :form="`catalog-editor-${mode}`" class="primary" :disabled="!canSave">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
        {{ saving ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : form.active ? 'Publicar ahora' : 'Guardar borrador' }}
      </button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.editor {
  @include stack($space-6);
}

.fields {
  flex: 1;
  min-width: 0;
}

.preview {
  @include stack($space-3);
}

.preview-label {
  @include eyebrow;
}

.preview-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  box-shadow: $shadow-sm;

  &.draft {
    border-style: dashed;
  }
}

.preview-media {
  position: relative;
  height: 180px;
  overflow: hidden;
  background: linear-gradient(150deg, $ink-050, $brand-100);

  img {
    width: 100%;
    height: 100%;
    padding: 7%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  .placeholder {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    color: $brand-700;
    font-size: 2.5rem;
    opacity: 0.65;
  }

  .tag {
    @include badge($brand-700, rgba(255, 255, 255, 0.92));
    position: absolute;
    top: $space-3;
    left: $space-3;
    box-shadow: $shadow-xs;
  }

  .discount {
    @include badge($white, $accent-500);
    position: absolute;
    top: $space-3;
    right: $space-3;
    box-shadow: $shadow-xs;
  }
}

.preview-body {
  @include stack($space-2);
  padding: $space-4;

  h3 {
    @include display-heading($text-subheading, $width-normal);
    overflow-wrap: anywhere;
  }
}

.availability {
  @include eyebrow($ok);

  .dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: $ok;
  }

  .draft & {
    color: $warning-500;

    .dot {
      background: $warning-500;
    }
  }
}

.description {
  @include body-text($text-body, $text-caption);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
}

.specs {
  display: flex;
  flex-direction: column;
  border-top: 1px solid $border-subtle;

  li {
    display: flex;
    justify-content: space-between;
    gap: $space-3;
    padding-block: $space-1;
    border-bottom: 1px solid $border-subtle;
    @include mono-data($text-muted, $text-eyebrow);
  }

  strong {
    color: $text-strong;
    font-weight: $weight-medium;
    text-align: right;
  }
}

.price {
  @include stack(2px);
  padding-top: $space-2;

  small {
    @include mono-data($text-muted, $text-eyebrow);
    text-decoration: line-through;
  }

  strong {
    @include price(1.25rem);
  }
}

.primary {
  @include button-primary;
}

.secondary {
  @include button-secondary;
}

@include from($bp-md) {
  .editor {
    flex-direction: row;
    align-items: flex-start;
    gap: $space-8;
  }

  .preview {
    position: sticky;
    top: 0;
    width: 300px;
    flex: none;
  }
}
</style>
