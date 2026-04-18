import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

const THRESHOLD = 0.6 // face-api.js recommended match threshold

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
      return apiError('Invalid face embedding — expected 128 floats', ErrorCode.VALIDATION_INVALID, 400)
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { faceEmbedding: true },
    })

    if (!dbUser?.faceEmbedding?.length) {
      return apiError('No face enrolled for this account', ErrorCode.NOT_FOUND, 404)
    }

    const distance = euclidean(embedding, dbUser.faceEmbedding)
    const verified = distance < THRESHOLD

    return NextResponse.json({ verified, distance: Math.round(distance * 1000) / 1000 })
  } catch (err) {
    console.error('[FACE VERIFY ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
