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
    const tier = searchParams.get('tier')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = 20

    const where: Record<string, unknown> = { role: 'CUSTOMER' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          memberships: {
            where: { isActive: true, endDate: { gte: new Date() } },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
          _count: {
            select: { checkIns: true, bookings: true, orders: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const filtered =
      tier && tier !== 'ALL'
        ? members.filter((m) => m.memberships[0]?.tier === tier)
        : members

    return NextResponse.json({
      members: filtered,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('[ADMIN MEMBERS ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
