import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const isPro = searchParams.get('isPro')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = {}
    if (difficulty && difficulty !== 'ALL') {
      where.difficulty = difficulty
    }
    if (isPro === 'true') {
      where.isPro = true
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { instructorName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('[CLASSES GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      instructorName,
      instructorPhoto,
      startTime,
      endTime,
      capacity,
      difficulty,
      isPro,
      location,
    } = body

    if (!name || !instructorName || !startTime || !endTime) {
      return apiError('Missing required fields', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const gymClass = await prisma.class.create({
      data: {
        name,
        description: description || '',
        instructorName,
        instructorPhoto,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: capacity || 20,
        difficulty: difficulty || 'BEGINNER',
        isPro: isPro || false,
        location: location || 'Main Studio',
      },
    })

    return NextResponse.json({ class: gymClass }, { status: 201 })
  } catch (error) {
    console.error('[CLASS CREATE ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
