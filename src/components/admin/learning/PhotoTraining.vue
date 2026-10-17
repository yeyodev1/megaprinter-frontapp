<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PhotoPickerModal from './PhotoPickerModal.vue'
import { correctPhoto, getPhotos, type PhotoMatch, type PhotoProduct, type PhotoStatus } from '@/services/learning'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'

/**
 * La vista de Mila: fotos de productos que mandan los clientes y lo que la IA
 * reconoció. Confirmar o corregir aquí la entrena para la siguiente foto.
 */

const emit = defineEmits<{ notice: [text: string] }>()
const dialog = useDialogStore()

const loading = ref(true)
const photos = ref<PhotoMatch[]>([])
const products = ref<PhotoProduct[]>([])
const filter = ref<'revisar' | 'aprendidas' | 'todas'>('revisar')
const picking = ref<PhotoMatch | null>(null)
const saving = ref(false)

const STATUS_LABEL: Record<PhotoStatus, string> = {
  sugerida: 'Por revisar',
  confirmada: 'La eligió el cliente',
  corregida: 'Corregida por el equipo',
  descartada: 'Descartada',
}
const FILTERS = [
  { value: 'revisar', label: 'Por revisar' },
  { value: 'aprendidas', label: 'Aprendidas' },
  { value: 'todas', label: 'Todas' },
] as const

const byId = computed(() => new Map(products.value.map((product) => [product._id, product])))
const learned = (photo: PhotoMatch) => photo.status === 'confirmada' || photo.status === 'corregida'
const visible = computed(() =>
  photos.value.filter((photo) => (filter.value === 'todas' ? true : filter.value === 'aprendidas' ? learned(photo) : photo.status === 'sugerida')),
)
const countFor = (value: (typeof FILTERS)[number]['value']) =>
  value === 'todas' ? photos.value.length : photos.value.filter((photo) => (value === 'aprendidas' ? learned(photo) : photo.status === 'sugerida')).length

