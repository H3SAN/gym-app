import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { apiError, ErrorCode } from '@/lib/api-error'
import { rateLimits, rateLimitError } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** Generate a short, readable referral code like "AVG-X4K9" */
function generateCode(): string {
  return 'AVG-' + randomBytes(3).toString('hex').toUpperCase()
}

/**
 * GET /api/referrals
 * Returns the user's referral code (creates one if missing), their referral history,
 * and total rewards earned.
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    // Get all referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
      include: { referred: { select: { id: true, name: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Ensure the user has at least one PENDING referral code they can share
    let activeCode = referrals.find((r) => r.status === 'PENDING' && !r.referredId)
    if (!activeCode) {
      activeCode = await prisma.referral.create({
        data: {
          referrerId: user.id,
          code: generateCode(),
          status: 'PENDING',
        },
        include: { referred: { select: { id: true, name: true, createdAt: true } } },
      })
    }

    const completedReferrals = referrals.filter((r) => r.status === 'COMPLETED')
    const rewardsEarned = completedReferrals.filter((r) => r.rewardGiven).length

    return NextResponse.json({
      code: activeCode.code,
      referrals,
      stats: {
        totalReferrals: referrals.filter((r) => r.referredId).length,
        completedReferrals: completedReferrals.length,
        rewardsEarned,
      },
    })
  } catch (err) {
    console.error('[REFERRALS GET ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/referrals
 * Apply a referral code during or after signup.
 * Body: { code: string }
 * The authenticated user is the one being referred.
 */
export async function POST(request: NextRequest) {
  const rl = rateLimits.referral(request)
  if (!rl.allowed) return rateLimitError()

  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { code } = body as { code: string }

    if (!code) {
      return apiError('Referral code required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    // Check user hasn't already been referred
    const alreadyReferred = await prisma.referral.findFirst({
      where: { referredId: user.id, status: 'COMPLETED' },
    })
    if (alreadyReferred) {
      return apiError('You have already used a referral code', ErrorCode.BOOKING_CONFLICT, 409)
    }

    // Find the referral record
    const referral = await prisma.referral.findUnique({ where: { code } })
    if (!referral) {
      return apiError('Invalid referral code', ErrorCode.NOT_FOUND, 404)
    }
    if (referral.status !== 'PENDING') {
      return apiError('This referral code has already been used', ErrorCode.BOOKING_CONFLICT, 409)
    }
    if (referral.referrerId === user.id) {
      return apiError('You cannot use your own referral code', ErrorCode.VALIDATION_INVALID, 400)
    }

    // Complete referral + mark reward as given + create a fresh code for the referrer
    const [updated] = await prisma.$transaction([
      prisma.referral.update({
        where: { id: referral.id },
        data: {
          referredId: user.id,
          status: 'COMPLETED',
          rewardGiven: true,
          completedAt: new Date(),
        },
      }),
      // Give the referrer a new shareable code immediately
      prisma.referral.create({
        data: {
          referrerId: referral.referrerId,
          code: generateCode(),
          status: 'PENDING',
        },
      }),
    ])

    return NextResponse.json({
      message: 'Referral applied successfully! Reward granted.',
      referral: updated,
    })
  } catch (err) {
    console.error('[REFERRALS POST ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
