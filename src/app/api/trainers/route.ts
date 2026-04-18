import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)

  const trainers = await prisma.trainer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      bio: true,
      photoUrl: true,
      specialties: true,
      _count: { select: { sessions: true, workoutPlans: true } },
    },
  })

  return NextResponse.json({ trainers })
}
