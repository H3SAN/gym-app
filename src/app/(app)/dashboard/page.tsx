'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import MembershipCard from '@/components/dashboard/MembershipCard'
import ActivityCard from '@/components/dashboard/ActivityCard'
import QuickActions from '@/components/dashboard/QuickActions'
import { QrCode, Bell } from 'lucide-react'
import Link from 'next/link'
import type { Class, Membership } from '@/types'

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [todayClasses, setTodayClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const [meRes, classesRes] = await Promise.all([
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/classes', { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (meRes.ok) {
          const meData = await meRes.json()
          setMembership(meData.user?.membership || null)
        }

        if (classesRes.ok) {
          const classesData = await classesRes.json()
          setTodayClasses(classesData.classes?.slice(0, 3) || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const firstName = user?.name?.split(' ')[0] || 'Champ'

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Good morning,</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Hi, {firstName}! 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Ready for today&apos;s workout?</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative">
              <Bell size={18} className="text-gray-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
            </button>
            <Link href="/checkin">
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm">
                <QrCode size={18} className="text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-5">
        {/* Membership Card */}
        {loading ? (
          <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        ) : (
          <MembershipCard membership={membership} />
        )}

        {/* Today's Activity */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Today&apos;s Classes</h2>
            <Link href="/classes" className="text-xs text-green-600 font-medium hover:underline">
              See all
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map((cls) => (
                <ActivityCard key={cls.id} gymClass={cls} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-gray-400 text-sm">No classes scheduled today</p>
              <Link href="/classes" className="text-green-600 text-sm font-medium mt-1 inline-block hover:underline">
                Browse all classes
              </Link>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>
          <QuickActions />
        </section>
      </div>
    </div>
  )
}
