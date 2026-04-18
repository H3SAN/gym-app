import Link from 'next/link'
import { ChevronRight, Dumbbell, Calendar, CreditCard } from 'lucide-react'

const actions = [
  {
    icon: Dumbbell,
    label: 'Track Workout',
    description: 'Log your exercise session',
    href: '/progress',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    icon: Calendar,
    label: 'Book a Class',
    description: 'Find and reserve your spot',
    href: '/classes',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    icon: CreditCard,
    label: 'Renew Subscription',
    description: 'Extend your membership',
    href: '/profile',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
]

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {actions.map(({ icon: Icon, label, description, href, iconBg, iconColor }, index) => (
        <Link key={href} href={href}>
          <div
            className={`flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
              index < actions.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
          </div>
        </Link>
      ))}
    </div>
  )
}
