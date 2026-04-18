import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStripe() { return new Stripe(process.env.STRIPE_SECRET_KEY!) as any }

const MEMBERSHIP_PRICES: Record<string, number> = {
  PRO: 2999,   // $29.99
  ELITE: 5999, // $59.99
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const { tier } = await request.json()

    if (!tier || !MEMBERSHIP_PRICES[tier]) {
      return apiError('Invalid membership tier', ErrorCode.VALIDATION_INVALID, 400)
    }

    const currentTier = user.memberships[0]?.tier ?? 'BASIC'

    const tierRank: Record<string, number> = { BASIC: 0, PRO: 1, ELITE: 2 }
    if (tierRank[tier] <= tierRank[currentTier]) {
      return apiError(
        `You are already on ${currentTier} or higher`,
        ErrorCode.VALIDATION_INVALID,
        400
      )
    }

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: MEMBERSHIP_PRICES[tier],
      currency: 'usd',
      metadata: {
        type: 'membership_upgrade',
        userId: user.id,
        upgradeTo: tier,
      },
      automatic_payment_methods: { enabled: true },
    })

    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('[MEMBERSHIP UPGRADE ERROR]', err)
    return apiError('Failed to create payment', ErrorCode.INTERNAL_ERROR, 500)
  }
}
