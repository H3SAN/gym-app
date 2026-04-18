'use client'

import { formatTime } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Class } from '@/types'
import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'

interface ActivityCardProps {
  gymClass: Class
}

export default function ActivityCard({ gymClass }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <Avatar
          name={gymClass.instructorName}
          src={gymClass.instructorPhoto}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-900 truncate">{gymClass.name}</p>
            {gymClass.isPro && <Badge variant="green">PRO</Badge>}
          </div>
          <p className="text-sm text-gray-500 truncate">with {gymClass.instructorName}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} />
              {formatTime(gymClass.startTime)}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin size={11} />
              {gymClass.location}
            </span>
          </div>
        </div>
        <Link href={`/classes/${gymClass.id}`}>
          <Button size="sm" variant="primary">
            Book
          </Button>
        </Link>
      </div>
    </div>
  )
}
