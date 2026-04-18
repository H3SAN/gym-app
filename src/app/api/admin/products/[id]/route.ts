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
    const { name, description, price, imageUrl, category, stock, isActive } = body

    if (price !== undefined) {
      const parsedPrice = parseFloat(price)
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return apiError('Price must be a non-negative number', ErrorCode.VALIDATION_INVALID, 400)
      }
    }

    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) {
      return apiError('Product not found', ErrorCode.NOT_FOUND, 404)
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(category && { category }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({ product: updated })
  } catch (err) {
    console.error('[ADMIN PRODUCT UPDATE ERROR]', err)
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
    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) {
      return apiError('Product not found', ErrorCode.NOT_FOUND, 404)
    }

    // Soft-delete: deactivate rather than destroy (preserves order history)
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ product: updated, message: 'Product deactivated' })
  } catch (err) {
    console.error('[ADMIN PRODUCT DELETE ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
