import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, format } from 'date-fns'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const [
      totalRevenueResult,
      monthRevenueResult,
      lastMonthRevenueResult,
      totalMembers,
      newMembersThisMonth,
      activeMembers,
      todayCheckIns,
      totalClasses,
      upcomingClasses,
      membershipBreakdown,
      topClasses,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { total: true } }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: monthStart, lte: monthEnd } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: 'PAID', createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: monthStart } } }),
      prisma.membership.count({ where: { isActive: true, endDate: { gt: now } } }),
      prisma.checkInLog.count({
        where: { checkedInAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      }),
      prisma.class.count({ where: { isCancelled: false } }),
      prisma.class.count({ where: { isCancelled: false, startTime: { gt: now } } }),
      prisma.membership.groupBy({
        by: ['tier'],
        where: { isActive: true, endDate: { gt: now } },
        _count: true,
      }),
      prisma.class.findMany({
        where: { isCancelled: false },
        orderBy: { bookedCount: 'desc' },
        take: 5,
        select: { id: true, name: true, bookedCount: true, capacity: true, startTime: true },
      }),
    ])

    // Revenue chart — last 7 days
    const revenueByDay = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = subDays(now, 6 - i)
        return prisma.order
          .aggregate({
            where: {
              status: 'PAID',
              createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
            },
            _sum: { total: true },
          })
          .then((r) => ({ date: format(day, 'MMM d'), revenue: r._sum.total ?? 0 }))
      })
    )

    return NextResponse.json({
      revenue: {
        total: totalRevenueResult._sum.total ?? 0,
        thisMonth: monthRevenueResult._sum.total ?? 0,
        lastMonth: lastMonthRevenueResult._sum.total ?? 0,
      },
      members: {
        total: totalMembers,
        active: activeMembers,
        newThisMonth: newMembersThisMonth,
      },
      checkIns: { today: todayCheckIns },
      classes: { total: totalClasses, upcoming: upcomingClasses },
      revenueByDay,
      membershipBreakdown: membershipBreakdown.map((m) => ({
        tier: m.tier,
        count: m._count,
      })),
      topClasses,
    })
  } catch (err) {
    console.error('[ADMIN STATS ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
