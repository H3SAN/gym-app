import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { WeightUnit } from '@prisma/client'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const workouts = await prisma.workoutLog.findMany({
      where: { userId: user.id },
      include: { exercises: true },
      orderBy: { date: 'desc' },
      take: limit,
    })

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error('[WORKOUTS GET ERROR]', error)
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
    const { date, notes, exercises } = body

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return apiError('At least one exercise is required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId: user.id,
        date: date ? new Date(date) : new Date(),
        notes,
        exercises: {
          create: exercises.map((ex: {
            name: string
            sets: number
            reps: number
            weight?: number
            unit?: string
          }) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight || 0,
            unit: (ex.unit as WeightUnit) || WeightUnit.KG,
          })),
        },
      },
      include: { exercises: true },
    })

    return NextResponse.json({ workout: workoutLog }, { status: 201 })
  } catch (error) {
    console.error('[WORKOUT CREATE ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
