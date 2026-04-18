'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { Plus, Eye, EyeOff, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface Trainer { id: string; name: string }

interface PlanRow {
  id: string
  title: string
  difficulty: string
  durationWeeks: number
  isPublished: boolean
  trainer: Trainer
  _count: { enrollments: number; weeks: number }
}

const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']

const defaultForm = {
  trainerId: '',
  title: '',
  description: '',
  difficulty: 'BEGINNER',
  durationWeeks: 4,
}

export default function AdminWorkoutPlansPage() {
  const { token } = useAuthStore()
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const headers = { Authorization: `Bearer ${token}` }

  const fetchData = useCallback(async () => {
    if (!token) return
    const [plansRes, trainersRes] = await Promise.all([
      fetch('/api/admin/workout-plans', { headers }),
      fetch('/api/admin/trainers', { headers }),
    ])
    const [pd, td] = await Promise.all([plansRes.json(), trainersRes.json()])
    setPlans(pd.plans ?? [])
    setTrainers(td.trainers ?? [])
    setIsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const togglePublish = async (plan: PlanRow) => {
    await fetch(`/api/admin/workout-plans/${plan.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !plan.isPublished }),
    })
    fetchData()
  }

  const deletePlan = async (id: string) => {
    if (!confirm('Delete this plan? This cannot be undone.')) return
    await fetch(`/api/admin/workout-plans/${id}`, { method: 'DELETE', headers })
    fetchData()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/workout-plans', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      setShowForm(false)
      setForm(defaultForm)
      fetchData()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Workout Plans</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={15} className="mr-1" /> New Plan
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New Workout Plan</h2>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Trainer</label>
            <select
              value={form.trainerId}
              onChange={(e) => setForm({ ...form, trainerId: e.target.value })}
              required
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select trainer…</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g. 12-Week Strength Builder"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              placeholder="What will members gain from this plan?"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Duration (weeks)</label>
              <input
                type="number"
                min={1}
                max={52}
                value={form.durationWeeks}
                onChange={(e) => setForm({ ...form, durationWeeks: Number(e.target.value) })}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Plan created as draft. Add weeks &amp; exercises via the API, then publish to make it visible to members.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(defaultForm) }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>
            <Button type="submit" variant="primary" loading={saving} className="flex-1">
              Create Draft
            </Button>
          </div>
        </form>
      )}

      {/* Plans list */}
      {isLoading ? (
        [...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))
      ) : plans.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-10">No plans yet</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{plan.title}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${plan.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.isPublished ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {plan.trainer.name} · {plan.difficulty} · {plan.durationWeeks}w · {plan._count.enrollments} enrolled
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(plan)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title={plan.isPublished ? 'Unpublish' : 'Publish'}
                >
                  {plan.isPublished ? (
                    <EyeOff size={15} className="text-gray-400" />
                  ) : (
                    <Eye size={15} className="text-green-600" />
                  )}
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
