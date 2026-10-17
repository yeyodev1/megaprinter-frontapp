<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import type { PhotoMatch, PhotoProduct } from '@/services/learning'

/**
 * Elegir y confirmar qué producto era la foto de un cliente. Dos pasos:
 * 1) buscar y marcar el producto (o "no está en el catálogo");
 * 2) ver la foto del cliente junto al producto elegido y confirmar.
 * Lo confirmado entra como ejemplo de la vista desde la siguiente foto.
 */

const props = defineProps<{ open: boolean; photo: PhotoMatch | null; products: PhotoProduct[]; saving: boolean }>()
const emit = defineEmits<{ close: []; confirm: [productId: string | null] }>()

/** "" = nada elegido; "none" = no está en el catálogo. */
const selected = ref('')
const query = ref('')
const step = ref<'pick' | 'confirm'>('pick')

watch(
  () => [props.open, props.photo?._id],
  () => {
    step.value = 'pick'
    query.value = ''
    selected.value = props.photo?.productId ?? (props.photo?.status === 'corregida' ? 'none' : '')
  },
)

const money = (value: number) => `$${value.toFixed(2)}`
const plain = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const byId = computed(() => new Map(props.products.map((product) => [product._id, product])))
const suggested = computed(() => (props.photo?.suggestedIds ?? []).map((id) => byId.value.get(String(id))).filter((product): product is PhotoProduct => !!product))

const results = computed(() => {
  const words = plain(query.value).split(/\s+/).filter(Boolean)
  const suggestedIds = new Set(suggested.value.map((product) => product._id))
  const rest = props.products.filter((product) => !suggestedIds.has(product._id))
  if (!words.length) return rest
  return rest.filter((product) => {
    const haystack = plain(`${product.name} ${product.category}`)
    return words.every((word) => haystack.includes(word))
  })
})

const chosen = computed(() => (selected.value && selected.value !== 'none' ? byId.value.get(selected.value) : undefined))
const aiWasRight = computed(() => !!chosen.value && suggested.value[0]?._id === chosen.value._id)

const confirm = () => emit('confirm', selected.value === 'none' ? null : selected.value)
</script>

<template>
  <AppModal :open="open" eyebrow="Entrenar la vista" :title="step === 'pick' ? '¿Qué producto era?' : 'Confirma el producto'" size="lg" @close="emit('close')">
    <div v-if="photo" class="picker">
      <figure class="customer">
        <img v-if="photo.imageUrl" :src="photo.imageUrl" alt="Foto que mandó el cliente" loading="lazy" />
        <div v-else class="no-image"><i class="fa-regular fa-image" aria-hidden="true"></i></div>
        <figcaption>
          <span class="label">La IA vio</span>
          <strong>{{ photo.description || 'Sin descripción' }}</strong>
        </figcaption>
      </figure>

      <template v-if="step === 'pick'">
        <section v-if="suggested.length" class="group">
          <h3><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Lo que propuso la IA</h3>
          <label v-for="(product, index) in suggested" :key="product._id" class="option" :class="{ on: selected === product._id }">
            <input v-model="selected" type="radio" name="photo-product" :value="product._id" />
            <img v-if="product.imageUrl" :src="product.imageUrl" alt="" loading="lazy" />
            <span class="option-text">
              <span class="name">{{ product.name }}</span>
              <span class="meta">{{ product.category }} · {{ money(product.price) }}{{ index === 0 && photo.exactMatch ? ' · dijo que era este' : '' }}</span>
            </span>
            <i class="fa-solid fa-circle-check tick" aria-hidden="true"></i>
          </label>
        </section>

        <section class="group">
          <h3><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i> Buscar en el catálogo</h3>
          <label class="search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input v-model="query" type="search" placeholder="Marca, modelo o categoría" aria-label="Buscar producto" />
          </label>
          <div class="results">
            <label v-for="product in results.slice(0, 40)" :key="product._id" class="option" :class="{ on: selected === product._id }">
              <input v-model="selected" type="radio" name="photo-product" :value="product._id" />
              <img v-if="product.imageUrl" :src="product.imageUrl" alt="" loading="lazy" />
              <span class="option-text">
                <span class="name">{{ product.name }}</span>
                <span class="meta">{{ product.category }} · {{ money(product.price) }}</span>
              </span>
              <i class="fa-solid fa-circle-check tick" aria-hidden="true"></i>
            </label>
            <p v-if="!results.length" class="empty">Nada con “{{ query }}”.</p>
          </div>
          <label class="option none" :class="{ on: selected === 'none' }">
            <input v-model="selected" type="radio" name="photo-product" value="none" />
            <span class="none-icon"><i class="fa-solid fa-ban" aria-hidden="true"></i></span>
            <span class="option-text">
              <span class="name">No está en el catálogo</span>
              <span class="meta">La IA aprende a no inventar un parecido</span>
            </span>
            <i class="fa-solid fa-circle-check tick" aria-hidden="true"></i>
          </label>
        </section>
      </template>

      <section v-else class="review">
        <div class="pair">
          <div class="pair-side">
            <span class="label">Foto del cliente</span>
            <img v-if="photo.imageUrl" :src="photo.imageUrl" alt="Foto que mandó el cliente" />
          </div>
          <i class="fa-solid fa-arrow-right pair-arrow" aria-hidden="true"></i>
          <div class="pair-side">
            <span class="label">Era</span>
            <img v-if="chosen?.imageUrl" :src="chosen.imageUrl" :alt="chosen.name" />
            <div v-else class="no-image"><i class="fa-solid fa-ban" aria-hidden="true"></i></div>
          </div>
        </div>
        <p class="verdict">
          <strong>{{ chosen ? chosen.name : 'No está en el catálogo' }}</strong>
          <span v-if="chosen">{{ money(chosen.price) }}</span>
        </p>
        <p class="hint" :class="{ ok: aiWasRight }">
          <i :class="aiWasRight ? 'fa-solid fa-circle-check' : 'fa-solid fa-graduation-cap'" aria-hidden="true"></i>
          {{ aiWasRight ? 'La IA acertó: lo refuerza para la próxima.' : 'La IA se equivocó: desde la próxima foto parecida usará esta respuesta.' }}
        </p>
      </section>
    </div>

    <template #footer>
      <template v-if="step === 'pick'">
        <button type="button" class="secondary" @click="emit('close')">Cancelar</button>
        <button type="button" class="primary" :disabled="!selected" @click="step = 'confirm'">
          Continuar <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </button>
      </template>
      <template v-else>
        <button type="button" class="secondary" :disabled="saving" @click="step = 'pick'">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Cambiar
        </button>
        <button type="button" class="primary" :disabled="saving" @click="confirm">
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" aria-hidden="true"></i>
          {{ saving ? 'Guardando…' : 'Sí, confirmar' }}
        </button>
      </template>
    </template>
  </AppModal>
