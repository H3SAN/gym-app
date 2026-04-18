import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subWeeks, subMonths } from 'date-fns'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'week'

    const now = new Date()
    let chartData: { label: string; value: number }[] = []

    if (period === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now)
        day.setDate(day.getDate() - i)
        const dayStart = new Date(day.setHours(0, 0, 0, 0))
        const dayEnd = new Date(day.setHours(23, 59, 59, 999))
        const count = await prisma.workoutLog.count({
          where: { userId: user.id, date: { gte: dayStart, lte: dayEnd } },
        })
        chartData.push({ label: format(dayStart, 'EEE'), value: count })
      }
    } else if (period === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i))
        const weekEnd = endOfWeek(subWeeks(now, i))
        const count = await prisma.workoutLog.count({
          where: { userId: user.id, date: { gte: weekStart, lte: weekEnd } },
        })
        chartData.push({ label: `W${4 - i}`, value: count })
      }
    } else if (period === 'year') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i))
        const monthEnd = endOfMonth(subMonths(now, i))
        const count = await prisma.workoutLog.count({
          where: { userId: user.id, date: { gte: monthStart, lte: monthEnd } },
        })
        chartData.push({ label: format(monthStart, 'MMM'), value: count })
      }
    }

    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const totalWorkouts = await prisma.workoutLog.count({ where: { userId: user.id } })
    const thisMonthStart = startOfMonth(now)
    const thisMonthWorkouts = await prisma.workoutLog.count({
      where: { userId: user.id, date: { gte: thisMonthStart } },
    })

    return NextResponse.json({
      chartData,
      goals,
      stats: {
        totalWorkouts,
        thisMonthWorkouts,
      },
    })
  } catch (error) {
    console.error('[PROGRESS GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
