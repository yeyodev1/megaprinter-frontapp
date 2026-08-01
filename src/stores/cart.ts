import { defineStore } from 'pinia'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isCheckoutOpen: false,
    isPaymentOpen: false,
  }),
  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },
  actions: {
    addItem(item: Omit<CartItem, 'quantity'>) {
      const existing = this.items.find((i) => i.id === item.id)
      if (existing) {
        existing.quantity++
      } else {
        this.items.push({ ...item, quantity: 1 })
      }
      this.isCheckoutOpen = true
    },
    removeItem(id: string) {
      this.items = this.items.filter((i) => i.id !== id)
    },
    updateQuantity(id: string, quantity: number) {
      const item = this.items.find((i) => i.id === id)
      if (item) {
        if (quantity <= 0) {
          this.removeItem(id)
        } else {
          item.quantity = quantity
        }
      }
    },
    clearCart() {
      this.items = []
    },
    setCheckoutOpen(open: boolean) {
      this.isCheckoutOpen = open
    },
    setPaymentOpen(open: boolean) {
      this.isPaymentOpen = open
    },
  },
})
