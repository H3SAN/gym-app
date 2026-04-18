import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const gymClass = await prisma.class.findUnique({ where: { id: params.id } })
    if (!gymClass) {
      return apiError('Class not found', ErrorCode.NOT_FOUND, 404)
    }

    const bookings = await prisma.booking.findMany({
      where: { classId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { bookedAt: 'desc' },
    })

    return NextResponse.json({ bookings, class: gymClass })
  } catch (err) {
    console.error('[ADMIN CLASS BOOKINGS ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
