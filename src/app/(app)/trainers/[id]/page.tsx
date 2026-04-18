'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { ArrowLeft, Clock, Zap, Shield, Calendar } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Membership } from '@/types'
import { format, addDays, setHours, setMinutes } from 'date-fns'

interface TrainerDetail {
  id: string
  name: string
  bio: string
  photoUrl: string | null
  specialties: string[]
  _count: { sessions: number; workoutPlans: number }
}

// Generate time slots for the next 7 days, 8am–6pm hourly
function generateSlots(): { label: string; value: string }[] {
  const slots = []
  const now = new Date()

  for (let day = 1; day <= 7; day++) {
    const date = addDays(now, day)
    for (let hour = 8; hour <= 18; hour++) {
      const slot = setMinutes(setHours(date, hour), 0)
      slots.push({
        label: format(slot, 'EEE MMM d, h:mm a'),
        value: slot.toISOString(),
      })
    }
  }
  return slots
}

export default function TrainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { token } = useAuthStore()
  const router = useRouter()
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [type, setType] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [slot, setSlot] = useState('')
  const [notes, setNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const slots = generateSlots()

  useEffect(() => {
    if (!token) return
    Promise.all([
      fetch(`/api/trainers`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setTrainer(d.trainers?.find((t: TrainerDetail) => t.id === id) ?? null)),
      fetch('/api/membership', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d) => setMembership(d.membership ?? null)),
    ]).finally(() => setIsLoading(false))
  }, [token, id])

  const canBookExpress =
    membership &&
    membership.isActive &&
    new Date(membership.endDate) > new Date() &&
    ['PRO', 'ELITE'].includes(membership.tier)

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!slot) { setError('Please select a time slot'); return }
    setError('')
    setBooking(true)

    try {
      const res = await fetch('/api/trainer-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ trainerId: id, scheduledAt: slot, type, notes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Booking failed'); return }
      setSuccess(true)
    } catch {
      setError('Something went wrong')
    } finally {
      setBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!trainer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 gap-4">
        <p className="text-gray-400 text-sm">Trainer not found</p>
        <button onClick={() => router.back()} className="text-green-600 text-sm font-semibold">Go back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-10 pb-5 bg-white border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Trainers
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
            {trainer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-green-700">{trainer.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{trainer.name}</h1>
            {trainer.specialties.length > 0 && (
              <p className="text-xs text-green-600 font-medium mt-0.5">{trainer.specialties.join(' · ')}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{trainer._count.sessions} sessions completed</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4 leading-relaxed">{trainer.bio}</p>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar size={28} className="text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900">Session booked!</p>
              <p className="text-sm text-gray-500 mt-1">
                Your {type === 'EXPRESS' ? '30-min Express' : '60-min Standard'} session is confirmed.
              </p>
            </div>
            <button
              onClick={() => router.push('/trainer-sessions')}
              className="text-sm font-semibold text-green-600 hover:underline"
            >
              View my sessions
            </button>
          </div>
        ) : (
          <form onSubmit={handleBook} className="space-y-4">
            {/* Session type */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Session type</p>
              <div className="grid grid-cols-2 gap-3">
                {/* Standard */}
                <button
                  type="button"
                  onClick={() => setType('STANDARD')}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    type === 'STANDARD' ? 'border-green-500 bg-green-50' : 'border-gray-100'
                  }`}
                >
                  <Shield size={18} className={type === 'STANDARD' ? 'text-green-600' : 'text-gray-400'} />
                  <p className="text-xs font-bold text-gray-900 mt-1.5">Standard</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                    <Clock size={9} /> 60 min
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">All members</p>
                </button>

                {/* Express */}
                <button
                  type="button"
                  onClick={() => canBookExpress && setType('EXPRESS')}
                  disabled={!canBookExpress}
                  className={`p-3 rounded-xl border-2 text-left transition-all disabled:opacity-50 ${
                    type === 'EXPRESS' ? 'border-purple-500 bg-purple-50' : 'border-gray-100'
                  }`}
                >
                  <Zap size={18} className={type === 'EXPRESS' ? 'text-purple-600' : 'text-gray-400'} />
                  <p className="text-xs font-bold text-gray-900 mt-1.5">Express</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                    <Clock size={9} /> 30 min
                  </p>
                  <p className={`text-[10px] mt-0.5 ${canBookExpress ? 'text-purple-500 font-medium' : 'text-gray-400'}`}>
                    {canBookExpress ? 'PRO/ELITE' : 'PRO/ELITE only'}
                  </p>
                </button>
              </div>
            </div>

            {/* Time slot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Select a time</p>
              <select
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a slot…</option>
                {slots.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">Notes (optional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Goals, injuries, focus areas…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

            <Button type="submit" variant="primary" fullWidth size="lg" loading={booking}>
              Book {type === 'EXPRESS' ? '30-min Express' : '60-min Standard'} Session
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
