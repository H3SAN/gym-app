import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { signToken } from '@/lib/jwt'
import { apiError, ErrorCode } from '@/lib/api-error'
import { rateLimits, rateLimitError } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const rl = rateLimits.strict(request, 'signup')
  if (!rl.allowed) return rateLimitError()

  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return apiError('All fields are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', ErrorCode.VALIDATION_INVALID, 400)
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return apiError('Invalid email address', ErrorCode.VALIDATION_INVALID, 400)
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return apiError('Email already registered', ErrorCode.AUTH_EMAIL_EXISTS, 409)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        memberships: {
          create: {
            tier: 'BASIC',
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true,
            autoRenew: true,
          },
        },
      },
      include: {
        memberships: {
          where: { isActive: true },
          take: 1,
        },
      },
    })

    const token = await signToken({ userId: user.id, email: user.email, role: user.role })

    const { passwordHash: _, ...safeUser } = user

    return NextResponse.json({
      token,
      user: {
        ...safeUser,
        membership: safeUser.memberships[0] || null,
      },
    })
  } catch (error) {
    console.error('[SIGNUP ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
