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
    const { endpoint, keys } = await request.json()

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return apiError('Invalid subscription data', ErrorCode.VALIDATION_INVALID, 400)
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    })

    return NextResponse.json({ message: 'Subscribed successfully' })
  } catch (err) {
    console.error('[PUSH SUBSCRIBE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
