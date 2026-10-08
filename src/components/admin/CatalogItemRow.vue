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
        <i class="fa-solid fa-pen" aria-hidden="true"></i> <span>Editar</span>
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
  gap: $space-3 $space-4;
  padding: $space-4 $space-5;
  border-top: 1px solid $border-subtle;
  transition: background $duration-fast $ease-out;

  &:first-child {
    border-top: 0;
  }

  @media (hover: hover) {
    &:hover {
      background: $surface-page;
    }
  }

  &.draft {
    .thumb {
      opacity: 0.55;
    }

    h3 {
      color: $text-body;
    }
  }
}

.thumb {
  display: flex;
  width: 72px;
  height: 72px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-page;
  color: $brand-500;
  font-size: 1.375rem;

  img {
    width: 100%;
    height: 100%;
    padding: 8%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
}

.copy {
  @include stack(6px);
  min-width: 0;
  flex: 1 1 200px;

  h3 {
    color: $text-strong;
    font-size: $admin-text-base;
    font-weight: $weight-bold;
    line-height: 1.35;
  }

  p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    @include body-text($text-body, $admin-text-sm);
  }
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  @include admin-badge;
  padding: 2px 9px;

  &.category {
    background: $cyan-wash;
    color: $cyan-dark;
  }

  &.status {
    @include admin-status-badge;
    padding: 2px 9px;
  }
}

.pricing {
  @include stack(2px);
  flex: 0 0 auto;
  align-items: flex-start;

  strong {
    @include price(1.25rem, $text-strong);
    font-weight: $weight-semibold;
  }

  small {
    @include row($space-2);
    @include mono-data($text-muted, $admin-text-xs);

    em {
      padding: 1px 6px;
      border-radius: $radius-pill;
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
    flex: 1 1 auto;
    min-height: 38px;
    padding: $space-2 $space-3;
    font-size: $admin-text-sm;
  }

  .primary {
    border-color: $key-900;
    background: $key-900;
    color: $text-on-dark;

    &:hover:not(:disabled) {
      border-color: $key-700;
      background: $key-700;
      color: $text-on-dark;
    }
  }

  .delete {
    flex: none;
    color: $danger-500;

    &:hover:not(:disabled) {
      border-color: $danger-500;
      background: $danger-100;
      color: $danger-500;
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
    width: 88px;
    height: 88px;
  }

  .pricing {
    width: 120px;
    align-items: flex-end;
    text-align: right;

    small {
      justify-content: flex-end;
    }
  }

  // Escritorio: botones de icono con su texto en el tooltip; "Editar" conserva el texto.
  .actions {
    width: auto;
    flex-wrap: nowrap;
    justify-content: flex-end;

    button {
      flex: none;
      min-width: 38px;
    }

    span {
      @include visually-hidden;
    }

    .primary span {
      position: static;
      width: auto;
      height: auto;
      margin: 0;
      clip-path: none;
      overflow: visible;
      white-space: normal;
    }
  }
}

@include from($bp-xl) {
  .actions {
    min-width: 330px;
  }

  .actions span {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    clip-path: none;
    overflow: visible;
    white-space: normal;
  }
}
</style>
