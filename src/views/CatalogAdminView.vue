<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CatalogInventory from '@/components/CatalogInventory.vue'
import CatalogEditorModal, { type EditorMode } from '@/components/admin/CatalogEditorModal.vue'
import CategoryManager from '@/components/admin/CategoryManager.vue'
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalog,
  getCategories,
  importOffersCatalog,
  updateCatalogItem,
  type CatalogItem,
  type CatalogPayload,
  type Category,
} from '@/services/catalog'
import { errorMessage } from '@/services/http'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { useDialogStore } from '@/stores/dialog'

useAdminEntrance()
const dialog = useDialogStore()

const categories = ref<Category[]>([])
const items = ref<CatalogItem[]>([])

const loading = ref(true)
const saving = ref(false)
const importing = ref(false)
const busyId = ref('')
const notice = ref('')

const editorOpen = ref(false)
const editorMode = ref<EditorMode>('create')
const editorSource = ref<CatalogItem | null>(null)
const categoriesOpen = ref(false)

const fail = (caught: unknown, fallback: string) =>
  dialog.notify({ title: 'No se pudo completar', message: errorMessage(caught, fallback), tone: 'danger' })

const load = async () => {
  loading.value = true
  try {
    ;[categories.value, items.value] = await Promise.all([getCategories(), getCatalog(undefined, true)])
  } catch (caught) {
    await fail(caught, 'No pudimos cargar el catálogo.')
  } finally {
    loading.value = false
  }
}

const openEditor = (mode: EditorMode, source: CatalogItem | null = null) => {
  editorMode.value = mode
  editorSource.value = source
  editorOpen.value = true
}

const save = async (payload: CatalogPayload) => {
  saving.value = true
  try {
    if (editorMode.value === 'edit' && editorSource.value) {
      await updateCatalogItem(editorSource.value._id, payload)
      notice.value = `"${payload.name}" se actualizó correctamente.`
    } else {
      await createCatalogItem(payload)
      notice.value = payload.active
        ? `"${payload.name}" ya está publicado en el sitio.`
        : `"${payload.name}" se guardó como borrador.`
    }
    editorOpen.value = false
    await load()
  } catch (caught) {
    await fail(caught, 'No se pudo guardar la publicación.')
  } finally {
    saving.value = false
  }
}

const toggleActive = async (item: CatalogItem) => {
  const publishing = !item.active
  const confirmed = await dialog.confirm({
    title: publishing ? '¿Publicar en el sitio?' : '¿Ocultar del sitio?',
    message: publishing
      ? 'Los clientes podrán ver y comprar esta publicación de inmediato.'
      : 'La publicación dejará de verse en la tienda, pero se conserva en el panel como borrador.',
    detail: item.name,
    confirmLabel: publishing ? 'Publicar' : 'Despublicar',
    tone: publishing ? 'success' : 'warning',
  })
  if (!confirmed) return
  busyId.value = item._id
  try {
    await updateCatalogItem(item._id, { active: publishing } as CatalogPayload)
    notice.value = publishing ? `"${item.name}" ya está visible en la tienda.` : `"${item.name}" pasó a borrador.`
    await load()
  } catch (caught) {
    await fail(caught, 'No se pudo cambiar el estado de la publicación.')
  } finally {
    busyId.value = ''
  }
}

const removeItem = async (item: CatalogItem) => {
  const confirmed = await dialog.confirm({
    title: '¿Eliminar esta publicación?',
    message: 'Desaparecerá del sitio y del panel. Esta acción no se puede deshacer.',
    detail: item.name,
    confirmLabel: 'Eliminar',
    tone: 'danger',
  })
  if (!confirmed) return
  busyId.value = item._id
  try {
    await deleteCatalogItem(item._id)
    notice.value = `"${item.name}" se eliminó.`
    await load()
  } catch (caught) {
    await fail(caught, 'No se pudo eliminar la publicación.')
  } finally {
    busyId.value = ''
  }
}

