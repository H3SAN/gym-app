'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { ScanFace, CheckCircle, XCircle, Clock, RefreshCw, UserCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface CheckInRequest {
  id: string
  checkedInAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewedAt: string | null
  reviewedBy: string | null
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

export default function AdminCheckInsPage() {
  const { token } = useAuthStore()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [checkins, setCheckins] = useState<CheckInRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const fetchCheckins = useCallback(
    async (silent = false) => {
      if (!token) return
      if (!silent) setLoading(true)
      else setRefreshing(true)
      try {
        const res = await fetch(`/api/admin/checkins?status=${tab}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setCheckins(data.checkins)
        }
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [token, tab]
  )

  useEffect(() => {
    fetchCheckins()
  }, [fetchCheckins])

  // Auto-refresh pending tab every 10s
  useEffect(() => {
    if (tab !== 'PENDING') return
    const id = setInterval(() => fetchCheckins(true), 10_000)
    return () => clearInterval(id)
  }, [tab, fetchCheckins])

  async function act(id: string, action: 'approve' | 'reject') {
    if (!token) return
    setActing(id)
    try {
      const res = await fetch(`/api/admin/checkins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        setCheckins((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setActing(null)
    }
  }

  const tabs: Tab[] = ['PENDING', 'APPROVED', 'REJECTED']
  const tabColors: Record<Tab, string> = {
    PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    APPROVED: 'text-green-600 bg-green-50 border-green-200',
    REJECTED: 'text-red-500 bg-red-50 border-red-200',
  }
  const tabIcons: Record<Tab, React.ReactNode> = {
    PENDING: <Clock size={14} />,
    APPROVED: <CheckCircle size={14} />,
    REJECTED: <XCircle size={14} />,
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
            <ScanFace size={18} className="text-green-600" />
          </div>
          <h1 className="text-base font-bold text-gray-900">Face Check-ins</h1>
        </div>
        <button
          onClick={() => fetchCheckins(true)}
          disabled={refreshing}
          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw size={15} className={`text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              tab === t ? tabColors[t] : 'text-gray-400 bg-white border-gray-100'
            }`}
          >
            {tabIcons[t]}
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : checkins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <ScanFace size={40} strokeWidth={1.2} />
          <p className="text-sm font-medium">No {tab.toLowerCase()} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkins.map((c) => (
            <CheckInCard
              key={c.id}
              checkin={c}
              acting={acting === c.id}
              onApprove={() => act(c.id, 'approve')}
              onReject={() => act(c.id, 'reject')}
              showActions={tab === 'PENDING'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CheckInCard({
  checkin,
  acting,
  onApprove,
  onReject,
  showActions,
}: {
  checkin: CheckInRequest
  acting: boolean
  onApprove: () => void
  onReject: () => void
  showActions: boolean
}) {
  const ago = formatDistanceToNow(new Date(checkin.checkedInAt), { addSuffix: true })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      {/* Avatar */}
      <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {checkin.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={checkin.user.avatarUrl} alt={checkin.user.name} className="w-full h-full object-cover" />
        ) : (
          <UserCircle size={26} className="text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{checkin.user.name}</p>
        <p className="text-xs text-gray-400 truncate">{checkin.user.email}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{ago}</p>
      </div>

      {/* Actions or status badge */}
      {showActions ? (
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={onApprove}
            disabled={acting}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            disabled={acting}
            className="px-3 py-1.5 bg-red-50 text-red-500 text-xs font-semibold rounded-xl border border-red-100 hover:bg-red-100 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-xl flex-shrink-0 ${
            checkin.status === 'APPROVED'
              ? 'bg-green-50 text-green-600'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {checkin.status.charAt(0) + checkin.status.slice(1).toLowerCase()}
        </span>
      )}
    </div>
  )
}
