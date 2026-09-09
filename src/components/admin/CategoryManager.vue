<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CatalogItem,
  type Category,
} from '@/services/catalog'
import { errorMessage } from '@/services/http'
import { categoryIcon, sortCategories } from '@/config/categories'
import { useDialogStore } from '@/stores/dialog'

const props = defineProps<{ open: boolean; categories: Category[]; items: CatalogItem[] }>()
const emit = defineEmits<{ close: []; changed: [] }>()

const dialog = useDialogStore()

const newName = ref('')
const creating = ref(false)
const renamingId = ref('')
const renameValue = ref('')
const busyId = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

const counts = computed(() => {
  const map = new Map<string, number>()
  for (const item of props.items) {
    const id = item.category?._id ?? ''
    map.set(id, (map.get(id) ?? 0) + 1)
  }
  return map
})

const rows = computed(() =>
  sortCategories(props.categories).map((category) => ({
    ...category,
    icon: categoryIcon(category.slug),
    count: counts.value.get(category._id) ?? 0,
  })),
)

const fail = (caught: unknown, fallback: string) =>
  dialog.notify({ title: 'No se pudo completar', message: errorMessage(caught, fallback), tone: 'danger' })

const create = async () => {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await createCategory(name)
    newName.value = ''
    emit('changed')
  } catch (caught) {
    await fail(caught, 'No se pudo crear la categoría.')
  } finally {
    creating.value = false
  }
}

const startRename = async (category: Category) => {
  renamingId.value = category._id
  renameValue.value = category.name
  await nextTick()
  renameInput.value?.focus()
  renameInput.value?.select()
}

const cancelRename = () => {
  renamingId.value = ''
  renameValue.value = ''
}

const saveRename = async (category: Category) => {
  const name = renameValue.value.trim()
  if (!name || name === category.name) {
    cancelRename()
    return
  }
  busyId.value = category._id
  try {
    await updateCategory(category._id, name)
    cancelRename()
    emit('changed')
  } catch (caught) {
    await fail(caught, 'No se pudo renombrar la categoría.')
  } finally {
    busyId.value = ''
  }
}

const remove = async (category: Category & { count: number }) => {
  if (category.count > 0) {
    await dialog.notify({
      title: 'La categoría tiene productos',
      message: `Mueve o elimina las ${category.count} publicaciones asociadas antes de borrar "${category.name}".`,
      tone: 'warning',
    })
    return
  }
  const confirmed = await dialog.confirm({
    title: '¿Eliminar esta categoría?',
    message: 'Esta acción no se puede deshacer.',
    detail: category.name,
    confirmLabel: 'Eliminar',
    tone: 'danger',
  })
  if (!confirmed) return
  busyId.value = category._id
  try {
    await deleteCategory(category._id)
    emit('changed')
  } catch (caught) {
    await fail(caught, 'No se pudo eliminar la categoría.')
  } finally {
    busyId.value = ''
  }
}
</script>

<template>
  <AppModal :open="open" title="Categorías del catálogo" eyebrow="Organización" size="md" @close="emit('close')">
    <form class="create" @submit.prevent="create">
      <label class="create-field">
        <span class="visually-hidden">Nombre de la nueva categoría</span>
        <i class="fa-solid fa-folder-plus" aria-hidden="true"></i>
        <input v-model="newName" placeholder="Nueva categoría, ej. Accesorios" :disabled="creating" required />
      </label>
      <button type="submit" :disabled="creating || !newName.trim()">
        <i :class="creating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plus'" aria-hidden="true"></i> Crear
      </button>
    </form>

    <ul v-if="rows.length" class="list">
      <li v-for="category in rows" :key="category._id" class="row">
        <span class="row-icon"><i :class="category.icon" aria-hidden="true"></i></span>

        <form v-if="renamingId === category._id" class="rename" @submit.prevent="saveRename(category)">
          <input
            ref="renameInput"
            v-model="renameValue"
            aria-label="Nuevo nombre"
            :disabled="busyId === category._id"
            @keydown.esc.prevent="cancelRename"
          />
          <button type="submit" class="icon-button save" aria-label="Guardar nombre" :disabled="busyId === category._id">
            <i :class="busyId === category._id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" aria-hidden="true"></i>
          </button>
          <button type="button" class="icon-button" aria-label="Cancelar" @click="cancelRename">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </form>

        <template v-else>
          <span class="row-copy">
            <strong>{{ category.name }}</strong>
            <small>{{ category.count }} {{ category.count === 1 ? 'publicación' : 'publicaciones' }} · /{{ category.slug }}</small>
          </span>
          <span class="row-actions">
            <button type="button" class="icon-button" aria-label="Renombrar categoría" title="Renombrar" @click="startRename(category)">
              <i class="fa-solid fa-pen" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="icon-button delete"
              :class="{ blocked: category.count > 0 }"
              aria-label="Eliminar categoría"
              :title="category.count > 0 ? 'Tiene publicaciones asociadas' : 'Eliminar'"
              :disabled="busyId === category._id"
              @click="remove(category)"
            >
              <i :class="busyId === category._id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-can'" aria-hidden="true"></i>
            </button>
          </span>
        </template>
      </li>
    </ul>

    <p v-else class="empty">Crea tu primera categoría para organizar el catálogo.</p>

    <p class="tip">
      <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
      Las categorías aparecen como filtros en la tienda. Solo se pueden borrar cuando no tienen publicaciones.
    </p>

    <template #footer>
      <button type="button" class="close" @click="emit('close')">Listo</button>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.create {
  display: flex;
  gap: $space-2;
  margin-bottom: $space-4;

  > button {
    @include button-primary;
    flex: none;
  }
}

.create-field {
  @include admin-search;
  min-width: 0;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding-block: $space-3;
  border-top: 1px solid $border-subtle;
}

.row-icon {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-600;
  font-size: $text-caption;
}

.row-copy {
  @include stack(2px);
  min-width: 0;
  flex: 1;

  strong {
    font-size: $text-body-sm;
  }

  small {
    @include truncate;
    @include mono-data($text-muted, $text-eyebrow);
  }
}

.row-actions {
  display: flex;
  gap: $space-1;
}

.rename {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: $space-1;

  input {
    @include input-base;
    min-width: 0;
    flex: 1;
    padding: $space-2 $space-3;
    font-size: $text-body-sm;
  }
}

.icon-button {
  display: flex;
  width: 34px;
  height: 34px;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $surface-card;
  color: $text-body;
  cursor: pointer;
  transition: border-color $duration-base $ease-out, color $duration-base $ease-out;
  @include focus-ring;

  &:hover:not(:disabled) {
    border-color: $brand-500;
    color: $brand-700;
  }

  &.save {
    color: $success-500;
  }

  &.delete:hover:not(:disabled) {
    border-color: $danger-500;
    color: $danger-500;
  }

  &.blocked {
    opacity: 0.45;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.empty {
  padding-block: $space-6;
  color: $text-muted;
  font-size: $text-caption;
  text-align: center;
}

.tip {
  display: flex;
  gap: $space-2;
  margin-top: $space-4;
  padding: $space-3;
  border-radius: $radius-sm;
  background: $brand-100;
  color: $brand-700;
  font-size: $text-eyebrow;
  line-height: $leading-body;
}

.close {
  @include button-secondary;
}
</style>
