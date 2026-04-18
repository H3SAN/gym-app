'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { Clock, Zap, Shield, X, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface Session {
  id: string
  scheduledAt: string
  duration: number
  type: 'STANDARD' | 'EXPRESS'
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes: string | null
  trainer: { id: string; name: string; photoUrl: string | null }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export default function TrainerSessionsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    if (!token) return
    const res = await fetch('/api/trainer-sessions', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setSessions(data.sessions ?? [])
    setIsLoading(false)
  }, [token])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this session?')) return
    setCancelling(id)
    try {
      const res = await fetch(`/api/trainer-sessions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error); return }
      fetchSessions()
    } finally {
      setCancelling(null)
    }
  }

  const upcoming = sessions.filter((s) => ['PENDING', 'CONFIRMED'].includes(s.status))
  const past = sessions.filter((s) => ['COMPLETED', 'CANCELLED'].includes(s.status))

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="px-4 pt-10 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-sm text-gray-500 mt-1">Your personal training history</p>
      </div>

      <div className="flex-1 p-4 space-y-5">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <Calendar size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">No sessions yet</p>
            <button
              onClick={() => router.push('/trainers')}
              className="text-sm font-semibold text-green-600 hover:underline"
            >
              Browse trainers
            </button>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Upcoming
                </p>
                <div className="space-y-2">
                  {upcoming.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onCancel={() => handleCancel(s.id)}
                      cancelling={cancelling === s.id}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Past
                </p>
                <div className="space-y-2">
                  {past.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SessionCard({
  session,
  onCancel,
  cancelling,
}: {
  session: Session
  onCancel?: () => void
  cancelling?: boolean
}) {
  const isActive = ['PENDING', 'CONFIRMED'].includes(session.status)
  const TypeIcon = session.type === 'EXPRESS' ? Zap : Shield

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
        {session.trainer.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.trainer.photoUrl} alt={session.trainer.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-green-700">{session.trainer.name[0]}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900">{session.trainer.name}</p>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[session.status]}`}>
            {session.status}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {format(new Date(session.scheduledAt), 'EEE, MMM d · h:mm a')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <TypeIcon size={11} className={session.type === 'EXPRESS' ? 'text-purple-500' : 'text-green-500'} />
          <span className="text-[10px] text-gray-400">
            {session.type} · {session.duration} min
          </span>
          {session.notes && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{session.notes}</span>
            </>
          )}
        </div>
      </div>

      {isActive && onCancel && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
        >
          <X size={15} className="text-red-400" />
        </button>
      )}
    </div>
  )
}
