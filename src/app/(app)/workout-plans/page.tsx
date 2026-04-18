'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { Dumbbell, ChevronRight, CheckCircle } from 'lucide-react'

interface PlanSummary {
  id: string
  title: string
  description: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  durationWeeks: number
  isEnrolled: boolean
  trainer: { id: string; name: string; photoUrl: string | null; specialties: string[] }
  _count: { enrollments: number; weeks: number }
}

const DIFFICULTIES = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
}

export default function WorkoutPlansPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [plans, setPlans] = useState<PlanSummary[]>([])
  const [filter, setFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setIsLoading(true)
    const params = filter !== 'ALL' ? `?difficulty=${filter}` : ''
    fetch(`/api/workout-plans${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token, filter])

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="px-4 pt-10 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Workout Plans</h1>
        <p className="text-sm text-gray-500 mt-1">Trainer-designed programs for every level</p>
      </div>

      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setFilter(d)}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                filter === d
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <Dumbbell size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">No plans available yet</p>
          </div>
        ) : (
          plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => router.push(`/workout-plans/${plan.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-bold text-gray-900 leading-tight flex-1">{plan.title}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {plan.isEnrolled && (
                    <CheckCircle size={14} className="text-green-600" />
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{plan.description}</p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLORS[plan.difficulty]}`}>
                  {plan.difficulty}
                </span>
                <span className="text-[10px] text-gray-400">{plan.durationWeeks} weeks</span>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[10px] text-gray-400">{plan._count.enrollments} enrolled</span>
                <span className="text-gray-200 text-[10px]">·</span>
                <span className="text-[10px] text-gray-500 font-medium">by {plan.trainer.name}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
