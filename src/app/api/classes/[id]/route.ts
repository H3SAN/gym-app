import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendPushToUser } from '@/lib/push'
import { format } from 'date-fns'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const gymClass = await prisma.class.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { bookings: true } },
      },
    })

    if (!gymClass) {
      return apiError('Class not found', ErrorCode.NOT_FOUND, 404)
    }

    return NextResponse.json({ class: gymClass })
  } catch (error) {
    console.error('[CLASS GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const gymClass = await prisma.class.findUnique({ where: { id: params.id } })
    if (!gymClass) {
      return apiError('Class not found', ErrorCode.NOT_FOUND, 404)
    }

    if (gymClass.bookedCount >= gymClass.capacity) {
      return apiError('Class is full', ErrorCode.BOOKING_CAPACITY_FULL, 409)
    }

    // Check if class requires PRO membership
    if (gymClass.isPro) {
      const activeMembership = user.memberships[0]
      const isValid =
        activeMembership &&
        activeMembership.isActive &&
        new Date(activeMembership.endDate) > new Date() &&
        (activeMembership.tier === 'PRO' || activeMembership.tier === 'ELITE')
      if (!isValid) {
        return apiError(
          'This class requires a PRO or ELITE membership',
          ErrorCode.MEMBERSHIP_REQUIRED,
          403
        )
      }
    }

    // Check for existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { userId_classId: { userId: user.id, classId: params.id } },
    })

    if (existingBooking) {
      if (existingBooking.status === 'CANCELLED') {
        // Re-activate cancelled booking
        const booking = await prisma.booking.update({
          where: { id: existingBooking.id },
          data: { status: 'CONFIRMED', bookedAt: new Date() },
        })
        await prisma.class.update({
          where: { id: params.id },
          data: { bookedCount: { increment: 1 } },
        })
        return NextResponse.json({ booking, message: 'Booking confirmed' })
      }
      return apiError('Already booked this class', ErrorCode.BOOKING_CONFLICT, 409)
    }

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        classId: params.id,
        status: 'CONFIRMED',
      },
    })

    await prisma.class.update({
      where: { id: params.id },
      data: { bookedCount: { increment: 1 } },
    })

    // Fire-and-forget push notification — never block the response
    sendPushToUser(user.id, {
      title: 'Booking confirmed!',
      body: `${gymClass.name} on ${format(new Date(gymClass.startTime), 'EEE, MMM d @ h:mm a')}`,
      url: '/classes',
    }).catch(() => {})

    return NextResponse.json({ booking, message: 'Booking confirmed' }, { status: 201 })
  } catch (error) {
    console.error('[BOOKING ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
