'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import {
  loadStripe,
  type StripeElementsOptions,
} from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { CheckCircle, Zap, Crown, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Membership } from '@/types'
import { format } from 'date-fns'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TIERS = [
  {
    id: 'BASIC',
    label: 'Basic',
    price: 0,
    priceLabel: 'Free',
    icon: Shield,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    features: ['Access to gym floor', 'Standard equipment', 'Locker rooms'],
  },
  {
    id: 'PRO',
    label: 'Pro',
    price: 29.99,
    priceLabel: '$29.99/mo',
    icon: Zap,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    features: ['Everything in Basic', 'Group classes', 'Express trainer sessions', 'Nutrition guides'],
  },
  {
    id: 'ELITE',
    label: 'Elite',
    price: 59.99,
    priceLabel: '$59.99/mo',
    icon: Crown,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    features: ['Everything in Pro', 'Priority class booking', 'Monthly PT session', 'Recovery suite access'],
  },
]

const TIER_RANK: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 }

// ─── Checkout form (inside <Elements>) ───────────────────────────────────────

function CheckoutForm({
  targetTier,
  onSuccess,
  onCancel,
}: {
  targetTier: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setError('')
    setLoading(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/membership?success=1`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    onSuccess()
  }

  const tier = TIERS.find((t) => t.id === targetTier)

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Upgrading to {tier?.label}</span>
        <span className="text-sm font-bold text-gray-900">{tier?.priceLabel}</span>
      </div>

      <PaymentElement />

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
        >
          Cancel
        </button>
        <Button type="submit" variant="primary" loading={loading} className="flex-1">
          Pay {tier?.priceLabel}
        </Button>
      </div>
    </form>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MembershipPage() {
  const { token } = useAuthStore()
  const [membership, setMembership] = useState<Membership | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)

  const fetchMembership = useCallback(async () => {
    if (!token) return
    const res = await fetch('/api/membership', { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setMembership(data.membership ?? null)
    setIsLoading(false)
  }, [token])

  useEffect(() => {
    fetchMembership()
  }, [fetchMembership])

  // Handle ?success=1 return from Stripe redirect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('success=1')) {
      setUpgraded(true)
      fetchMembership()
      window.history.replaceState({}, '', '/membership')
    }
  }, [fetchMembership])

  const handleUpgrade = async (tier: string) => {
    if (!token) return
    setUpgrading(true)

    try {
      const res = await fetch('/api/membership/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to start upgrade')
        return
      }
      setClientSecret(data.clientSecret)
      setSelectedTier(tier)
    } catch {
      alert('Something went wrong')
    } finally {
      setUpgrading(false)
    }
  }

  const currentTier = membership?.tier ?? 'BASIC'

  const elementsOptions: StripeElementsOptions = clientSecret
    ? { clientSecret, appearance: { theme: 'stripe' } }
    : {}

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 pb-8 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Membership</h1>

      {/* Success banner */}
      {upgraded && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            Membership upgraded successfully!
          </p>
        </div>
      )}

      {/* Current membership */}
      {membership && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Current plan
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">{currentTier}</span>
            <span className="text-xs text-gray-400">
              Renews {format(new Date(membership.endDate), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      )}

      {/* Checkout form */}
      {clientSecret && selectedTier && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Complete upgrade</h2>
          <Elements stripe={stripePromise} options={elementsOptions}>
            <CheckoutForm
              targetTier={selectedTier}
              onSuccess={() => {
                setClientSecret(null)
                setSelectedTier(null)
                setUpgraded(true)
                fetchMembership()
              }}
              onCancel={() => {
                setClientSecret(null)
                setSelectedTier(null)
              }}
            />
          </Elements>
        </div>
      )}

      {/* Tier cards */}
      {!clientSecret && (
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const isCurrent = tier.id === currentTier
            const isDowngrade = TIER_RANK[tier.id] < TIER_RANK[currentTier]
            const Icon = tier.icon

            return (
              <div
                key={tier.id}
                className={`bg-white rounded-2xl border-2 shadow-sm p-4 transition-all ${
                  isCurrent ? `${tier.border} ring-2 ring-offset-1` : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 ${tier.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={18} className={tier.color} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tier.label}</p>
                      <p className={`text-xs font-semibold ${tier.color}`}>{tier.priceLabel}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      CURRENT
                    </span>
                  )}
                </div>

                <ul className="space-y-1 mb-4">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle size={13} className="text-green-500 shrink-0" />
                      <span className="text-xs text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && !isDowngrade && tier.id !== 'BASIC' && (
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={upgrading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${tier.bg} ${tier.color} hover:opacity-80 disabled:opacity-50`}
                  >
                    {upgrading ? 'Loading…' : `Upgrade to ${tier.label}`}
                  </button>
                )}

                {isDowngrade && (
                  <p className="text-xs text-gray-400 text-center">
                    Contact support to downgrade
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
