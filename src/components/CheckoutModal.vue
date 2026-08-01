<template>
  <transition name="drawer">
    <div v-if="cartStore.isCheckoutOpen" class="cart-layer" @click.self="close">
      <aside class="cart-drawer" aria-label="Carrito de compra">
        <header class="drawer-header">
          <div>
            <span class="eyebrow">Megaprinter</span>
            <h2>Tu selección</h2>
          </div>
          <button class="icon-button" @click="close" aria-label="Cerrar carrito"><i class="fa-solid fa-xmark"></i></button>
        </header>

        <div v-if="cartStore.items.length" class="drawer-content">
          <div class="cart-list">
            <article v-for="item in cartStore.items" :key="item.id" class="cart-item">
              <div class="item-mark"><i class="fa-solid fa-cube"></i></div>
              <div class="item-copy">
                <h3>{{ item.name }}</h3>
                <span>${{ item.price.toFixed(2) }} c/u</span>
              </div>
              <div class="quantity-control">
                <button @click="cartStore.updateQuantity(item.id, item.quantity - 1)" aria-label="Reducir cantidad">−</button>
                <strong>{{ item.quantity }}</strong>
                <button @click="cartStore.updateQuantity(item.id, item.quantity + 1)" aria-label="Aumentar cantidad">+</button>
              </div>
              <button class="remove-button" @click="cartStore.removeItem(item.id)" aria-label="Eliminar producto"><i class="fa-regular fa-trash-can"></i></button>
            </article>
          </div>

          <section class="order-summary">
            <div><span>Productos</span><strong>{{ cartStore.totalItems }}</strong></div>
            <div class="total"><span>Total</span><strong>${{ cartStore.totalAmount.toFixed(2) }}</strong></div>
          </section>

          <footer class="drawer-footer">
            <button class="checkout-button" @click="openPayment">
              <span>Continuar al pago</span><i class="fa-solid fa-arrow-right"></i>
            </button>
            <span class="secure-note"><i class="fa-solid fa-lock"></i> Pago seguro con Payphone o WhatsApp</span>
          </footer>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon"><i class="fa-solid fa-bag-shopping"></i></div>
          <h3>Aún no has elegido nada</h3>
          <p>Explora nuestros equipos y servicios para comenzar.</p>
          <button @click="close">Explorar catálogo</button>
        </div>
      </aside>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const close = () => cartStore.setCheckoutOpen(false)
const openPayment = () => {
  cartStore.setCheckoutOpen(false)
  cartStore.setPaymentOpen(true)
}
</script>

<style scoped lang="scss">
.cart-layer { position: fixed; inset: 0; z-index: 2000; display: flex; justify-content: flex-end; background: rgba(1,4,10,.68); backdrop-filter: blur(12px); }
.cart-drawer { width: 100%; max-width: 500px; min-height: 100%; background: linear-gradient(150deg,#111824,#080b11 70%); border-left: 1px solid rgba(255,255,255,.1); box-shadow: -30px 0 80px rgba(0,0,0,.55); display: flex; flex-direction: column; }
.drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 28px 24px 22px; border-bottom: 1px solid rgba(255,255,255,.08); }
.eyebrow { color: #52a9ff; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; }
h2 { margin-top: 4px; color: #fff; font-size: 28px; letter-spacing: -1px; }
.icon-button { width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.12); border-radius: 50%; color: #fff; background: rgba(255,255,255,.04); cursor: pointer; transition: .25s ease; &:hover { background: rgba(255,255,255,.12); transform: rotate(90deg); } }
.drawer-content { flex: 1; padding: 22px 18px; display: flex; flex-direction: column; gap: 22px; overflow-y: auto; }
.cart-list { display: flex; flex-direction: column; gap: 10px; }
.cart-item { position: relative; display: flex; align-items: center; gap: 12px; padding: 14px; border: 1px solid rgba(255,255,255,.07); border-radius: 16px; background: rgba(255,255,255,.025); }
.item-mark { width: 38px; height: 38px; flex: 0 0 38px; display: flex; align-items: center; justify-content: center; color: #52a9ff; background: rgba(0,112,243,.13); border-radius: 11px; }
.item-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; h3 { color: #f5f7fb; font-size: 13px; line-height: 1.35; } span { color: #6daeff; font-size: 13px; font-weight: 700; } }
.quantity-control { display: flex; align-items: center; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; overflow: hidden; button { width: 27px; height: 28px; border: 0; color: #fff; background: transparent; cursor: pointer; font-size: 17px; &:hover { background: rgba(255,255,255,.1); } } strong { min-width: 22px; color: #fff; text-align: center; font-size: 12px; } }
.remove-button { position: absolute; top: 4px; right: 4px; border: 0; color: #697383; background: transparent; padding: 5px; cursor: pointer; &:hover { color: #ff6876; } }
.order-summary { display: flex; flex-direction: column; gap: 12px; padding: 18px; border: 1px solid rgba(77,160,255,.25); border-radius: 18px; background: linear-gradient(135deg,rgba(0,112,243,.18),rgba(47,225,255,.04)); div { display: flex; justify-content: space-between; color: #9ba7b8; font-size: 14px; } .total { padding-top: 12px; border-top: 1px solid rgba(255,255,255,.12); color: #fff; strong { font-size: 24px; letter-spacing: -1px; } } }
.drawer-footer { margin-top: auto; display: flex; flex-direction: column; gap: 13px; padding-top: 2px; }
.checkout-button { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 17px 20px; border: 0; border-radius: 14px; background: linear-gradient(110deg,#087cf0,#35b3ff); color: #fff; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 14px 28px rgba(0,112,243,.3); transition: .25s ease; &:hover { transform: translateY(-3px); box-shadow: 0 18px 34px rgba(0,112,243,.45); } }
.secure-note { color: #7e8b9d; text-align: center; font-size: 11px; i { color: #32d27d; margin-right: 5px; } }
.empty-state { flex: 1; padding: 40px 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; .empty-icon { width: 74px; height: 74px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.1); border-radius: 50%; color: #52a9ff; font-size: 28px; } h3 { color: #fff; } p { color: #8691a1; line-height: 1.5; } button { border: 0; border-radius: 10px; background: #087cf0; color: #fff; padding: 12px 18px; font-weight: 700; cursor: pointer; } }
.drawer-enter-active,.drawer-leave-active { transition: opacity .35s ease; .cart-drawer { transition: transform .45s cubic-bezier(.16,1,.3,1); } }
.drawer-enter-from,.drawer-leave-to { opacity: 0; .cart-drawer { transform: translateX(100%); } }
@media (min-width: 600px) { .drawer-content { padding: 28px; } .drawer-header { padding: 30px 28px 24px; } }
</style>
