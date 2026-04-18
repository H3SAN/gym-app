import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  const plans = await prisma.workoutPlan.findMany({
    include: {
      trainer: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, weeks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ plans })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    const { trainerId, title, description, difficulty, durationWeeks, weeks } =
      await request.json()

    if (!trainerId || !title || !description) {
      return apiError('trainerId, title, and description are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId,
        title,
        description,
        difficulty: difficulty ?? 'BEGINNER',
        durationWeeks: durationWeeks ?? 4,
        weeks: weeks
          ? {
              create: weeks.map(
                (w: { weekNumber: number; days: { dayNumber: number; label?: string; isRest?: boolean; exercises?: { name: string; sets: number; reps: number; restSeconds?: number; notes?: string; order?: number }[] }[] }) => ({
                  weekNumber: w.weekNumber,
                  days: {
                    create: w.days.map((d) => ({
                      dayNumber: d.dayNumber,
                      label: d.label,
                      isRest: d.isRest ?? false,
                      exercises: d.exercises
                        ? {
                            create: d.exercises.map((ex, idx) => ({
                              name: ex.name,
                              sets: ex.sets,
                              reps: ex.reps,
                              restSeconds: ex.restSeconds ?? 60,
                              notes: ex.notes ?? null,
                              order: ex.order ?? idx,
                            })),
                          }
                        : undefined,
                    })),
                  },
                })
              ),
            }
          : undefined,
      },
      include: {
        trainer: { select: { id: true, name: true } },
        weeks: { include: { days: { include: { exercises: true } } } },
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (err) {
    console.error('[WORKOUT PLAN CREATE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