</template>

<style scoped lang="scss">
.picker {
  @include stack($space-5);
}

.customer {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin: 0;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-page;

  img,
  .no-image {
    width: 88px;
    height: 88px;
    flex: none;
    border-radius: $radius-sm;
    background: $surface-sunken;
    object-fit: cover;
  }

  figcaption {
    @include stack($space-1);
    min-width: 0;
    color: $text-strong;
    font-size: $admin-text-md;
  }
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-muted;
  font-size: 1.5rem;
}

.label {
  @include admin-label($text-muted);
}

.group {
  @include stack($space-2);

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    color: $text-strong;
    font-size: $admin-text-sm;
    font-weight: $weight-bold;
  }
}

.search {
  @include admin-search;
  min-width: 0;

  input {
    width: 100%;
    min-width: 0;
    flex: 1;
    border: 0;
    background: transparent;
    color: $text-strong;
    font-size: 16px;
    outline: none;
  }
}

.results {
  @include stack($space-2);
  @include scroll-area;
  max-height: 40vh;
}

.option {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: $space-3;
  padding: $space-2 $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  cursor: pointer;
  transition: border-color $duration-base $ease-out, background $duration-base $ease-out;

  input {
    @include visually-hidden;
  }

  img,
  .none-icon {
    width: 48px;
    height: 48px;
    flex: none;
    border-radius: $radius-sm;
    background: $surface-sunken;
    object-fit: contain;
  }

  .none-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text-muted;
  }

  &:has(input:focus-visible) {
    box-shadow: 0 0 0 3px rgba(0, 163, 224, 0.25);
  }

  &.on {
    border-color: $cyan-deep;
    background: rgba(0, 163, 224, 0.06);

    .tick {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.option-text {
  @include stack($space-1);
  min-width: 0;
  flex: 1;
}

.name {
  overflow: hidden;
  color: $text-strong;
  font-size: $admin-text-md;
  font-weight: $weight-bold;
  text-overflow: ellipsis;
}

.meta {
  @include mono-data($text-muted, $admin-text-xs);
}

.tick {
  flex: none;
  color: $cyan-deep;
  font-size: 1.25rem;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity $duration-base $ease-out, transform $duration-base $ease-out;
}

.empty {
  color: $text-muted;
  font-size: $admin-text-sm;
}

.review {
  @include stack($space-4);
}

.pair {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.pair-side {
  @include stack($space-2);
  min-width: 0;
  flex: 1;

  img,
  .no-image {
    width: 100%;
    aspect-ratio: 1;
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    background: $surface-sunken;
    object-fit: contain;
  }
}

.pair-arrow {
  flex: none;
  color: $cyan-deep;
}

.verdict {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;
  color: $text-strong;
  font-size: $admin-text-lg;

  span {
    @include mono-data($text-body, $admin-text-md);
  }
}

.hint {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: $surface-sunken;
  color: $text-body;
  font-size: $admin-text-sm;

  &.ok {
    background: $ok-wash;
    color: $ok;
  }
}

.primary {
  @include button-primary;
  flex: 1;
  box-shadow: none;
}

.secondary {
  @include button-secondary;
  flex: 1;
}

@include from($bp-sm) {
  .customer img,
  .customer .no-image {
    width: 112px;
    height: 112px;
  }

  .primary,
  .secondary {
    flex: none;
  }
}

@include reduced-motion {
  .tick {
    transition: none;
  }
}
</style>
