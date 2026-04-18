'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { ChevronRight, UserCheck } from 'lucide-react'

interface TrainerRow {
  id: string
  name: string
  bio: string
  photoUrl: string | null
  specialties: string[]
  _count: { sessions: number; workoutPlans: number }
}

export default function TrainersPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [trainers, setTrainers] = useState<TrainerRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/trainers', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setTrainers(d.trainers ?? []))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [token])

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <div className="px-4 pt-10 pb-4 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <p className="text-sm text-gray-500 mt-1">Book a personal training session</p>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : trainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
              <UserCheck size={24} className="text-gray-400" />
            </div>
            <p className="text-sm text-gray-400">No trainers available</p>
          </div>
        ) : (
          trainers.map((trainer) => (
            <button
              key={trainer.id}
              onClick={() => router.push(`/trainers/${trainer.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
                {trainer.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trainer.photoUrl} alt={trainer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-base font-bold text-green-700">{trainer.name[0]}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{trainer.name}</p>
                {trainer.specialties.length > 0 && (
                  <p className="text-xs text-green-600 font-medium truncate">
                    {trainer.specialties.join(' · ')}
                  </p>
                )}
                <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{trainer.bio}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">{trainer._count.workoutPlans} plans</p>
                <ChevronRight size={16} className="text-gray-300 ml-auto mt-1" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
