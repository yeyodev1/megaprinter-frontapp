<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminNav from '@/components/AdminNav.vue'
import CatalogEditorForm from '@/components/CatalogEditorForm.vue'
import CatalogInventory from '@/components/CatalogInventory.vue'
import {
  createCatalogItem,
  createCategory,
  deleteCatalogItem,
  deleteCategory,
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

useAdminEntrance()

const categories = ref<Category[]>([])
const items = ref<CatalogItem[]>([])
const editing = ref<CatalogItem | null>(null)
const newCategory = ref('')

const loading = ref(true)
const saving = ref(false)
const importing = ref(false)
const categorySaving = ref(false)
const deletingId = ref('')
const notice = ref({ text: '', kind: '' as 'ok' | 'error' | '' })

const report = (text: string, kind: 'ok' | 'error') => {
  notice.value = { text, kind }
}

const load = async () => {
  loading.value = true
  try {
    ;[categories.value, items.value] = await Promise.all([
      getCategories(),
      getCatalog(undefined, true),
    ])
  } catch (caught) {
    report(errorMessage(caught, 'No pudimos cargar el catálogo.'), 'error')
  } finally {
    loading.value = false
  }
}

const save = async (payload: CatalogPayload) => {
  saving.value = true
  try {
    if (editing.value) await updateCatalogItem(editing.value._id, payload)
    else await createCatalogItem(payload)
    editing.value = null
    report('Publicación guardada.', 'ok')
    await load()
  } catch (caught) {
    report(errorMessage(caught, 'No se pudo guardar la publicación.'), 'error')
  } finally {
    saving.value = false
  }
}

const edit = (item: CatalogItem) => {
  editing.value = item
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const removeItem = async (id: string) => {
  if (!confirm('¿Eliminar esta publicación?')) return
  deletingId.value = id
  try {
    await deleteCatalogItem(id)
    if (editing.value?._id === id) editing.value = null
    await load()
  } catch (caught) {
    report(errorMessage(caught, 'No se pudo eliminar la publicación.'), 'error')
  } finally {
    deletingId.value = ''
  }
}

const addCategory = async () => {
  categorySaving.value = true
  try {
    await createCategory(newCategory.value.trim())
    newCategory.value = ''
    await load()
  } catch (caught) {
    report(errorMessage(caught, 'No se pudo crear la categoría.'), 'error')
  } finally {
    categorySaving.value = false
  }
}

const removeCategory = async (id: string) => {
  if (!confirm('¿Eliminar esta categoría?')) return
  try {
    await deleteCategory(id)
    await load()
  } catch (caught) {
    // El backend responde 409 cuando la categoria todavia tiene productos.
    report(errorMessage(caught, 'No se pudo eliminar la categoría.'), 'error')
  }
}

const loadOffers = async () => {
  if (!confirm('Se cargarán o actualizarán las ofertas del catálogo base. ¿Continuar?')) return
  importing.value = true
  try {
    const { imported } = await importOffersCatalog()
    report(`${imported} ofertas cargadas correctamente.`, 'ok')
    await load()
  } catch (caught) {
    report(errorMessage(caught, 'No se pudieron cargar las ofertas.'), 'error')
  } finally {
    importing.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="catalog-admin">
    <AdminNav />

    <main id="contenido">
      <header class="page-header" data-admin-reveal>
        <div>
          <p class="eyebrow"><i class="fa-solid fa-sparkles" aria-hidden="true"></i> Gestión de catálogo</p>
          <h1>Construye tu<br /><em>vitrina digital.</em></h1>
          <p>Publica productos y servicios que aparecen directamente en el sitio web.</p>
        </div>

        <div class="header-side">
          <button class="import" type="button" :disabled="importing || loading" @click="loadOffers">
            <i :class="importing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-file-arrow-up'" aria-hidden="true"></i>
            {{ importing ? 'Actualizando…' : 'Cargar ofertas base' }}
          </button>
          <div class="header-metric">
            <i class="fa-solid fa-boxes-stacked" aria-hidden="true"></i>
            <strong>{{ items.length }}</strong>
            <span>publicaciones</span>
          </div>
        </div>
      </header>

      <p v-if="notice.text" class="notice" :class="notice.kind" role="status">{{ notice.text }}</p>

      <section class="workspace" data-admin-reveal>
        <CatalogEditorForm
          :categories="categories"
          :editing="editing"
          :saving="saving"
          @save="save"
          @cancel="editing = null"
        />

        <aside class="sidebar">
          <div class="side-title">
            <div><span>Organización</span><h2>Categorías</h2></div>
            <i class="fa-solid fa-shapes" aria-hidden="true"></i>
          </div>

          <form class="category-form" @submit.prevent="addCategory">
            <input v-model="newCategory" placeholder="Nueva categoría" required :disabled="categorySaving" />
            <button :disabled="categorySaving" aria-label="Agregar categoría">
              <i :class="categorySaving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plus'" aria-hidden="true"></i>
            </button>
          </form>

          <div class="category-list">
            <div v-for="category in categories" :key="category._id">
              <span><i class="fa-solid fa-folder" aria-hidden="true"></i>{{ category.name }}</span>
              <button type="button" aria-label="Eliminar categoría" @click="removeCategory(category._id)">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </div>
            <p v-if="!categories.length">Crea tu primera categoría para comenzar.</p>
          </div>

          <p class="tip">
            <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
            Las categorías organizan el catálogo y facilitan la navegación de tus clientes.
          </p>
        </aside>
      </section>

      <CatalogInventory
        :items="items"
        :loading="loading"
        :deleting-id="deletingId"
        @edit="edit"
        @remove="removeItem"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.catalog-admin {
  @include admin-shell;
}

.page-header {
  @include admin-header;
}

.eyebrow {
  @include admin-eyebrow;
}

.header-side {
  @include stack($space-3);
  align-items: flex-start;
}

.import {
  @include button-secondary;
}

.header-metric {
  @include admin-stat-card;
}

.notice {
  margin-bottom: $space-5;
  padding: $space-3 $space-4;
  border-radius: $radius-sm;
  font-size: $text-body-sm;
  font-weight: $weight-semibold;

  &.ok {
    background: $success-100;
    color: $success-500;
  }

  &.error {
    background: $danger-100;
    color: $danger-500;
  }
}

.workspace {
  @include stack($space-5);
}

.sidebar {
  @include admin-card;
}

.side-title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  span {
    @include eyebrow;
  }

  h2 {
    margin-top: 2px;
    font-size: $text-subheading;
  }

  > i {
    color: $brand-400;
    font-size: 1.35rem;
  }
}

.category-form {
  display: flex;
  gap: $space-2;
  margin: $space-5 0 $space-3;

  input {
    @include input-base;
  }

  button {
    @include button-primary;
    width: 44px;
    flex: none;
    padding: 0;
  }
}

.category-list {
  display: flex;
  flex-direction: column;

  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-block: $space-3;
    border-top: 1px solid $border-subtle;
  }

  span {
    @include row($space-2);
    font-size: $text-body-sm;
    font-weight: $weight-semibold;

    i {
      color: $brand-500;
    }
  }

  button {
    @include button-ghost($text-muted);
    padding: $space-1 $space-2;

    &:hover {
      color: $danger-500;
    }
  }

  p {
    padding-block: $space-4;
    color: $text-muted;
    font-size: $text-caption;
  }
}

.tip {
  display: flex;
  gap: $space-2;
  margin-top: $space-5;
  padding: $space-3;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-700;
  font-size: $text-eyebrow;
  line-height: $leading-body;
}

@include from($bp-md) {
  .header-side {
    align-items: flex-end;
  }

  .workspace {
    flex-direction: row;
    align-items: flex-start;

    > :first-child {
      flex: 1.5;
    }
  }

  .sidebar {
    flex: 1;
  }
}
</style>
