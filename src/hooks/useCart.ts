import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '@/types'
import { useAuthStore } from '@/components/auth/AuthProvider'

interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  syncFromServer: () => Promise<void>
  total: number
  itemCount: number
}

function getAuthToken(): string | null {
  return useAuthStore.getState().token
}

function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : {}
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const { items } = get()
        const existing = items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          })
        } else {
          set({ items: [...items, { product, quantity }] })
        }

        // Background sync — never block the UI
        fetch('/api/cart', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ productId: product.id, quantity }),
        }).catch(() => {})
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) })

        fetch(`/api/cart?productId=${productId}`, {
          method: 'DELETE',
          headers: authHeaders(),
        }).catch(() => {})
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        })

        fetch('/api/cart', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ productId, quantity }),
        }).catch(() => {})
      },

      clearCart: () => set({ items: [] }),

      syncFromServer: async () => {
        const token = getAuthToken()
        if (!token) return

        try {
          const res = await fetch('/api/cart', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!res.ok) return

          const { cartItems } = await res.json()
          if (!Array.isArray(cartItems)) return

          const items: CartItem[] = cartItems.map(
            (ci: { product: Product; quantity: number }) => ({
              product: ci.product,
              quantity: ci.quantity,
            })
          )
          set({ items })
        } catch {
          // Keep localStorage state if server is unreachable
        }
      },

      get total() {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        )
      },

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)
