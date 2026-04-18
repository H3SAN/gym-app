'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { formatDate, formatTime, getDifficultyColor, cn } from '@/lib/utils'
import type { Class } from '@/types'
import { ArrowLeft, Clock, Users, MapPin, Calendar } from 'lucide-react'

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuthStore()
  const [gymClass, setGymClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setGymClass(data.class)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Check existing bookings
    fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const existing = data.bookings?.find(
          (b: { classId: string; id: string; status: string }) =>
            b.classId === id && b.status !== 'CANCELLED'
        )
        setIsBooked(!!existing)
        setBookingId(existing?.id ?? null)
      })
  }, [token, id])

  const handleBook = async () => {
    if (!token) return
    setBooking(true)
    try {
      const res = await fetch(`/api/classes/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setIsBooked(true)
        setBookingId(data.booking?.id ?? null)
        setGymClass((prev) => prev ? { ...prev, bookedCount: prev.bookedCount + 1 } : null)
        showToast('Class booked successfully!', 'success')
      } else {
        showToast(data.error || 'Booking failed', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setBooking(false)
    }
  }

  const handleCancel = async () => {
    if (!token || !bookingId) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setIsBooked(false)
        setBookingId(null)
        setGymClass((prev) => prev ? { ...prev, bookedCount: Math.max(0, prev.bookedCount - 1) } : null)
        showToast('Booking cancelled', 'success')
      } else {
        const data = await res.json()
        showToast(data.error || 'Cancel failed', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setCancelling(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="h-64 bg-gray-100" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!gymClass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Class not found</p>
      </div>
    )
  }

  const spotsLeft = gymClass.capacity - gymClass.bookedCount
  const isFull = spotsLeft <= 0

  return (
    <div className="min-h-full bg-white">
      {/* Header gradient */}
      <div className="relative bg-gradient-to-br from-green-600 to-emerald-700 px-4 pt-10 pb-24">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-6 hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex items-center gap-4">
          <Avatar name={gymClass.instructorName} src={gymClass.instructorPhoto} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-white">{gymClass.name}</h1>
            <p className="text-sm text-white/70 mt-0.5">with {gymClass.instructorName}</p>
            <div className="flex gap-2 mt-2">
              {gymClass.isPro && <Badge variant="green" className="bg-white/20 text-white border-0">PRO</Badge>}
              <span
                className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white'
                )}
              >
                {gymClass.difficulty.charAt(0) + gymClass.difficulty.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-green-600" />
            </div>
            <p className="text-xs font-semibold text-gray-900">{formatTime(gymClass.startTime)}</p>
            <p className="text-xs text-gray-400">Start time</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Users size={16} className="text-green-600" />
            </div>
            <p className="text-xs font-semibold text-gray-900">{isFull ? 'Full' : `${spotsLeft} left`}</p>
            <p className="text-xs text-gray-400">Spots</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin size={16} className="text-green-600" />
            </div>
            <p className="text-xs font-semibold text-gray-900 text-center leading-tight">{gymClass.location}</p>
            <p className="text-xs text-gray-400">Location</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={14} className="text-gray-400" />
          <p className="text-sm text-gray-500">
            {formatDate(gymClass.startTime)} · {formatTime(gymClass.startTime)} – {formatTime(gymClass.endTime)}
          </p>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-2">About this class</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{gymClass.description}</p>

        <div className="mt-5 bg-gray-50 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Instructor</h3>
          <div className="flex items-center gap-3">
            <Avatar name={gymClass.instructorName} src={gymClass.instructorPhoto} size="md" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{gymClass.instructorName}</p>
              <p className="text-xs text-gray-400">Certified Instructor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Book Button */}
      <div className="sticky bottom-20 px-4 pb-4 bg-white/80 backdrop-blur-sm border-t border-gray-50 pt-3">
        {isBooked ? (
          <div className="flex flex-col gap-2">
            <div className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-center">
              <p className="text-green-700 font-semibold text-sm">You&apos;re booked!</p>
            </div>
            <Button
              variant="secondary"
              fullWidth
              size="lg"
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel Booking
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={isFull}
            loading={booking}
            onClick={handleBook}
          >
            {isFull ? 'Class is Full' : 'Book This Class'}
          </Button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 w-72 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white text-center ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
