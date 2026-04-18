'use client'

import { cn } from '@/lib/utils'

type FilterOption = 'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'

interface ClassFilterProps {
  active: FilterOption
  onChange: (filter: FilterOption) => void
}

const filters: { label: string; value: FilterOption }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
  { label: 'Pro Only', value: 'PRO' },
]

export default function ClassFilter({ active, onChange }: ClassFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {filters.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
            active === value
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
