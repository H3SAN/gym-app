import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  const plan = await prisma.workoutPlan.findFirst({
    where: { id: params.id, isPublished: true },
    include: {
      trainer: { select: { id: true, name: true, photoUrl: true, bio: true, specialties: true } },
      weeks: {
        orderBy: { weekNumber: 'asc' },
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              exercises: { orderBy: { order: 'asc' } },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  })

  if (!plan) return apiError('Plan not found', ErrorCode.NOT_FOUND, 404)

  const enrollment = await prisma.userWorkoutPlan.findUnique({
    where: { userId_planId: { userId: user.id, planId: params.id } },
  })

  return NextResponse.json({ plan, isEnrolled: !!enrollment?.isActive })
}
