'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import ClassCard, { ClassCardSkeleton } from '@/components/classes/ClassCard'
import ClassFilter from '@/components/classes/ClassFilter'
import Input from '@/components/ui/Input'
import type { Class } from '@/types'
import { Search, SlidersHorizontal } from 'lucide-react'

type FilterOption = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'

export default function ClassesPage() {
  const { token } = useAuthStore()
  const [classes, setClasses] = useState<Class[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterOption>('ALL')
  const [loading, setLoading] = useState(true)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchClasses = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter === 'PRO') params.set('isPro', 'true')
      else if (filter !== 'ALL') params.set('difficulty', filter)

      const res = await fetch(`/api/classes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setClasses(data.classes || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [token, filter]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch user bookings
  useEffect(() => {
    if (!token) return
    fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const ids: string[] = data.bookings?.map((b: { classId: string }) => b.classId) || []
        setBookedIds(new Set<string>(ids))
      })
      .catch(console.error)
  }, [token])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClasses()
  }

  const handleBook = async (classId: string) => {
    if (!token) return
    setBookingId(classId)
    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setBookedIds((prev) => { const next = new Set(Array.from(prev)); next.add(classId); return next })
        showToast('Class booked successfully!', 'success')
      } else {
        showToast(data.error || 'Booking failed', 'error')
      }
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setBookingId(null)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Classes</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search classes or instructors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <button
            type="button"
            className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors"
          >
            <SlidersHorizontal size={18} className="text-white" />
          </button>
        </form>
        <div className="mt-3">
          <ClassFilter active={filter} onChange={setFilter} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        <p className="text-sm text-gray-500 mb-3">
          {!loading && `${classes.length} class${classes.length !== 1 ? 'es' : ''} available`}
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <ClassCardSkeleton key={i} />
            ))}
          </div>
        ) : classes.length > 0 ? (
          <div className="space-y-3">
            {classes.map((cls) => (
              <ClassCard
                key={cls.id}
                gymClass={cls}
                onBook={handleBook}
                isBooked={bookedIds.has(cls.id)}
                isLoading={bookingId === cls.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-400 text-sm">No classes found</p>
            <button
              onClick={() => { setSearch(''); setFilter('ALL') }}
              className="text-green-600 text-sm font-medium mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-72 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white text-center transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