const loadOffers = async () => {
  const confirmed = await dialog.confirm({
    title: 'Cargar ofertas base',
    message:
      'Se sincronizará el catálogo de ofertas (laptops, monitores, impresoras y cámaras). Las publicaciones con el mismo nombre se actualizarán con el precio, la foto y la ficha del catálogo base.',
    confirmLabel: 'Sincronizar',
    icon: 'fa-solid fa-file-arrow-up',
  })
  if (!confirmed) return
  importing.value = true
  try {
    const { imported, created, updated } = await importOffersCatalog()
    notice.value = `${imported} ofertas sincronizadas: ${created} nuevas y ${updated} actualizadas.`
    await load()
  } catch (caught) {
    await fail(caught, 'No se pudieron cargar las ofertas.')
  } finally {
    importing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="catalog-admin">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i> Gestión de catálogo</p>
        <h1>Productos y <em>servicios</em></h1>
        <p>Crea, edita, publica o retira publicaciones. Lo que guardes aparece de inmediato en el sitio.</p>
      </div>

      <div class="actions">
        <button class="secondary" type="button" :disabled="importing || loading" @click="loadOffers">
          <i :class="importing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-file-arrow-up'" aria-hidden="true"></i>
          {{ importing ? 'Sincronizando…' : 'Cargar ofertas base' }}
        </button>
        <button class="secondary" type="button" :disabled="loading" @click="categoriesOpen = true">
          <i class="fa-solid fa-shapes" aria-hidden="true"></i> Categorías
        </button>
        <button class="primary" type="button" :disabled="loading" @click="openEditor('create')">
          <i class="fa-solid fa-plus" aria-hidden="true"></i> Nuevo producto
        </button>
      </div>
    </header>

    <section class="kpis" data-admin-reveal aria-label="Resumen del catálogo">
      <div class="kpi">
        <span class="kpi-icon"><i class="fa-solid fa-layer-group" aria-hidden="true"></i></span>
        <strong>{{ items.length }}</strong><span>Publicaciones</span>
      </div>
      <div class="kpi ok">
        <span class="kpi-icon"><i class="fa-solid fa-eye" aria-hidden="true"></i></span>
        <strong>{{ items.filter((item) => item.active).length }}</strong><span>Visibles en la tienda</span>
      </div>
      <div class="kpi draft">
        <span class="kpi-icon"><i class="fa-solid fa-eye-slash" aria-hidden="true"></i></span>
        <strong>{{ items.filter((item) => !item.active).length }}</strong><span>Borradores</span>
      </div>
      <div class="kpi">
        <span class="kpi-icon"><i class="fa-solid fa-shapes" aria-hidden="true"></i></span>
        <strong>{{ categories.length }}</strong><span>Categorías</span>
      </div>
    </section>

    <p v-if="notice" class="notice ok" role="status">
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      <span>{{ notice }}</span>
      <button type="button" aria-label="Cerrar aviso" @click="notice = ''">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </p>

    <CatalogInventory
      :items="items"
      :loading="loading"
      :busy-id="busyId"
      @edit="openEditor('edit', $event)"
      @duplicate="openEditor('duplicate', $event)"
      @toggle="toggleActive"
      @remove="removeItem"
    />

    <CatalogEditorModal
      :open="editorOpen"
      :mode="editorMode"
      :source="editorSource"
      :categories="categories"
      :saving="saving"
      @save="save"
      @close="editorOpen = false"
    />

    <CategoryManager
      :open="categoriesOpen"
      :categories="categories"
      :items="items"
      @close="categoriesOpen = false"
      @changed="load"
    />
  </div>
</template>

<style scoped lang="scss">
.catalog-admin {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    flex: 1 1 auto;
  }
}

.primary {
  @include button-primary;
}

.secondary {
  @include button-secondary;
}

// Movil: franja deslizable; escritorio: una fila.
.kpis {
  display: flex;
  gap: $space-3;
  overflow-x: auto;
  margin-inline: calc(-1 * #{$space-4});
  padding: 2px $space-4 $space-1;
  scroll-padding-inline: $space-4;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
}

.kpi {
  @include stack(2px);
  flex: 0 0 156px;
  padding: $space-4 $space-5;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-xs;
  scroll-snap-align: start;

  strong {
    margin-top: $space-2;
    color: $text-strong;
    font-family: $font-display;
    font-size: 1.75rem;
    font-weight: $weight-black;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  > span:last-child {
    color: $text-body;
    font-size: $admin-text-sm;
  }

  &.ok .kpi-icon {
    background: $success-100;
    color: $success-500;
  }

  &.draft .kpi-icon {
    background: $yellow-wash;
    color: $yellow-deep;
  }
}

.kpi-icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $cyan-wash;
  color: $cyan-deep;
  font-size: $admin-text-sm;
}

.notice {
  @include admin-notice;
  align-items: center;

  span {
    flex: 1;
  }

  button {
    display: flex;
    padding: $space-1;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    @include focus-ring;

    &:hover {
      opacity: 1;
    }
  }
}

@include from($bp-md) {
  .actions {
    flex-wrap: nowrap;

    button {
      flex: none;
    }
  }

  .kpis {
    flex-wrap: wrap;
    overflow: visible;
    margin-inline: 0;
    padding: 0;
  }

  .kpi {
    flex: 1 1 150px;
  }
}
</style>
