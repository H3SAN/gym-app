import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  const { searchParams } = new URL(request.url)
  const difficulty = searchParams.get('difficulty')

  const plans = await prisma.workoutPlan.findMany({
    where: {
      isPublished: true,
      ...(difficulty && difficulty !== 'ALL' ? { difficulty: difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' } : {}),
    },
    include: {
      trainer: { select: { id: true, name: true, photoUrl: true, specialties: true } },
      _count: { select: { enrollments: true, weeks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Tag which plans the user is enrolled in
  const enrolled = await prisma.userWorkoutPlan.findMany({
    where: { userId: user.id, isActive: true },
    select: { planId: true },
  })
  const enrolledIds = new Set(enrolled.map((e) => e.planId))

  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, isEnrolled: enrolledIds.has(p.id) })),
  })
}
