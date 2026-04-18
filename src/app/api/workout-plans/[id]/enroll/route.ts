import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: params.id, isPublished: true },
  })

  if (!plan) return apiError('Plan not found', ErrorCode.NOT_FOUND, 404)

  // Deactivate any other currently active plan for this user
  await prisma.userWorkoutPlan.updateMany({
    where: { userId: user.id, isActive: true },
    data: { isActive: false },
  })

  const enrollment = await prisma.userWorkoutPlan.upsert({
    where: { userId_planId: { userId: user.id, planId: params.id } },
    create: { userId: user.id, planId: params.id, isActive: true, startedAt: new Date() },
    update: { isActive: true, startedAt: new Date() },
  })

  return NextResponse.json({ enrollment, message: 'Enrolled successfully' })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  await prisma.userWorkoutPlan.updateMany({
    where: { userId: user.id, planId: params.id },
    data: { isActive: false },
  })

  return NextResponse.json({ message: 'Unenrolled successfully' })
}
