import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  const trainers = await prisma.trainer.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ trainers })
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    const { name, bio, photoUrl, specialties } = await request.json()

    if (!name || !bio) {
      return apiError('Name and bio are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const trainer = await prisma.trainer.create({
      data: { name, bio, photoUrl: photoUrl || null, specialties: specialties ?? [] },
    })

    return NextResponse.json({ trainer }, { status: 201 })
  } catch (err) {
    console.error('[TRAINER CREATE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
