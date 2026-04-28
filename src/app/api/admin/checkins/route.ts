import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'PENDING'

  const checkins = await prisma.checkInLog.findMany({
    where: {
      method: 'FACE',
      status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
    },
    orderBy: { checkedInAt: 'desc' },
    take: 50,
    select: {
      id: true,
      checkedInAt: true,
      status: true,
      reviewedAt: true,
      reviewedBy: true,
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  return NextResponse.json({ checkins })
}
