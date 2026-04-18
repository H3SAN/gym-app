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
    const member = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        memberships: { orderBy: { startDate: 'desc' } },
        checkIns: { orderBy: { checkedInAt: 'desc' }, take: 20 },
        bookings: {
          include: { class: true },
          orderBy: { bookedAt: 'desc' },
          take: 10,
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { product: true } } },
        },
        _count: { select: { checkIns: true, bookings: true, orders: true } },
      },
    })

    if (!member) {
      return apiError('Member not found', ErrorCode.NOT_FOUND, 404)
    }

    return NextResponse.json({ member })
  } catch (err) {
    console.error('[ADMIN MEMBER DETAIL ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
