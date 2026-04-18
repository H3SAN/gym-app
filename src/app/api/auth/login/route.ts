import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { apiError, ErrorCode } from '@/lib/api-error'
import { rateLimits, rateLimitError } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rl = rateLimits.login(request)
  if (!rl.allowed) return rateLimitError()

  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError('Email and password are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { isActive: true, endDate: { gte: new Date() } },
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!user) {
      return apiError('Invalid email or password', ErrorCode.AUTH_INVALID_CREDENTIALS, 401)
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return apiError('Invalid email or password', ErrorCode.AUTH_INVALID_CREDENTIALS, 401)
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role })

    const { passwordHash: _, faceEmbedding, ...safeUser } = user

    return NextResponse.json({
      token,
      user: {
        ...safeUser,
        membership: safeUser.memberships[0] || null,
        faceEnrolled: faceEmbedding.length > 0,
      },
    })
  } catch (error) {
    console.error('[LOGIN ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
