import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import QRCode from 'qrcode'
import { randomBytes } from 'crypto'
import { apiError, ErrorCode } from '@/lib/api-error'
import { rateLimits, rateLimitError } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  const rl = rateLimits.qr(user.id)
  if (!rl.allowed) return rateLimitError()

  try {
    // Clean up expired tokens
    await prisma.qRToken.deleteMany({
      where: { userId: user.id, expiresAt: { lt: new Date() } },
    })

    // Generate new QR token
    const randomHex = randomBytes(16).toString('hex')
    const timestamp = Date.now()
    const token = `${user.id}:${timestamp}:${randomHex}`
    const expiresAt = new Date(timestamp + 60 * 1000) // 60 seconds

    await prisma.qRToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        used: false,
      },
    })

    // Generate QR code as base64 PNG
    const qrCode = await QRCode.toDataURL(token, {
      width: 200,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })

    return NextResponse.json({ qrCode, expiresAt: expiresAt.toISOString() })
  } catch (error) {
    console.error('[QR ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
