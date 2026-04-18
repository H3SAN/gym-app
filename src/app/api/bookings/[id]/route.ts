import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    })

    if (!booking) {
      return apiError('Booking not found', ErrorCode.NOT_FOUND, 404)
    }

    if (booking.userId !== user.id) {
      return apiError('Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
    }

    if (booking.status === 'CANCELLED') {
      return apiError('Booking is already cancelled', ErrorCode.BOOKING_CONFLICT, 409)
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: params.id },
        data: { status: 'CANCELLED' },
      }),
      prisma.class.update({
        where: { id: booking.classId },
        data: { bookedCount: { decrement: 1 } },
      }),
    ])

    return NextResponse.json({ message: 'Booking cancelled' })
  } catch (err) {
    console.error('[BOOKING CANCEL ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
