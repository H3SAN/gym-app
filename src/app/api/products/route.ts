import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: Record<string, unknown> = { isActive: true }
    if (category && category !== 'ALL') {
      where.category = category
    }
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
  } catch (error) {
    console.error('[PRODUCTS GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin(request)
  if (error || !user) {
    return apiError(error || 'Forbidden', ErrorCode.AUTH_FORBIDDEN, 403)
  }

  try {
    const body = await request.json()
    const { name, description, price, imageUrl, category, stock } = body

    if (!name || !price || !category) {
      return apiError('Missing required fields', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return apiError('Price must be a non-negative number', ErrorCode.VALIDATION_INVALID, 400)
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: parsedPrice,
        imageUrl,
        category,
        stock: stock || 0,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('[PRODUCT CREATE ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
