import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (category && category !== 'ALL') where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ products })
  } catch (err) {
    console.error('[ADMIN PRODUCTS GET ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
