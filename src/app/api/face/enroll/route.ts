import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

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

    await prisma.user.update({
      where: { id: user.id },
      data: { faceEmbedding: embedding },
    })

    return NextResponse.json({ message: 'Face enrolled successfully' })
  } catch (err) {
    console.error('[FACE ENROLL ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { faceEmbedding: [] },
    })
    return NextResponse.json({ message: 'Face data removed' })
  } catch (err) {
    console.error('[FACE DELETE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
