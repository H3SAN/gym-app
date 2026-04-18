'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Pencil,
  XCircle,
  Users,
  Lock,
} from 'lucide-react'
import type { Class, Booking, Difficulty } from '@/types'

type ClassWithCount = Class & { _count: { bookings: number } }
type BookingWithUser = Booking & {
  user: { id: string; name: string; email: string; avatarUrl: string | null }
}

const DIFFICULTIES: Difficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const EMPTY_FORM = {
  name: '',
  description: '',
  instructorName: '',
  startTime: '',
  endTime: '',
  capacity: 20,
  difficulty: 'BEGINNER' as Difficulty,
  isPro: false,
  location: 'Main Studio',
}

export default function AdminClassesPage() {
  const { token } = useAuthStore()
  const [classes, setClasses] = useState<ClassWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Record<string, BookingWithUser[]>>({})

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ClassWithCount | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchClasses = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    const res = await fetch(`/api/admin/classes?search=${encodeURIComponent(search)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setClasses(data.classes ?? [])
    setIsLoading(false)
  }, [token, search])

  useEffect(() => {
    const t = setTimeout(fetchClasses, 300)
    return () => clearTimeout(t)
  }, [fetchClasses])

  const fetchBookings = async (classId: string) => {
    if (bookings[classId]) return
    const res = await fetch(`/api/admin/classes/${classId}/bookings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setBookings((prev) => ({ ...prev, [classId]: data.bookings ?? [] }))
  }

  const toggleExpand = (classId: string) => {
    if (expandedId === classId) {
      setExpandedId(null)
    } else {
      setExpandedId(classId)
      fetchBookings(classId)
    }
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (c: ClassWithCount) => {
    setEditTarget(c)
    setForm({
      name: c.name,
      description: c.description,
      instructorName: c.instructorName,
      startTime: c.startTime.slice(0, 16),
      endTime: c.endTime.slice(0, 16),
      capacity: c.capacity,
      difficulty: c.difficulty,
      isPro: c.isPro,
      location: c.location,
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.instructorName || !form.startTime || !form.endTime) {
      setError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setError('')

    const url = editTarget ? `/api/admin/classes/${editTarget.id}` : '/api/classes'
    const method = editTarget ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }

    setModalOpen(false)
    fetchClasses()
    setSaving(false)
  }

  const handleCancel = async (gymClass: ClassWithCount) => {
    if (!confirm(`Cancel "${gymClass.name}"? All bookings will be cancelled.`)) return
    const res = await fetch(`/api/admin/classes/${gymClass.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) fetchClasses()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Classes</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} />
          New Class
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search classes or instructors..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No classes found</p>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                c.isCancelled ? 'border-red-100 opacity-60' : 'border-gray-100'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {c.name}
                      </span>
                      {c.isPro && (
                        <span className="flex items-center gap-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          <Lock size={9} /> PRO
                        </span>
                      )}
                      {c.isCancelled && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          CANCELLED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.instructorName} · {format(new Date(c.startTime), 'MMM d, h:mm a')}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Users size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {c.bookedCount}/{c.capacity}
                      </span>
                      <span className="text-xs text-gray-300 mx-1">·</span>
                      <span className="text-xs text-gray-400">{c.difficulty}</span>
                    </div>
                  </div>

                  {!c.isCancelled && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleCancel(c)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="flex items-center gap-1 mt-2 text-xs text-green-600 font-medium"
                >
                  {expandedId === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {expandedId === c.id ? 'Hide bookings' : `View bookings (${c._count.bookings})`}
                </button>
              </div>

              {/* Bookings panel */}
              {expandedId === c.id && (
                <div className="border-t border-gray-50 px-4 py-3 bg-gray-50 space-y-2">
                  {!bookings[c.id] ? (
                    <p className="text-xs text-gray-400">Loading…</p>
                  ) : bookings[c.id].length === 0 ? (
                    <p className="text-xs text-gray-400">No bookings yet</p>
                  ) : (
                    bookings[c.id].map((b) => (
                      <div key={b.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{b.user.name}</p>
                          <p className="text-[10px] text-gray-400">{b.user.email}</p>
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
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0">
          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                {editTarget ? 'Edit Class' : 'New Class'}
              </h2>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
              )}

              <div className="space-y-3">
                <Field label="Class Name *">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-base"
                    placeholder="e.g. Morning HIIT"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-base resize-none"
                    rows={2}
                    placeholder="Short description…"
                  />
                </Field>
                <Field label="Instructor Name *">
                  <input
                    value={form.instructorName}
                    onChange={(e) => setForm({ ...form, instructorName: e.target.value })}
                    className="input-base"
                    placeholder="Full name"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start Time *">
                    <input
                      type="datetime-local"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="input-base"
                    />
                  </Field>
                  <Field label="End Time *">
                    <input
                      type="datetime-local"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="input-base"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Capacity">
                    <input
                      type="number"
                      value={form.capacity}
                      onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                      className="input-base"
                      min={1}
                    />
                  </Field>
                  <Field label="Difficulty">
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                      className="input-base"
                    >
                      {DIFFICULTIES.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="input-base"
                  />
                </Field>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPro}
                    onChange={(e) => setForm({ ...form, isPro: e.target.checked })}
                    className="w-4 h-4 accent-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">PRO / ELITE members only</span>
                </label>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          background: white;
          outline: none;
        }
        .input-base:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 2px #bbf7d0;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
