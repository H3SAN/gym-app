import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return apiError('Token and password are required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    if (password.length < 8) {
      return apiError('Password must be at least 8 characters', ErrorCode.VALIDATION_INVALID, 400)
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return apiError('Invalid or expired reset link', ErrorCode.VALIDATION_INVALID, 400)
    }

    if (resetToken.used) {
      return apiError('This reset link has already been used', ErrorCode.VALIDATION_INVALID, 400)
    }

    if (new Date() > resetToken.expiresAt) {
      return apiError('This reset link has expired', ErrorCode.VALIDATION_INVALID, 400)
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ message: 'Password reset successfully. You can now sign in.' })
  } catch (err) {
    console.error('[RESET PASSWORD ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
