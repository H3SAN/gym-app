'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, user, isLoading } = useAuthStore()

  useEffect(() => {
    if (isLoading) return
    if (!token) {
      router.replace('/login')
      return
    }
    if (user && user.role !== 'ADMIN') {
      router.replace('/dashboard')
    }
  }, [token, user, isLoading, router])

  const loadingSpinner = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-black">A</span>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )

  // Block render until auth state is fully resolved
  if (isLoading || !user) return loadingSpinner

  // Non-admins are redirected in the effect above; return null to avoid flash
  if (user.role !== 'ADMIN') return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative pb-20">
      {/* Admin top header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">A</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
        </div>
        <button
          onClick={() => {
            useAuthStore.getState().logout()
            router.replace('/login')
          }}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          Sign out
        </button>
      </header>

      <main>{children}</main>
      <AdminNav />
    </div>
  )
}
