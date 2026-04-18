import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'white'
  height?: 'xs' | 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export default function ProgressBar({
  value,
  color = 'green',
  height = 'sm',
  showLabel = false,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    white: 'bg-white',
  }

  const trackColors = {
    green: 'bg-green-100',
    blue: 'bg-blue-100',
    yellow: 'bg-yellow-100',
    red: 'bg-red-100',
    white: 'bg-white/30',
  }

  const heights = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 rounded-full overflow-hidden', trackColors[color], heights[height])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 w-8 text-right">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  )
}
