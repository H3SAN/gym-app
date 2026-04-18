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
    const goals = await prisma.goal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ goals })
  } catch (err) {
    console.error('[GOALS GET ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { title, targetValue, currentValue = 0, unit, targetDate } = body

    if (!title || !targetValue || !unit || !targetDate) {
      return apiError('Missing required fields', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title,
        targetValue: Number(targetValue),
        currentValue: Number(currentValue),
        unit,
        targetDate: new Date(targetDate),
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (err) {
    console.error('[GOALS POST ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
