import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const { endpoint } = await request.json()

    if (!endpoint) {
      // Remove ALL subscriptions for this user
      await prisma.pushSubscription.deleteMany({ where: { userId: user.id } })
    } else {
      await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } })
    }

    return NextResponse.json({ message: 'Unsubscribed successfully' })
  } catch (err) {
    console.error('[PUSH UNSUBSCRIBE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
