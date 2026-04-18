import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  try {
    const session = await prisma.trainerSession.findUnique({ where: { id: params.id } })

    if (!session) return apiError('Session not found', ErrorCode.NOT_FOUND, 404)
    if (session.userId !== user.id) return apiError('Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

    if (session.status === 'CANCELLED') {
      return apiError('Session is already cancelled', ErrorCode.BOOKING_CONFLICT, 409)
    }

    if (session.status === 'COMPLETED') {
      return apiError('Cannot cancel a completed session', ErrorCode.BOOKING_CONFLICT, 409)
    }

    // Must cancel at least 2 hours before
    const hoursUntil = (session.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursUntil < 2) {
      return apiError(
        'Sessions must be cancelled at least 2 hours in advance',
        ErrorCode.VALIDATION_INVALID,
        400
      )
    }

    const updated = await prisma.trainerSession.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: { trainer: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ session: updated, message: 'Session cancelled' })
  } catch (err) {
    console.error('[TRAINER SESSION CANCEL ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
