import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      instructorName,
      instructorPhoto,
      startTime,
      endTime,
      capacity,
      difficulty,
      isPro,
      location,
    } = body

    const gymClass = await prisma.class.findUnique({ where: { id: params.id } })
    if (!gymClass) {
      return apiError('Class not found', ErrorCode.NOT_FOUND, 404)
    }
    if (gymClass.isCancelled) {
      return apiError('Cannot edit a cancelled class', ErrorCode.BOOKING_CONFLICT, 409)
    }

    const updated = await prisma.class.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(instructorName && { instructorName }),
        ...(instructorPhoto !== undefined && { instructorPhoto }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(difficulty && { difficulty }),
        ...(isPro !== undefined && { isPro }),
        ...(location && { location }),
      },
    })

    return NextResponse.json({ class: updated })
  } catch (err) {
    console.error('[ADMIN CLASS UPDATE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const gymClass = await prisma.class.findUnique({ where: { id: params.id } })
    if (!gymClass) {
      return apiError('Class not found', ErrorCode.NOT_FOUND, 404)
    }
    if (gymClass.isCancelled) {
      return apiError('Class is already cancelled', ErrorCode.BOOKING_CONFLICT, 409)
    }

    // Mark class as cancelled and cancel all confirmed bookings atomically
    await prisma.$transaction([
      prisma.class.update({
        where: { id: params.id },
        data: { isCancelled: true },
      }),
      prisma.booking.updateMany({
        where: { classId: params.id, status: 'CONFIRMED' },
        data: { status: 'CANCELLED' },
      }),
    ])

    return NextResponse.json({ message: 'Class cancelled' })
  } catch (err) {
    console.error('[ADMIN CLASS CANCEL ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
