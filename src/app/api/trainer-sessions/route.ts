import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

// Session durations per type
const SESSION_DURATION: Record<string, number> = {
  STANDARD: 60,
  EXPRESS: 30,
}

// Membership tiers that can book EXPRESS sessions
const EXPRESS_TIERS = new Set(['PRO', 'ELITE'])

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  const sessions = await prisma.trainerSession.findMany({
    where: { userId: user.id },
    include: { trainer: { select: { id: true, name: true, photoUrl: true } } },
    orderBy: { scheduledAt: 'desc' },
  })

  return NextResponse.json({ sessions })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  try {
    const { trainerId, scheduledAt, type, notes } = await request.json()

    if (!trainerId || !scheduledAt || !type) {
      return apiError('trainerId, scheduledAt, and type are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    if (!['STANDARD', 'EXPRESS'].includes(type)) {
      return apiError('Invalid session type', ErrorCode.VALIDATION_INVALID, 400)
    }

    // Express sessions require PRO or ELITE membership
    if (type === 'EXPRESS') {
      const membership = user.memberships[0]
      const isEligible =
        membership &&
        membership.isActive &&
        new Date(membership.endDate) > new Date() &&
        EXPRESS_TIERS.has(membership.tier)

      if (!isEligible) {
        return apiError(
          'EXPRESS sessions require a PRO or ELITE membership',
          ErrorCode.MEMBERSHIP_REQUIRED,
          403
        )
      }
    }

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId, isActive: true } })
    if (!trainer) return apiError('Trainer not found', ErrorCode.NOT_FOUND, 404)

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate < new Date()) {
      return apiError('Cannot book a session in the past', ErrorCode.VALIDATION_INVALID, 400)
    }

    // Check for trainer conflicts (same hour window)
    const windowStart = new Date(scheduledDate.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(scheduledDate.getTime() + 90 * 60 * 1000)

    const conflict = await prisma.trainerSession.findFirst({
      where: {
        trainerId,
        scheduledAt: { gte: windowStart, lte: windowEnd },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (conflict) {
      return apiError(
        'Trainer is not available at that time. Please choose a different slot.',
        ErrorCode.BOOKING_CONFLICT,
        409
      )
    }

    const session = await prisma.trainerSession.create({
      data: {
        trainerId,
        userId: user.id,
        scheduledAt: scheduledDate,
        duration: SESSION_DURATION[type],
        type,
        status: 'PENDING',
        notes: notes ?? null,
      },
      include: { trainer: { select: { id: true, name: true, photoUrl: true } } },
    })

    return NextResponse.json({ session, message: 'Session booked!' }, { status: 201 })
  } catch (err) {
    console.error('[TRAINER SESSION BOOK ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
