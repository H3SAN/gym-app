'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, ShoppingBag, Users, ClipboardList, ScanFace } from 'lucide-react'

const tabs = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Classes', href: '/admin/classes', icon: Dumbbell },
  { label: 'Products', href: '/admin/products', icon: ShoppingBag },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Plans', href: '/admin/workout-plans', icon: ClipboardList },
  { label: 'Check-ins', href: '/admin/checkins', icon: ScanFace },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ label, href, icon: Icon }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
            >
              <Icon
                size={22}
                className={isActive ? 'text-green-600' : 'text-gray-400'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? 'text-green-600' : 'text-gray-400'
                }`}
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
