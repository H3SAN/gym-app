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
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, isActive: true, endDate: { gte: new Date() } },
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ membership })
  } catch (error) {
    console.error('[MEMBERSHIP GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
