import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  const { action } = (await request.json()) as { action: 'approve' | 'reject' }
  if (action !== 'approve' && action !== 'reject') {
    return apiError('action must be approve or reject', ErrorCode.VALIDATION_INVALID, 400)
  }

  const existing = await prisma.checkInLog.findUnique({ where: { id: params.id } })
  if (!existing) {
    return apiError('Check-in not found', ErrorCode.NOT_FOUND, 404)
  }
  if (existing.status !== 'PENDING') {
    return apiError('Check-in already reviewed', ErrorCode.VALIDATION_INVALID, 409)
  }

  const updated = await prisma.checkInLog.update({
    where: { id: params.id },
    data: {
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      isValid: action === 'approve',
      reviewedAt: new Date(),
      reviewedBy: user.id,
    },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      user: { select: { name: true } },
    },
  })

  return NextResponse.json({ checkin: updated })
}
