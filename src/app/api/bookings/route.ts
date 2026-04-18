import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      include: { class: true },
      orderBy: { bookedAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[BOOKINGS GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
