<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogItem } from '@/services/catalog'
import { categoryIcon, discountPercent } from '@/config/categories'

const props = defineProps<{ item: CatalogItem; busy: boolean }>()
const emit = defineEmits<{
  edit: [item: CatalogItem]
  toggle: [item: CatalogItem]
  duplicate: [item: CatalogItem]
  remove: [item: CatalogItem]
}>()

const discount = computed(() => discountPercent(props.item.price, props.item.originalPrice))
const icon = computed(() => categoryIcon(props.item.category.slug))
</script>

<template>
  <article class="item-row" :class="{ draft: !item.active }">
    <div class="thumb">
      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" loading="lazy" />
      <i v-else :class="icon" aria-hidden="true"></i>
    </div>

    <div class="copy">
      <div class="badges">
        <span class="badge category"><i :class="icon" aria-hidden="true"></i>{{ item.category.name }}</span>
        <span class="badge kind">{{ item.kind === 'product' ? 'Producto' : 'Servicio' }}</span>
        <span class="badge status" :class="item.active ? 'paid' : 'pending'">
          {{ item.active ? 'Publicado' : 'Borrador' }}
        </span>
      </div>
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
    </div>

    <div class="pricing">
      <strong>${{ item.price.toFixed(2) }}</strong>
      <small v-if="item.originalPrice">
        <s>${{ item.originalPrice.toFixed(2) }}</s>
        <em v-if="discount">-{{ discount }}%</em>
      </small>
    </div>

    <div class="actions">
      <button type="button" class="primary" :disabled="busy" @click="emit('edit', item)">
        <i class="fa-solid fa-pen-ruler" aria-hidden="true"></i> Editar
      </button>
      <button
        type="button"
        :disabled="busy"
        :title="item.active ? 'Ocultar del sitio' : 'Publicar en el sitio'"
        @click="emit('toggle', item)"
      >
        <i :class="item.active ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'" aria-hidden="true"></i>
        <span>{{ item.active ? 'Despublicar' : 'Publicar' }}</span>
      </button>
      <button type="button" :disabled="busy" title="Duplicar publicación" @click="emit('duplicate', item)">
        <i class="fa-regular fa-copy" aria-hidden="true"></i>
        <span>Duplicar</span>
      </button>
      <button
        type="button"
        class="delete"
        :disabled="busy"
        aria-label="Eliminar publicación"
        title="Eliminar publicación"
        @click="emit('remove', item)"
      >
        <i :class="busy ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-trash-can'" aria-hidden="true"></i>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: $space-3;
  padding-block: $space-4;
  border-top: 1px solid $border-subtle;

  &.draft .thumb {
    opacity: 0.6;
  }
}

.thumb {
  display: flex;
  width: 64px;
  height: 64px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $radius-sm;
  background: linear-gradient(150deg, $ink-050, $brand-100);
  color: $brand-500;
  font-size: 1.25rem;

  img {
    width: 100%;
    height: 100%;
    padding: 6%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
}

.copy {
  @include stack($space-1);
  min-width: 0;
  flex: 1 1 200px;

  h3 {
    font-size: $text-body-lg;
  }

  p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    @include body-text($text-muted, $text-caption);
  }
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.badge {
  @include badge;

  &.category {
    background: $brand-100;
    color: $brand-700;
  }

  &.status {
    @include admin-status-badge;
  }
}

.pricing {
  @include stack(2px);
  flex: 0 0 auto;
  align-items: flex-start;

  strong {
    @include price(1.125rem, $brand-700);
  }

  small {
    @include row($space-2);
    @include mono-data($text-muted, $text-eyebrow);

    em {
      padding: 1px $space-1;
      border-radius: $radius-xs;
      background: $accent-100;
      color: $accent-600;
      font-style: normal;
      font-weight: $weight-semibold;
    }
  }
}

.actions {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include button-secondary;
    padding: $space-2 $space-3;
    font-size: $text-eyebrow;
  }

  .primary {
    border-color: $brand-500;
    color: $brand-700;
  }

  .delete {
    color: $danger-500;

    &:hover:not(:disabled) {
      border-color: $danger-500;
    }
  }
}

@include from($bp-md) {
  .item-row {
    flex-wrap: nowrap;
    align-items: center;
    gap: $space-5;
  }

  .thumb {
    width: 84px;
    height: 84px;
  }

  .pricing {
    width: 130px;
    align-items: flex-end;
    text-align: right;

    small {
      justify-content: flex-end;
    }
  }

  .actions {
    width: auto;
    flex-wrap: nowrap;
    justify-content: flex-end;

    span {
      @include visually-hidden;
    }

    .primary span {
      position: static;
    }
  }
}

@include from($bp-xl) {
  .actions span {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    clip-path: none;
  }
}
</style>
