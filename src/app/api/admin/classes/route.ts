import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const showCancelled = searchParams.get('showCancelled') === 'true'

    const where: Record<string, unknown> = {}
    if (!showCancelled) where.isCancelled = false
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { instructorName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: { _count: { select: { bookings: true } } },
    })

    return NextResponse.json({ classes })
  } catch (err) {
    console.error('[ADMIN CLASSES GET ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
