import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface TopBarProps {
  title?: string
  leftAction?: ReactNode
  rightAction?: ReactNode
  className?: string
  transparent?: boolean
}

export default function TopBar({
  title,
  leftAction,
  rightAction,
  className,
  transparent = false,
}: TopBarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between px-4 py-3',
        !transparent && 'bg-white border-b border-gray-100',
        className
      )}
    >
      <div className="w-8">{leftAction}</div>
      {title && (
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
      )}
      <div className="w-8 flex justify-end">{rightAction}</div>
    </header>
  )
}
