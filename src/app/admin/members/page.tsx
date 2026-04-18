'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { Search, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import type { Membership } from '@/types'

interface MemberRow {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  createdAt: string
  memberships: Membership[]
  _count: { checkIns: number; bookings: number; orders: number }
}

const TIERS = ['ALL', 'BASIC', 'PRO', 'ELITE']

const TIER_COLORS: Record<string, string> = {
  BASIC: 'bg-gray-100 text-gray-600',
  PRO: 'bg-green-100 text-green-700',
  ELITE: 'bg-purple-100 text-purple-700',
}

export default function AdminMembersPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchMembers = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    const params = new URLSearchParams({ search, tier, page: String(page) })
    const res = await fetch(`/api/admin/members?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setMembers(data.members ?? [])
    setTotal(data.total ?? 0)
    setPages(data.pages ?? 1)
    setIsLoading(false)
  }, [token, search, tier, page])

  useEffect(() => {
    setPage(1)
  }, [search, tier])

  useEffect(() => {
    const t = setTimeout(fetchMembers, 300)
    return () => clearTimeout(t)
  }, [fetchMembers])

  const activeTier = (m: MemberRow) => m.memberships[0]?.tier ?? 'BASIC'
  const isExpired = (m: MemberRow) =>
    !m.memberships[0] || new Date(m.memberships[0].endDate) < new Date()

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Members</h1>
        <span className="text-xs text-gray-500 font-medium">{total} total</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Tier filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              tier === t
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No members found</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const tier = activeTier(m)
            const expired = isExpired(m)
            return (
              <button
                key={m.id}
                onClick={() => router.push(`/admin/members/${m.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {m.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-green-700">
                      {m.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">{m.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        expired ? 'bg-red-100 text-red-600' : TIER_COLORS[tier]
                      }`}
                    >
                      {expired ? 'EXPIRED' : tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">
                      {m._count.checkIns} check-ins
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400">
                      {m._count.bookings} bookings
                    </span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] text-gray-400">
                      Joined {format(new Date(m.createdAt), 'MMM yyyy')}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-semibold text-green-600 disabled:text-gray-300"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            {page} / {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="text-xs font-semibold text-green-600 disabled:text-gray-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
