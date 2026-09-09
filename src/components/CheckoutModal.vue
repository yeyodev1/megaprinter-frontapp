<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useScrollLock } from '@/composables/useScrollLock'

const cartStore = useCartStore()
const router = useRouter()

const isOpen = computed(() => cartStore.isCheckoutOpen)
useScrollLock(isOpen)

const close = () => cartStore.setCheckoutOpen(false)

const openPayment = () => {
  cartStore.setCheckoutOpen(false)
  cartStore.setPaymentOpen(true)
}

const goToCatalog = () => {
  close()
  router.push('/products')
}
</script>

<template>
  <transition name="drawer">
    <div v-if="cartStore.isCheckoutOpen" class="cart-layer" @click.self="close" @keydown.esc="close">
      <aside class="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrito de compra">
        <header class="drawer-header">
          <div>
            <p class="eyebrow">Megaprinter</p>
            <h2>Tu selección</h2>
          </div>
          <button class="icon-button" type="button" aria-label="Cerrar carrito" @click="close">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </header>

        <div v-if="!cartStore.isEmpty" class="drawer-content">
          <div class="cart-list">
            <article v-for="item in cartStore.items" :key="item.id" class="cart-item">
              <div class="item-mark" aria-hidden="true">
                <img v-if="item.image" :src="item.image" alt="" loading="lazy" />
                <i v-else class="fa-solid fa-cube"></i>
              </div>

              <div class="item-copy">
                <h3>{{ item.name }}</h3>
                <span>${{ item.price.toFixed(2) }} c/u</span>
              </div>

              <div class="quantity">
                <button
                  type="button"
                  aria-label="Reducir cantidad"
                  @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                >
                  −
                </button>
                <strong>{{ item.quantity }}</strong>
                <button
                  type="button"
                  aria-label="Aumentar cantidad"
                  @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                >
                  +
                </button>
              </div>

              <button
                class="remove"
                type="button"
                aria-label="Eliminar producto"
                @click="cartStore.removeItem(item.id)"
              >
                <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
              </button>
            </article>
          </div>

          <section class="summary">
            <div><span>Productos</span><strong>{{ cartStore.totalItems }}</strong></div>
            <div class="total"><span>Total</span><strong>${{ cartStore.totalAmount.toFixed(2) }}</strong></div>
          </section>

          <footer class="drawer-footer">
            <button class="checkout" type="button" @click="openPayment">
              <span>Continuar al pago</span>
              <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
            </button>
            <p class="secure-note">
              <i class="fa-solid fa-lock" aria-hidden="true"></i>
              Pago seguro con Payphone o cierre por WhatsApp
            </p>
          </footer>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i></div>
          <h3>Aún no has elegido nada</h3>
          <p>Explora nuestros equipos y servicios para comenzar.</p>
          <button type="button" @click="goToCatalog">Explorar catálogo</button>
        </div>
      </aside>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.cart-layer {
  position: fixed;
  inset: 0;
  z-index: $z-drawer;
  display: flex;
  justify-content: flex-end;
  background: rgba($ink-900, 0.65);
  backdrop-filter: blur(10px);
}

.cart-drawer {
  display: flex;
  width: 100%;
  max-width: 480px;
  min-height: 100%;
  flex-direction: column;
  border-left: 1px solid $border-on-dark;
  background: $ink-800;
  box-shadow: $shadow-lg;
  color: $text-on-dark;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $space-6 $space-6 $space-5;
  border-bottom: 1px solid $border-on-dark;

  h2 {
    margin-top: $space-1;
    font-size: 1.625rem;
  }
}

.eyebrow {
  @include eyebrow($brand-300);
}

.icon-button {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-on-dark;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.05);
  color: $text-on-dark;
  cursor: pointer;
  transition: background $duration-base $ease-out, transform $duration-base $ease-out;
  @include focus-ring($brand-300);

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    transform: rotate(90deg);
  }
}

.drawer-content {
  @include stack($space-6);
  @include scroll-area;
  flex: 1;
  padding: $space-5 $space-6 $space-6;
}

.cart-list {
  @include stack($space-3);
}

.cart-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  border: 1px solid $border-on-dark;
  border-radius: $radius-md;
  background: rgba(255, 255, 255, 0.03);
}

.item-mark {
  display: flex;
  width: 52px;
  height: 52px;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: $radius-sm;
  background: $paper-white;
  color: $brand-500;

  img {
    width: 100%;
    height: 100%;
    padding: 3px;
    object-fit: contain;
  }
}

.item-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  padding-right: $space-5;

  h3 {
    font-size: $text-body-sm;
    font-weight: $weight-semibold;
    line-height: 1.35;
  }

  span {
    color: $brand-300;
    font-size: $text-caption;
    font-weight: $weight-bold;
  }
}

.quantity {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid $border-on-dark;
  border-radius: $radius-xs;

  button {
    width: 28px;
    height: 30px;
    border: 0;
    background: transparent;
    color: $text-on-dark;
    cursor: pointer;
    font-size: 1rem;
    @include focus-ring($brand-300);

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  }

  strong {
    min-width: 24px;
    font-size: $text-caption;
    text-align: center;
  }
}

.remove {
  position: absolute;
  top: $space-1;
  right: $space-1;
  padding: $space-1;
  border: 0;
  background: transparent;
  color: $ink-400;
  cursor: pointer;
  @include focus-ring($brand-300);

  &:hover {
    color: $danger-500;
  }
}

.summary {
  @include stack($space-3);
  padding: $space-5;
  border: 1px solid rgba(32, 148, 210, 0.28);
  border-radius: $radius-md;
  background: rgba(32, 148, 210, 0.1);

  div {
    display: flex;
    justify-content: space-between;
    color: $text-on-dark-muted;
    font-size: $text-body-sm;
  }

  .total {
    padding-top: $space-3;
    border-top: 1px solid $border-on-dark;
    color: $text-on-dark;

    strong {
      font-size: 1.5rem;
      letter-spacing: $tracking-display;
    }
  }
}

.drawer-footer {
  @include stack($space-3);
  margin-top: auto;
}

.checkout {
  @include button-primary;
  width: 100%;
  justify-content: space-between;
  padding: $space-4 $space-5;
  border-radius: $radius-md;
  font-size: $text-body-md;
}

.secure-note {
  color: $ink-400;
  font-size: $text-eyebrow;
  text-align: center;

  i {
    margin-right: $space-1;
    color: $accent-500;
  }
}

.empty-state {
  @include empty-state;
  flex: 1;
  justify-content: center;
  color: $text-on-dark-muted;

  h3 {
    color: $text-on-dark;
  }

  .empty-icon {
    display: flex;
    width: 72px;
    height: 72px;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-on-dark;
    border-radius: $radius-pill;
    color: $brand-300;
    font-size: 1.625rem;
  }

  > button {
    @include button-primary;
    margin-top: $space-2;
  }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity $duration-base $ease-out;

  .cart-drawer {
    transition: transform $duration-slow $ease-out;
  }
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;

  .cart-drawer {
    transform: translateX(100%);
  }
}
</style>
