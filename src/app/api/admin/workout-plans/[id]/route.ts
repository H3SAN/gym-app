import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    const { title, description, difficulty, durationWeeks, isPublished } = await request.json()

    const plan = await prisma.workoutPlan.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(difficulty !== undefined && { difficulty }),
        ...(durationWeeks !== undefined && { durationWeeks }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: { trainer: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ plan })
  } catch (err) {
    console.error('[WORKOUT PLAN UPDATE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    await prisma.workoutPlan.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Plan deleted' })
  } catch (err) {
    console.error('[WORKOUT PLAN DELETE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
