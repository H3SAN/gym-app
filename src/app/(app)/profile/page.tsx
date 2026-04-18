'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { daysUntil } from '@/lib/utils'
import type { Membership } from '@/types'
import {
  ChevronRight,
  Mail,
  MapPin,
  Tag,
  MessageSquare,
  Package,
  CheckCircle,
  LogOut,
  CreditCard,
  Bell,
  BellOff,
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import FaceEnroll from '@/components/face/FaceEnroll'

export default function ProfilePage() {
  const router = useRouter()
  const { user, token, logout } = useAuthStore()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [faceEnrolled, setFaceEnrolled] = useState(user?.faceEnrolled ?? false)
  const { permission, isSubscribed, isLoading: pushLoading, isSupported, subscribe, unsubscribe } = usePushNotifications()

  useEffect(() => {
    setFaceEnrolled(user?.faceEnrolled ?? false)
  }, [user?.faceEnrolled])

  useEffect(() => {
    if (!token) return
    fetch('/api/membership', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setMembership(data.membership || null))
      .catch(console.error)
  }, [token])

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const menuItems = [
    { icon: MapPin, label: 'My city', sublabel: 'Set your location', action: () => {} },
    { icon: Tag, label: 'Enter promo code', sublabel: 'Redeem a discount', action: () => {} },
    { icon: MessageSquare, label: 'Messages', sublabel: 'Chat with support', action: () => {} },
    { icon: Package, label: 'My orders', sublabel: 'View order history', action: () => router.push('/store/orders') },
  ]

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-10 pb-5 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
        <div
          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors cursor-pointer"
        >
          <Avatar name={user?.name || ''} src={user?.avatarUrl} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{user?.name || 'Loading...'}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
            {membership && (
              <Badge variant="green" className="mt-1">{membership.tier}</Badge>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Membership Card */}
        {membership && (
          <button
            onClick={() => router.push('/membership')}
            className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-left active:scale-[0.99] transition-transform"
          >
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CreditCard size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  View my current membership
                </p>
                <p className="text-xs text-gray-400">
                  {membership.tier} · {daysUntil(membership.endDate)} days remaining
                </p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>
        )}

        {/* Sign in methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sign in methods
          </p>
          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-50">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
              <Mail size={16} className="text-gray-600" />
            </div>
            <p className="text-sm text-gray-700 flex-1">Email</p>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          {token && (
            <FaceEnroll
              token={token}
              enrolled={faceEnrolled}
              onEnrolled={() => setFaceEnrolled(true)}
              onRemoved={() => setFaceEnrolled(false)}
            />
          )}
        </div>

        {/* Referral Code */}
        <div className="bg-green-600 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Referral code</p>
            <p className="text-xs text-white/70 mt-0.5">
              Share{' '}
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">
                {user?.name?.toUpperCase().replace(/\s/g, '').substring(0, 6) || 'AVGYM'}
              </span>{' '}
              and earn rewards
            </p>
          </div>
          <ChevronRight size={18} className="text-white/60" />
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {menuItems.map(({ icon: Icon, label, sublabel, action }, index) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left ${
                index > 0 ? 'border-t border-gray-50' : ''
              }`}
            >
              <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-400">{sublabel}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Notifications */}
        {isSupported && permission !== 'denied' && (
          <button
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={pushLoading}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isSubscribed ? <Bell size={16} className="text-green-600" /> : <BellOff size={16} className="text-gray-500" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">
                {isSubscribed ? 'Notifications on' : 'Enable notifications'}
              </p>
              <p className="text-xs text-gray-400">
                {isSubscribed ? 'Tap to turn off class reminders' : 'Get class reminders & booking confirmations'}
              </p>
            </div>
            {isSubscribed && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:bg-red-50 active:bg-red-100 transition-colors text-red-500"
        >
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut size={16} className="text-red-500" />
          </div>
          <p className="text-sm font-medium flex-1 text-left">Sign Out</p>
        </button>

        <p className="text-center text-xs text-gray-300 pb-2">
          Avengers Gym v0.1.0
        </p>
      </div>
    </div>
  )
}
