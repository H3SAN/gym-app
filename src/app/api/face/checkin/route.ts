import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

const THRESHOLD = 0.6

function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { embedding } = body as { embedding: number[] }

    if (!Array.isArray(embedding) || embedding.length !== 128) {
      return apiError('Invalid face embedding', ErrorCode.VALIDATION_INVALID, 400)
    }

    // Verify face
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { faceEmbedding: true, name: true },
    })

    if (!dbUser?.faceEmbedding?.length) {
      return apiError('No face enrolled. Please enroll from your Profile page.', ErrorCode.NOT_FOUND, 404)
    }

    const distance = euclidean(embedding, dbUser.faceEmbedding)
    if (distance >= THRESHOLD) {
      return apiError('Face not recognised', ErrorCode.AUTH_FORBIDDEN, 403)
    }

    // Check active membership
    const membership = await prisma.membership.findFirst({
      where: { userId: user.id, isActive: true, endDate: { gte: new Date() } },
    })
    if (!membership) {
      return apiError('No active membership', ErrorCode.MEMBERSHIP_REQUIRED, 403)
    }

    // Log the check-in (qrToken field used as method marker)
    const checkIn = await prisma.checkInLog.create({
      data: {
        userId: user.id,
        qrToken: `face-${user.id}-${Date.now()}`,
        isValid: true,
      },
    })

    return NextResponse.json({
      success: true,
      checkIn,
      message: `Welcome, ${dbUser.name}!`,
    })
  } catch (err) {
    console.error('[FACE CHECKIN ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