const productName = (id: string | null | undefined) => (id ? byId.value.get(String(id))?.name ?? 'Producto eliminado' : '')
const when = (date: string) =>
  new Date(date).toLocaleString('es-EC', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' })

const load = async () => {
  try {
    const data = await getPhotos()
    photos.value = data.photos
    products.value = data.products
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar las fotos', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const replace = (updated: PhotoMatch) => {
  photos.value = photos.value.map((photo) => (photo._id === updated._id ? updated : photo))
}

const save = async (productId: string | null) => {
  if (!picking.value) return
  saving.value = true
  try {
    replace(await correctPhoto(picking.value._id, { productId }))
    picking.value = null
    emit('notice', 'Listo: la vista ya usa esta foto como ejemplo.')
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    saving.value = false
  }
}

const discard = async (photo: PhotoMatch) => {
  const confirmed = await dialog.confirm({
    title: '¿Descartar esta foto?',
    message: 'No se usará para entrenar la vista. Úsalo con fotos que no son de un producto.',
    confirmLabel: 'Descartar',
    tone: 'danger',
    icon: 'fa-solid fa-ban',
  })
  if (!confirmed) return
  try {
    replace(await correctPhoto(photo._id, { status: 'descartada' }))
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo descartar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  }
}

onMounted(load)
</script>

<template>
  <section class="photos">
    <header class="section-head">
      <div>
        <h2>La vista de Mila</h2>
        <p class="muted">Fotos de productos que mandaron los clientes. Dile cuál era y la próxima foto parecida la reconoce mejor.</p>
      </div>
    </header>

    <div class="tabs" role="tablist">
      <button
        v-for="item in FILTERS"
        :key="item.value"
        type="button"
        role="tab"
        class="tab"
        :class="{ on: filter === item.value }"
        :aria-selected="filter === item.value"
        @click="filter = item.value"
      >
        {{ item.label }} <span class="tab-count">{{ countFor(item.value) }}</span>
      </button>
    </div>

    <p v-if="loading" class="muted">Cargando fotos…</p>
    <p v-else-if="!visible.length" class="muted">
      {{ filter === 'revisar' ? 'No hay fotos por revisar. Cuando un cliente mande la foto de un producto, aparece aquí.' : 'Nada por aquí.' }}
    </p>

    <div v-else class="grid">
      <article v-for="photo in visible" :key="photo._id" class="photo" :class="photo.status">
        <button type="button" class="thumb" :aria-label="`Entrenar con la foto: ${photo.description}`" @click="picking = photo">
          <img v-if="photo.imageUrl" :src="photo.imageUrl" alt="" loading="lazy" />
          <i v-else class="fa-regular fa-image" aria-hidden="true"></i>
          <span class="status">{{ STATUS_LABEL[photo.status] }}</span>
        </button>
        <div class="body">
          <p class="desc">{{ photo.description || 'Sin descripción' }}</p>
          <p v-if="learned(photo)" class="answer">
            <i class="fa-solid fa-check" aria-hidden="true"></i>
            {{ photo.productId ? productName(photo.productId) : 'No está en el catálogo' }}
          </p>
          <p v-else-if="photo.suggestedIds.length" class="answer guess">
            <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> {{ productName(photo.suggestedIds[0]) }}
          </p>
          <p class="meta">{{ when(photo.createdAt) }}{{ photo.confirmedBy ? ` · ${photo.confirmedBy}` : '' }}</p>
          <div class="actions">
            <button type="button" class="small primary-small" @click="picking = photo">
              <i class="fa-solid fa-graduation-cap" aria-hidden="true"></i> {{ learned(photo) ? 'Cambiar' : '¿Cuál era?' }}
            </button>
            <button v-if="photo.status !== 'descartada'" type="button" class="icon" aria-label="Descartar foto" title="Descartar" @click="discard(photo)">
              <i class="fa-solid fa-ban" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    </div>

    <PhotoPickerModal :open="!!picking" :photo="picking" :products="products" :saving="saving" @close="picking = null" @confirm="save" />
  </section>
</template>

<style scoped lang="scss">
.photos {
  @include stack($space-4);
}

.section-head {
  h2 {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }
}

.muted {
  color: $text-muted;
  font-size: $admin-text-md;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.tab {
  @include button-secondary;

  &.on {
    border-color: $cyan-deep;
    color: $cyan-deep;
  }
}

.tab-count {
  @include mono-data(inherit, $admin-text-xs);
  margin-left: $space-1;
}

.grid {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.photo {
  @include admin-card(0);
  display: flex;
  min-width: 0;
  flex: 1 1 100%;
  overflow: hidden;

  &.descartada {
    opacity: 0.6;
  }
}

.thumb {
  position: relative;
  display: flex;
  width: 112px;
  flex: none;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: $surface-sunken;
  color: $text-muted;
  cursor: pointer;
  @include focus-ring;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.status {
  position: absolute;
  right: $space-1;
  bottom: $space-1;
  left: $space-1;
  padding: 2px $space-1;
  border-radius: $radius-sm;
  background: rgba($key-900, 0.72);
  color: #fff;
  font-size: 11px;
  text-align: center;

  .confirmada &,
  .corregida & {
    background: $ok;
  }
}

.body {
  @include stack($space-1);
  min-width: 0;
  flex: 1;
  padding: $space-3;
}

.desc {
  color: $text-strong;
  font-size: $admin-text-md;
  font-weight: $weight-bold;
}

.answer {
  display: flex;
  align-items: baseline;
  gap: $space-1;
  color: $ok;
  font-size: $admin-text-sm;

  &.guess {
    color: $text-body;
  }
}

.meta {
  @include mono-data($text-muted, $admin-text-xs);
}

.actions {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin-top: auto;
  padding-top: $space-2;
}

.small {
  @include button-secondary;
}

.primary-small {
  border-color: $cyan-deep;
  color: $cyan-deep;
}

.icon {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  flex: none;
  padding: 0;
  margin-left: auto;
}

@include from($bp-md) {
  .photo {
    flex: 1 1 calc(50% - #{$space-3});
    max-width: calc(50% - #{$space-3} / 2);
  }
}
</style>
