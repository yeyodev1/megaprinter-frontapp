<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CatalogItem } from '@/services/catalog'
import { categoriesFrom } from '@/config/categories'

const props = defineProps<{ items: CatalogItem[]; loading: boolean; deletingId: string }>()
const emit = defineEmits<{ edit: [item: CatalogItem]; remove: [id: string] }>()

const filter = ref<'all' | 'product' | 'service'>('all')
const categoryFilter = ref('all')
const search = ref('')

const categories = computed(() => categoriesFrom(props.items))

// Con más de cincuenta publicaciones la lista plana dejó de ser manejable:
// se filtra por tipo, categoría y texto.
const filteredItems = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return props.items.filter(
    (item) =>
      (filter.value === 'all' || item.kind === filter.value) &&
      (categoryFilter.value === 'all' || item.category.slug === categoryFilter.value) &&
      (!query || `${item.name} ${item.description}`.toLocaleLowerCase().includes(query)),
  )
})
</script>

<template>
  <section class="inventory" data-admin-reveal>
    <div class="inventory-header">
      <div>
        <p class="eyebrow"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i> Inventario</p>
        <h2>Todo lo publicado</h2>
      </div>
      <div class="filters">
        <button type="button" :class="{ active: filter === 'all' }" @click="filter = 'all'">Todos</button>
        <button type="button" :class="{ active: filter === 'product' }" @click="filter = 'product'">Productos</button>
        <button type="button" :class="{ active: filter === 'service' }" @click="filter = 'service'">Servicios</button>
      </div>
    </div>

    <div class="toolbar">
      <label class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span class="visually-hidden">Buscar publicación</span>
        <input v-model="search" type="search" placeholder="Buscar por nombre" />
      </label>
      <label class="category-select">
        <span class="visually-hidden">Filtrar por categoría</span>
        <select v-model="categoryFilter">
          <option value="all">Todas las categorías</option>
          <option v-for="category in categories" :key="category.slug" :value="category.slug">
            {{ category.name }}
          </option>
        </select>
      </label>
      <span class="count">{{ filteredItems.length }} de {{ items.length }}</span>
    </div>

    <div v-if="loading" class="empty">
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
      <h3>Cargando catálogo</h3>
    </div>

    <div v-else-if="filteredItems.length" class="item-list">
      <article v-for="item in filteredItems" :key="item._id" class="item-card">
        <div class="item-image">
          <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" loading="lazy" />
          <i v-else class="fa-solid fa-image" aria-hidden="true"></i>
          <span :class="{ draft: !item.active }">{{ item.active ? 'Publicado' : 'Borrador' }}</span>
        </div>

        <div class="item-copy">
          <span>{{ item.kind === 'product' ? 'Producto' : 'Servicio' }} · {{ item.category.name }}</span>
          <h3>{{ item.name }}</h3>
          <p>{{ item.description }}</p>
          <strong>
            ${{ item.price.toFixed(2) }}
            <small v-if="item.originalPrice">antes ${{ item.originalPrice.toFixed(2) }}</small>
          </strong>
        </div>

        <div class="item-actions">
          <button type="button" @click="emit('edit', item)">
            <i class="fa-solid fa-pen-ruler" aria-hidden="true"></i> Editar
          </button>
          <button
            type="button"
            class="delete"
            :disabled="deletingId === item._id"
            aria-label="Eliminar publicación"
            @click="emit('remove', item._id)"
          >
            <i :class="deletingId === item._id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-can'" aria-hidden="true"></i>
          </button>
        </div>
      </article>
    </div>

    <div v-else class="empty">
      <i class="fa-solid fa-box-open" aria-hidden="true"></i>
      <h3>No hay publicaciones aquí</h3>
      <p>Crea el primer producto o servicio desde el editor.</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.inventory {
  @include admin-card;
  margin-top: $space-6;
}

.inventory-header {
  @include stack($space-4);
  margin-bottom: $space-4;

  h2 {
    margin-top: $space-2;
    font-size: $text-heading;
  }
}

.eyebrow {
  @include eyebrow;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include chip;

    &.active {
      border-color: $brand-500;
      background: $brand-500;
      color: $white;
    }
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  margin-bottom: $space-2;
}

.search {
  @include row($space-2);
  min-width: 220px;
  flex: 1;
  padding: $space-2 $space-3;
  border: 1px solid $border-strong;
  border-radius: $radius-sm;
  color: $brand-600;

  &:focus-within {
    border-color: $brand-500;
  }

  input {
    width: 100%;
    border: 0;
    background: transparent;
    color: $text-strong;
    font: inherit;
    font-size: $text-body-sm;
    outline: none;
  }
}

.category-select select {
  @include input-base;
  padding: $space-2 $space-3;
  font-size: $text-body-sm;
}

.count {
  @include mono-data($text-muted, $text-eyebrow);
  margin-left: auto;
}

.item-list {
  display: flex;
  flex-direction: column;
}

.item-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
  padding-block: $space-4;
  border-top: 1px solid $border-subtle;
}

.item-image {
  position: relative;
  display: flex;
  width: 64px;
  height: 64px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $radius-sm;
  background: $surface-sunken;
  color: $brand-500;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    position: absolute;
    bottom: 3px;
    left: 3px;
    padding: 2px 5px;
    border-radius: 4px;
    background: rgba($ink-900, 0.8);
    color: $white;
    font-size: 0.5rem;
    font-weight: $weight-black;
    text-transform: uppercase;

    &.draft {
      background: $warning-500;
    }
  }
}

.item-copy {
  @include stack($space-1);
  min-width: 160px;
  flex: 1;

  > span {
    @include eyebrow;
  }

  h3 {
    font-size: $text-body-lg;
  }

  p {
    display: none;
    @include body-text($text-muted, $text-caption);
  }

  strong {
    color: $brand-700;
    font-size: $text-body-md;

    small {
      margin-left: $space-2;
      color: $text-muted;
      font-size: $text-eyebrow;
      font-weight: $weight-medium;
      text-decoration: line-through;
    }
  }
}

.item-actions {
  display: flex;
  gap: $space-2;

  button {
    @include button-secondary;
    padding: $space-2 $space-3;
    font-size: $text-eyebrow;
  }

  .delete {
    color: $danger-500;

    &:hover:not(:disabled) {
      border-color: $danger-500;
    }
  }
}

.empty {
  @include empty-state;
}

@include from($bp-md) {
  .inventory-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .item-card {
    flex-wrap: nowrap;
    gap: $space-5;
  }

  .item-image {
    width: 84px;
    height: 84px;
  }

  .item-copy p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    max-width: 520px;
    overflow: hidden;
  }
}
</style>
