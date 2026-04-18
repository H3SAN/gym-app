'use client'

import { useEffect, useState } from 'react'
import { daysUntil, getMembershipColor } from '@/lib/utils'
import ProgressBar from '@/components/ui/ProgressBar'
import Button from '@/components/ui/Button'
import type { Membership } from '@/types'
import Image from 'next/image'
import { RefreshCw } from 'lucide-react'

interface MembershipCardProps {
  membership: Membership | null | undefined
}

export default function MembershipCard({ membership }: MembershipCardProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(true)

  const fetchQr = async () => {
    setLoadingQr(true)
    try {
      const token = localStorage.getItem('auth-storage')
        ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token
        : null
      if (!token) return
      const res = await fetch('/api/qr', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setQrSrc(data.qrCode)
      }
    } catch {
      // silent
    } finally {
      setLoadingQr(false)
    }
  }

  useEffect(() => {
    fetchQr()
  }, [])

  if (!membership) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 p-5 text-white">
        <p className="text-sm opacity-80">No active membership</p>
        <Button variant="secondary" size="sm" className="mt-3 bg-white/20 text-white hover:bg-white/30 border-0">
          Get Started
        </Button>
      </div>
    )
  }

  const days = daysUntil(membership.endDate)
  const totalDays = 30
  const progress = Math.max(0, Math.min(100, ((totalDays - days) / totalDays) * 100))
  const gradient = getMembershipColor(membership.tier)

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-medium opacity-70 uppercase tracking-wider">Avengers Gym</p>
          <p className="text-xl font-bold mt-0.5">{membership.tier} Member</p>
        </div>
        <button
          onClick={fetchQr}
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {loadingQr ? (
            <div className="w-16 h-16 bg-gray-200 animate-pulse rounded" />
          ) : qrSrc ? (
            <Image src={qrSrc} alt="QR Code" width={72} height={72} className="rounded" />
          ) : (
            <div className="text-gray-400 text-xs text-center p-1">No QR</div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5 opacity-80">
            <span>Membership Progress</span>
            <span>{days > 0 ? `${days}d left` : 'Expired'}</span>
          </div>
          <ProgressBar value={progress} color="white" height="sm" />
          <p className="text-xs opacity-60 mt-1.5">
            Expires {new Date(membership.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="mt-4 bg-white/20 text-white hover:bg-white/30 border-0 font-semibold"
      >
        Renew Membership
      </Button>
    </div>
  )
}
