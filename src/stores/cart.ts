import { defineStore } from 'pinia'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

const STORAGE_KEY = 'megaprinter-cart'

const readStoredItems = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // El carrito viene de almacenamiento del cliente: validamos forma y numeros
    // antes de confiar en el, o un valor manipulado rompe los totales.
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === 'object' &&
        typeof (item as CartItem).id === 'string' &&
        typeof (item as CartItem).name === 'string' &&
        Number.isFinite((item as CartItem).price) &&
        Number.isFinite((item as CartItem).quantity) &&
        (item as CartItem).quantity > 0,
    )
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: readStoredItems(),
    isCheckoutOpen: false,
    isPaymentOpen: false,
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: (state) =>
      // Se redondea a centavos: sumar flotantes deja totales como 1289.9999999998
      // que luego no cuadran con el monto enviado a Payphone.
      Math.round(state.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100,
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch {
        // Modo privado o cuota llena: el carrito sigue funcionando en memoria.
      }
    },

    addItem(item: Omit<CartItem, 'quantity'>) {
      const existing = this.items.find((entry) => entry.id === item.id)
      if (existing) existing.quantity += 1
      else this.items.push({ ...item, quantity: 1 })
      this.persist()
      this.isCheckoutOpen = true
    },

    removeItem(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
      this.persist()
    },

    updateQuantity(id: string, quantity: number) {
      const item = this.items.find((entry) => entry.id === id)
      if (!item) return
      if (quantity <= 0) {
        this.removeItem(id)
        return
      }
      item.quantity = Math.min(quantity, 99)
      this.persist()
    },

    clearCart() {
      this.items = []
      this.persist()
    },

    setCheckoutOpen(open: boolean) {
      this.isCheckoutOpen = open
    },

    setPaymentOpen(open: boolean) {
      this.isPaymentOpen = open
    },
  },
})
