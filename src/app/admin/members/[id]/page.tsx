'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { format } from 'date-fns'
import { ArrowLeft, ShoppingBag, Dumbbell, Zap } from 'lucide-react'
import type { Membership, Booking, Order } from '@/types'

interface CheckIn {
  id: string
  checkedInAt: string
  qrToken: string
}

interface MemberDetail {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
  createdAt: string
  memberships: Membership[]
  checkIns: CheckIn[]
  bookings: (Booking & { class: { name: string; startTime: string } | null })[]
  orders: Order[]
  _count: { checkIns: number; bookings: number; orders: number }
}

const TIER_COLORS: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-700',
  PRO: 'bg-green-100 text-green-700',
  ELITE: 'bg-purple-100 text-purple-700',
}

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const { token } = useAuthStore()
  const router = useRouter()
  const [member, setMember] = useState<MemberDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'checkins' | 'bookings' | 'orders'>('overview')

  useEffect(() => {
    if (!token) return
    fetch(`/api/admin/members/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setMember(data.member ?? null))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token, params.id])

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-gray-400 text-sm">Member not found</p>
        <button onClick={() => router.back()} className="mt-3 text-green-600 text-sm font-medium">
          Go back
        </button>
      </div>
    )
  }

  const activeMembership = member.memberships.find((m) => m.isActive)
  const isExpired = activeMembership && new Date(activeMembership.endDate) < new Date()

  return (
    <div className="pb-4">
      {/* Back button (inside layout header) */}
      <div className="px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-4"
        >
          <ArrowLeft size={16} />
          Members
        </button>
      </div>

      {/* Profile card */}
      <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shrink-0">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-black text-green-700">
                {member.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">{member.name}</h1>
            <p className="text-xs text-gray-500">{member.email}</p>
            {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
          </div>
        </div>

        {/* Membership badge */}
        <div className="mt-3 pt-3 border-t border-gray-50">
          {activeMembership ? (
            <div className="flex items-center justify-between">
              <div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    isExpired ? 'bg-red-100 text-red-600' : TIER_COLORS[activeMembership.tier]
                  }`}
                >
                  {isExpired ? 'EXPIRED' : activeMembership.tier}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">
                  {isExpired ? 'Expired' : 'Expires'}{' '}
                  {format(new Date(activeMembership.endDate), 'MMM d, yyyy')}
                </p>
                <p className="text-[10px] text-gray-400">
                  Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">No active membership</p>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="mx-4 grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: <Zap size={14} />, label: 'Check-ins', value: member._count.checkIns },
          { icon: <Dumbbell size={14} />, label: 'Bookings', value: member._count.bookings },
          { icon: <ShoppingBag size={14} />, label: 'Orders', value: member._count.orders },
        ].map(({ icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm"
          >
            <div className="flex items-center justify-center text-green-600 mb-1">{icon}</div>
            <p className="text-lg font-black text-gray-900">{value}</p>
            <p className="text-[10px] text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="mx-4 flex bg-gray-100 rounded-xl p-1 mb-4">
        {(['overview', 'checkins', 'bookings', 'orders'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mx-4 space-y-2">
        {tab === 'overview' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Membership History</h3>
            {member.memberships.length === 0 ? (
              <p className="text-xs text-gray-400">No membership records</p>
            ) : (
              member.memberships.map((m) => {
                const exp = new Date(m.endDate) < new Date()
                return (
                  <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          exp ? 'bg-gray-100 text-gray-500' : TIER_COLORS[m.tier]
                        }`}
                      >
                        {m.tier}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(new Date(m.startDate), 'MMM d, yyyy')} →{' '}
                        {format(new Date(m.endDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        exp ? 'text-gray-400' : 'text-green-600'
                      }`}
                    >
                      {exp ? 'Expired' : 'Active'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        )}

        {tab === 'checkins' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recent Check-ins ({member._count.checkIns} total)
            </h3>
            {member.checkIns.length === 0 ? (
              <p className="text-xs text-gray-400">No check-ins yet</p>
            ) : (
              <div className="space-y-2">
                {member.checkIns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <p className="text-xs font-medium text-gray-800">
                      {format(new Date(c.checkedInAt), 'EEE, MMM d, yyyy')}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(c.checkedInAt), 'h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'bookings' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recent Bookings ({member._count.bookings} total)
            </h3>
            {member.bookings.length === 0 ? (
              <p className="text-xs text-gray-400">No bookings yet</p>
            ) : (
              <div className="space-y-2">
                {member.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        {b.class?.name ?? 'Unknown class'}
                      </p>
                      {b.class && (
                        <p className="text-[10px] text-gray-400">
                          {format(new Date(b.class.startTime), 'MMM d, yyyy h:mm a')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-700'
                          : b.status === 'ATTENDED'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Recent Orders ({member._count.orders} total)
            </h3>
            {member.orders.length === 0 ? (
              <p className="text-xs text-gray-400">No orders yet</p>
            ) : (
              <div className="space-y-2">
                {member.orders.map((o) => (
                  <div key={o.id} className="py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-800">
                        ${o.total.toFixed(2)}
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'PAID' || o.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-700'
                            : o.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {format(new Date(o.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
