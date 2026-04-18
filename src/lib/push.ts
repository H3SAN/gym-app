import webpush from 'web-push'
import prisma from './prisma'

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

/**
 * Send a push notification to a single user.
 * Silently removes stale subscriptions (410 Gone).
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const staleIds: string[] = []

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await initWebPush().sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          staleIds.push(sub.id)
        }
      }
    })
  )

  if (staleIds.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: staleIds } } })
  }
}

/**
 * Send a push notification to all users who have a booking for a class
 * starting within the next `withinMinutes` minutes.
 */
export async function sendClassReminders(withinMinutes = 60) {
  const now = new Date()
  const soon = new Date(now.getTime() + withinMinutes * 60 * 1000)

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      class: {
        startTime: { gte: now, lte: soon },
        isCancelled: false,
      },
    },
    include: { class: true },
  })

  await Promise.allSettled(
    bookings.map((booking) =>
      sendPushToUser(booking.userId, {
        title: 'Class starting soon!',
        body: `${booking.class.name} starts in ${withinMinutes} minutes.`,
        url: '/classes',
      })
    )
  )
}
