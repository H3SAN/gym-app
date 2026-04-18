'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/login')
    }
  }, [token, isLoading, router])

  if (isLoading) {
    return (
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
  }

  if (!token) return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white relative pb-20">
      {children}
      <BottomNav />
    </div>
  )
}
