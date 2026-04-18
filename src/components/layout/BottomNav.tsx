'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart2, ShoppingBag, Dumbbell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Progress', href: '/progress', icon: BarChart2 },
  { label: 'Store', href: '/store', icon: ShoppingBag },
  { label: 'Classes', href: '/classes', icon: Dumbbell },
  { label: 'Profile', href: '/profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-2 py-2 z-50 safe-bottom">
      <div className="flex items-center justify-around">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-150',
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(isActive && 'text-green-600')}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isActive ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
