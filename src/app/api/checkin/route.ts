import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, deviceId } = body

    if (!token) {
      return apiError('QR token is required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    // Find the QR token
    const qrToken = await prisma.qRToken.findUnique({ where: { token } })

    if (!qrToken) {
      return apiError('Invalid QR code', ErrorCode.QR_INVALID, 400)
    }

    if (qrToken.used) {
      return apiError('QR code already used', ErrorCode.QR_USED, 400)
    }

    if (new Date() > qrToken.expiresAt) {
      return apiError('QR code has expired', ErrorCode.QR_EXPIRED, 400)
    }

    // Check active membership
    const membership = await prisma.membership.findFirst({
      where: { userId: qrToken.userId, isActive: true },
    })

    if (!membership) {
      return apiError('No active membership found', ErrorCode.MEMBERSHIP_REQUIRED, 403)
    }

    if (new Date() > membership.endDate) {
      // Deactivate expired membership
      await prisma.membership.update({
        where: { id: membership.id },
        data: { isActive: false },
      })
      return apiError('Membership has expired', ErrorCode.MEMBERSHIP_EXPIRED, 403)
    }

    // Mark QR token as used
    await prisma.qRToken.update({
      where: { id: qrToken.id },
      data: { used: true },
    })

    // Create check-in log
    const checkIn = await prisma.checkInLog.create({
      data: {
        userId: qrToken.userId,
        qrToken: token,
        deviceId: deviceId || null,
        isValid: true,
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: qrToken.userId },
      select: { name: true, email: true },
    })

    return NextResponse.json({
      success: true,
      checkIn,
      user,
      message: `Welcome, ${user?.name}!`,
    })
  } catch (error) {
    console.error('[CHECKIN ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
