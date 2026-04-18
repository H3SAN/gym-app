import { daysUntil } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import type { Goal } from '@/types'
import { Target } from 'lucide-react'

interface GoalCardProps {
  goal: Goal
}

export default function GoalCard({ goal }: GoalCardProps) {
  const progress = Math.min(100, (goal.currentValue / goal.targetValue) * 100)
  const days = daysUntil(goal.targetDate)
  const isToday = days === 0
  const isOverdue = days < 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
            <Target size={16} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{goal.title}</p>
            <p className="text-xs text-gray-400">
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </p>
          </div>
        </div>
        {isToday ? (
          <Badge variant="green">Today</Badge>
        ) : isOverdue ? (
          <Badge variant="red">Overdue</Badge>
        ) : (
          <Badge variant="gray">{days}d left</Badge>
        )}
      </div>
      <ProgressBar value={progress} showLabel height="sm" />
      <p className="text-xs text-gray-400 mt-2">
        Target: {new Date(goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  )
}
