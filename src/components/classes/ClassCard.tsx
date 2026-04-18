'use client'

import { formatTime, getDifficultyColor, cn } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Class } from '@/types'
import Link from 'next/link'
import { Clock, Users, MapPin } from 'lucide-react'

interface ClassCardProps {
  gymClass: Class
  onBook?: (classId: string) => void
  isBooked?: boolean
  isLoading?: boolean
}

export default function ClassCard({ gymClass, onBook, isBooked, isLoading }: ClassCardProps) {
  const spotsLeft = gymClass.capacity - gymClass.bookedCount
  const isFull = spotsLeft <= 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <Avatar
        name={gymClass.instructorName}
        src={gymClass.instructorPhoto}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{gymClass.name}</p>
          {gymClass.isPro && <Badge variant="green">PRO</Badge>}
        </div>
        <p className="text-xs text-gray-500 mb-1.5 truncate">with {gymClass.instructorName}</p>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            {formatTime(gymClass.startTime)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={11} />
            {isFull ? (
              <span className="text-red-500">Full</span>
            ) : (
              `${spotsLeft} spots`
            )}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MapPin size={11} />
            {gymClass.location}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex mt-1.5 text-xs font-medium px-1.5 py-0.5 rounded-md',
            getDifficultyColor(gymClass.difficulty)
          )}
        >
          {gymClass.difficulty.charAt(0) + gymClass.difficulty.slice(1).toLowerCase()}
        </span>
      </div>
      <div className="flex-shrink-0">
        {isBooked ? (
          <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-xl">
            Booked
          </span>
        ) : (
          <Button
            size="sm"
            variant={isFull ? 'outline' : 'primary'}
            disabled={isFull}
            loading={isLoading}
            onClick={() => onBook?.(gymClass.id)}
          >
            {isFull ? 'Full' : 'Book'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function ClassCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 animate-pulse">
      <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="w-16 h-8 bg-gray-200 rounded-xl" />
    </div>
  )
}
