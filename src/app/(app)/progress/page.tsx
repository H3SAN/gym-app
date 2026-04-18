'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import ProgressChart from '@/components/progress/ProgressChart'
import GoalCard from '@/components/progress/GoalCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Settings, ChevronRight, Dumbbell, Flame, Calendar, X, Pencil, Trash2, Plus } from 'lucide-react'
import type { Goal } from '@/types'
import Link from 'next/link'

type Period = 'week' | 'month' | 'year'

interface ProgressData {
  chartData: { label: string; value: number }[]
  goals: Goal[]
  stats: { totalWorkouts: number; thisMonthWorkouts: number }
}

interface GoalForm {
  title: string
  targetValue: string
  currentValue: string
  unit: string
  targetDate: string
}

const EMPTY_FORM: GoalForm = {
  title: '',
  targetValue: '',
  currentValue: '0',
  unit: '',
  targetDate: '',
}

export default function ProgressPage() {
  const { token } = useAuthStore()
  const [period, setPeriod] = useState<Period>('week')
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  // Goal modal state
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  const fetchProgress = () => {
    if (!token) return
    setLoading(true)
    fetch(`/api/progress?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchProgress()
  }, [token, period]) // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  const openCreate = () => {
    setEditingGoal(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setForm({
      title: goal.title,
      targetValue: String(goal.targetValue),
      currentValue: String(goal.currentValue),
      unit: goal.unit,
      targetDate: goal.targetDate.slice(0, 10),
    })
    setShowModal(true)
    setTimeout(() => firstInputRef.current?.focus(), 50)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingGoal(null)
    setForm(EMPTY_FORM)
  }

  const handleSave = async () => {
    if (!token) return
    if (!form.title || !form.targetValue || !form.unit || !form.targetDate) {
      showToast('Please fill in all fields')
      return
    }
    setSaving(true)
    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals'
      const method = editingGoal ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        closeModal()
        fetchProgress()
        showToast(editingGoal ? 'Goal updated!' : 'Goal created!')
      } else {
        const d = await res.json()
        showToast(d.error || 'Failed to save goal')
      }
    } catch {
      showToast('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!token) return
    setDeletingId(goalId)
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setData((prev) =>
          prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== goalId) } : prev
        )
        showToast('Goal deleted')
      }
    } catch {
      showToast('Failed to delete goal')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Settings size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Period Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mt-4">
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                period === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Dumbbell,
              label: 'Total',
              value: data?.stats.totalWorkouts ?? '–',
              sub: 'workouts',
              bg: 'bg-green-100',
              color: 'text-green-600',
            },
            {
              icon: Flame,
              label: 'This month',
              value: data?.stats.thisMonthWorkouts ?? '–',
              sub: 'sessions',
              bg: 'bg-orange-100',
              color: 'text-orange-600',
            },
            {
              icon: Calendar,
              label: 'Goals',
              value: data?.goals.length ?? '–',
              sub: 'active',
              bg: 'bg-blue-100',
              color: 'text-blue-600',
            },
          ].map(({ icon: Icon, label, value, sub, bg, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-3 flex flex-col items-center">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Workout Frequency</h2>
            <span className="text-xs text-gray-400 capitalize">{period}ly view</span>
          </div>
          {loading ? (
            <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <ProgressChart data={data?.chartData || []} label="Workouts" />
          )}
        </div>

        {/* Goals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Goals</h2>
            <button
              onClick={openCreate}
              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:underline"
            >
              <Plus size={13} />
              Add goal
            </button>
          </div>
          {data && data.goals.length > 0 ? (
            <div className="space-y-3">
              {data.goals.map((goal) => (
                <div key={goal.id} className="relative group">
                  <GoalCard goal={goal} />
                  {/* Edit / Delete overlay buttons */}
                  <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(goal)}
                      className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-green-50 transition-colors"
                    >
                      <Pencil size={12} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="w-7 h-7 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <button
              onClick={openCreate}
              className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-8 flex flex-col items-center gap-2 hover:border-green-300 hover:bg-green-50/50 transition-all"
            >
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Plus size={20} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Set your first goal</p>
            </button>
          ) : null}
        </section>

        {/* View Plans */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Link href="/classes">
            <div className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Dumbbell size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">View My Plans</p>
                  <p className="text-xs text-gray-400">Recommended workouts</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </Link>
        </div>

        {/* Recommended Workouts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recommended Workouts</h2>
          <div className="space-y-3">
            {[
              { name: 'Full Body Strength', duration: '45 min', difficulty: 'Intermediate', cal: '380' },
              { name: 'HIIT Cardio Blast', duration: '30 min', difficulty: 'Advanced', cal: '450' },
              { name: 'Yoga & Flexibility', duration: '60 min', difficulty: 'Beginner', cal: '200' },
            ].map((workout) => (
              <div key={workout.name} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={22} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{workout.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {workout.duration} · {workout.difficulty} · {workout.cal} cal
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={closeModal}
          />

          {/* Sheet */}
          <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl px-5 pt-5 pb-10 z-10 animate-in slide-in-from-bottom duration-200">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button
                onClick={closeModal}
                className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Goal title</label>
                <Input
                  ref={firstInputRef}
                  placeholder="e.g. Lose 5kg, Bench 100kg"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Target</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={form.targetValue}
                    onChange={(e) => setForm((f) => ({ ...f, targetValue: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit</label>
                  <Input
                    placeholder="kg, km, reps..."
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Current progress
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.currentValue}
                  onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Target date</label>
                <Input
                  type="date"
                  value={form.targetDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="outline" fullWidth onClick={closeModal}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth loading={saving} onClick={handleSave}>
                {editingGoal ? 'Save Changes' : 'Create Goal'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
