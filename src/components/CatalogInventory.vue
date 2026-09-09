<script setup lang="ts">
import { computed, ref } from 'vue'
import AppSelect, { type SelectOption } from '@/components/ui/AppSelect.vue'
import CatalogItemRow from '@/components/admin/CatalogItemRow.vue'
import type { CatalogItem } from '@/services/catalog'
import { categoriesFrom, categoryIcon } from '@/config/categories'

const props = defineProps<{ items: CatalogItem[]; loading: boolean; busyId: string }>()
const emit = defineEmits<{
  edit: [item: CatalogItem]
  toggle: [item: CatalogItem]
  duplicate: [item: CatalogItem]
  remove: [item: CatalogItem]
}>()

const search = ref('')
const category = ref<string | number | null>('all')
const state = ref<string | number | null>('all')
const kind = ref<string | number | null>('all')

const categoryOptions = computed<SelectOption[]>(() => [
  { value: 'all', label: 'Todas las categorías', icon: 'fa-solid fa-border-all' },
  ...categoriesFrom(props.items).map((item) => ({
    value: item.slug,
    label: item.name,
    icon: categoryIcon(item.slug),
  })),
])

const stateOptions: SelectOption[] = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Publicados', icon: 'fa-solid fa-eye' },
  { value: 'draft', label: 'Borradores', icon: 'fa-solid fa-eye-slash' },
]

const kindOptions: SelectOption[] = [
  { value: 'all', label: 'Productos y servicios' },
  { value: 'product', label: 'Productos', icon: 'fa-solid fa-box' },
  { value: 'service', label: 'Servicios', icon: 'fa-solid fa-screwdriver-wrench' },
]

// Con más de cincuenta publicaciones la lista plana dejó de ser manejable:
// se filtra por texto, categoría, estado y tipo.
const filteredItems = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return props.items.filter((item) => {
    if (category.value !== 'all' && item.category.slug !== category.value) return false
    if (state.value === 'active' && !item.active) return false
    if (state.value === 'draft' && item.active) return false
    if (kind.value !== 'all' && item.kind !== kind.value) return false
    if (!query) return true
    const haystack = `${item.name} ${item.description} ${item.category.name}`.toLocaleLowerCase()
    return query.split(/\s+/).every((term) => haystack.includes(term))
  })
})

const hasFilters = computed(
  () => !!search.value.trim() || category.value !== 'all' || state.value !== 'all' || kind.value !== 'all',
)

const resetFilters = () => {
  search.value = ''
  category.value = 'all'
  state.value = 'all'
  kind.value = 'all'
}
</script>

<template>
  <section class="inventory" data-admin-reveal>
    <div class="inventory-header">
      <div>
        <p class="eyebrow"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> Inventario</p>
        <h2>Todo lo publicado</h2>
      </div>
      <span class="count">{{ filteredItems.length }} de {{ items.length }}</span>
    </div>

    <div class="toolbar">
      <label class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span class="visually-hidden">Buscar publicación</span>
        <input v-model="search" type="search" placeholder="Buscar por nombre, descripción o categoría" />
      </label>
      <div class="filter">
        <AppSelect v-model="category" :options="categoryOptions" size="sm" aria-label="Filtrar por categoría" />
      </div>
      <div class="filter">
        <AppSelect v-model="state" :options="stateOptions" size="sm" aria-label="Filtrar por estado" />
      </div>
      <div class="filter">
        <AppSelect v-model="kind" :options="kindOptions" size="sm" aria-label="Filtrar por tipo" />
      </div>
      <button v-if="hasFilters" type="button" class="reset" @click="resetFilters">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i> Limpiar
      </button>
    </div>

    <div v-if="loading" class="empty">
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
      <h3>Cargando catálogo</h3>
    </div>

    <div v-else-if="filteredItems.length" class="item-list">
      <CatalogItemRow
        v-for="item in filteredItems"
        :key="item._id"
        :item="item"
        :busy="busyId === item._id"
        @edit="emit('edit', $event)"
        @toggle="emit('toggle', $event)"
        @duplicate="emit('duplicate', $event)"
        @remove="emit('remove', $event)"
      />
    </div>

    <div v-else class="empty">
      <i class="fa-solid fa-box-open" aria-hidden="true"></i>
      <h3>{{ hasFilters ? 'Nada coincide con esos filtros' : 'No hay publicaciones aquí' }}</h3>
      <p>
        {{ hasFilters ? 'Prueba con otra búsqueda o limpia los filtros.' : 'Crea el primer producto o servicio con el botón "Nuevo producto".' }}
      </p>
      <button v-if="hasFilters" type="button" class="reset" @click="resetFilters">Limpiar filtros</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.inventory {
  @include admin-card;
}

.inventory-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: $space-3;
  margin-bottom: $space-4;

  h2 {
    margin-top: $space-2;
    font-size: $text-heading;
  }
}

.eyebrow {
  @include eyebrow;
}

.count {
  @include mono-data($text-muted, $text-eyebrow);
  white-space: nowrap;
}

.toolbar {
  @include admin-toolbar;
  margin-bottom: $space-2;
}

.search {
  @include admin-search;
  flex-basis: 100%;
}

.filter {
  flex: 1 1 160px;
  min-width: 0;
}

.reset {
  @include button-ghost($brand-600);
  padding: $space-2 $space-3;
  font-size: $text-caption;
}

.item-list {
  display: flex;
  flex-direction: column;
}

.empty {
  @include empty-state;

  button {
    @include button-secondary;
  }
}

@include from($bp-md) {
  .search {
    flex-basis: 280px;
  }

  .filter {
    flex: 0 1 200px;
  }
}
</style>
