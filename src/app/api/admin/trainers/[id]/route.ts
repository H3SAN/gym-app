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
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    const data = await request.json()
    const trainer = await prisma.trainer.update({ where: { id: params.id }, data })
    return NextResponse.json({ trainer })
  } catch (err) {
    console.error('[TRAINER UPDATE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)

  try {
    await prisma.trainer.update({ where: { id: params.id }, data: { isActive: false } })
    return NextResponse.json({ message: 'Trainer deactivated' })
  } catch (err) {
    console.error('[TRAINER DELETE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
