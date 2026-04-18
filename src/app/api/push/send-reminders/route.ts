import { NextRequest, NextResponse } from 'next/server'
import { sendClassReminders } from '@/lib/push'
import { apiError, ErrorCode } from '@/lib/api-error'

/**
 * POST /api/push/send-reminders
 * Sends push notifications for classes starting within the next 60 minutes.
 * Protected by a shared secret — call this from a cron job:
 *   curl -X POST https://yourdomain.com/api/push/send-reminders \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return apiError('Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    await sendClassReminders(60)
    return NextResponse.json({ message: 'Reminders sent' })
  } catch (err) {
    console.error('[SEND REMINDERS ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
