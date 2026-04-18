import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { apiError, ErrorCode } from '@/lib/api-error'
import { rateLimits, rateLimitError } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const rl = rateLimits.strict(request, 'forgot-password')
  if (!rl.allowed) return rateLimitError()

  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return apiError('Email is required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })

    // Always return success — never reveal whether an email exists
    if (!user) {
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    })

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const resetUrl = `${appUrl}/reset-password?token=${token}`

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: 'Reset your Avengers Gym password',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <div style="background:#16a34a;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
            <span style="color:white;font-size:24px;font-weight:900;line-height:48px;display:block;text-align:center;">A</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Reset your password</h1>
          <p style="color:#6b7280;font-size:15px;margin:0 0 24px;">
            Hi ${user.name}, we received a request to reset your Avengers Gym password.
            Click the button below to choose a new one.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#16a34a;color:white;font-weight:600;font-size:15px;
                    padding:12px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:13px;margin:0;">
            This link expires in <strong>1 hour</strong>. If you didn't request a reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
          <p style="color:#d1d5db;font-size:12px;margin:0;">Avengers Gym · Powered by strength</p>
        </div>
      `,
    })

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  } catch (err) {
    console.error('[FORGOT PASSWORD ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
