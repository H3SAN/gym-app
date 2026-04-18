'use client'

import { createContext, useContext, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/types'

interface AuthStore {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  login: (token: string, user: AuthUser) => void
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (token, user) => {
        set({ token, user, isAuthenticated: true, isLoading: false })
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false })
      },

      fetchMe: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user, isAuthenticated: true, isLoading: false })
          } else {
            set({ token: null, user: null, isAuthenticated: false, isLoading: false })
          }
        } catch {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const fetchMe = useAuthStore((s) => s.fetchMe)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  useEffect(() => {
    if (isAuthenticated) {
      // Lazy import to avoid circular dep at module init
      import('@/hooks/useCart').then(({ useCart }) => {
        useCart.getState().syncFromServer()
      })
    }
  }, [isAuthenticated])

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useAuthStore()
}
