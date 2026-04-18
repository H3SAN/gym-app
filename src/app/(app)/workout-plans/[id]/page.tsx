'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  BedDouble,
  Timer,
  Users,
  CheckCircle,
} from 'lucide-react'
import Button from '@/components/ui/Button'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  restSeconds: number
  notes: string | null
  order: number
}

interface Day {
  id: string
  dayNumber: number
  label: string | null
  isRest: boolean
  exercises: Exercise[]
}

interface Week {
  id: string
  weekNumber: number
  days: Day[]
}

interface Plan {
  id: string
  title: string
  description: string
  difficulty: string
  durationWeeks: number
  trainer: { id: string; name: string; photoUrl: string | null; bio: string; specialties: string[] }
  weeks: Week[]
  _count: { enrollments: number }
}

const DIFF_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
}

const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WorkoutPlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { token } = useAuthStore()
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/workout-plans/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setPlan(d.plan)
        setIsEnrolled(d.isEnrolled)
        if (d.plan?.weeks?.[0]) setExpandedWeek(d.plan.weeks[0].id)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token, id])

  const handleEnroll = async () => {
    if (!token) return
    setEnrolling(true)
    setEnrollError(null)
    try {
      const method = isEnrolled ? 'DELETE' : 'POST'
      const res = await fetch(`/api/workout-plans/${id}/enroll`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }
      setIsEnrolled(!isEnrolled)
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Failed to update enrollment')
    } finally {
      setEnrolling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-8 gap-4">
        <p className="text-gray-400 text-sm">Plan not found</p>
        <button onClick={() => router.back()} className="text-green-600 text-sm font-semibold">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Workout Plans
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{plan.title}</h1>
        <p className="text-sm text-gray-500 mb-3">{plan.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_COLORS[plan.difficulty]}`}>
            {plan.difficulty}
          </span>
          <span className="text-xs text-gray-400">{plan.durationWeeks} weeks</span>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users size={11} />{plan._count.enrollments} enrolled
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Trainer card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
            {plan.trainer.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={plan.trainer.photoUrl} alt={plan.trainer.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-green-700">{plan.trainer.name[0]}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{plan.trainer.name}</p>
            {plan.trainer.specialties.length > 0 && (
              <p className="text-xs text-gray-400 truncate">{plan.trainer.specialties.join(' · ')}</p>
            )}
          </div>
        </div>

        {/* Enroll CTA */}
        <Button
          variant={isEnrolled ? 'secondary' : 'primary'}
          fullWidth
          loading={enrolling}
          onClick={handleEnroll}
        >
          {isEnrolled ? (
            <span className="flex items-center gap-2">
              <CheckCircle size={16} /> Enrolled — Tap to leave
            </span>
          ) : (
            'Start this plan'
          )}
        </Button>
        {enrollError && (
          <p className="text-xs text-red-500 text-center -mt-2">{enrollError}</p>
        )}

        {/* Week-by-week breakdown */}
        <div className="space-y-2">
          {plan.weeks.map((week) => {
            const isOpen = expandedWeek === week.id
            return (
              <div key={week.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5"
                  onClick={() => setExpandedWeek(isOpen ? null : week.id)}
                >
                  <span className="text-sm font-semibold text-gray-900">Week {week.weekNumber}</span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                    {week.days.map((day) => (
                      <div key={day.id} className="pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${day.isRest ? 'bg-gray-100' : 'bg-green-100'}`}>
                            {day.isRest ? (
                              <BedDouble size={13} className="text-gray-500" />
                            ) : (
                              <Dumbbell size={13} className="text-green-600" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
                            Day {day.dayNumber} — {day.label ?? (day.isRest ? 'Rest Day' : DAY_LABELS[day.dayNumber] ?? `Day ${day.dayNumber}`)}
                          </span>
                        </div>

                        {!day.isRest && day.exercises.length > 0 && (
                          <div className="ml-9 space-y-1.5">
                            {day.exercises.map((ex) => (
                              <div key={ex.id} className="flex items-center justify-between">
                                <span className="text-xs text-gray-700">{ex.name}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                  <span>{ex.sets}×{ex.reps}</span>
                                  <Timer size={10} />
                                  <span>{ex.restSeconds}s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
