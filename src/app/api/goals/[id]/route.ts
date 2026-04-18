import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!existing) {
      return apiError('Goal not found', ErrorCode.NOT_FOUND, 404)
    }

    const body = await request.json()
    const { title, targetValue, currentValue, unit, targetDate } = body

    const goal = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(targetValue !== undefined && { targetValue: Number(targetValue) }),
        ...(currentValue !== undefined && { currentValue: Number(currentValue) }),
        ...(unit !== undefined && { unit }),
        ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
      },
    })

    return NextResponse.json({ goal })
  } catch (err) {
    console.error('[GOALS PUT ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const existing = await prisma.goal.findFirst({
      where: { id: params.id, userId: user.id },
    })
    if (!existing) {
      return apiError('Goal not found', ErrorCode.NOT_FOUND, 404)
    }

    await prisma.goal.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Goal deleted' })
  } catch (err) {
    console.error('[GOALS DELETE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
