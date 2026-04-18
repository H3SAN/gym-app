import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { addedAt: 'desc' },
    })

    return NextResponse.json({ cartItems })
  } catch (error) {
    console.error('[CART GET ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return apiError('Product ID required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return apiError('Product not found', ErrorCode.NOT_FOUND, 404)
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: user.id, productId, quantity },
      include: { product: true },
    })

    return NextResponse.json({ cartItem }, { status: 201 })
  } catch (error) {
    console.error('[CART POST ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { productId, quantity } = body

    if (!productId || quantity === undefined) {
      return apiError('Product ID and quantity required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { userId: user.id, productId } })
      return NextResponse.json({ message: 'Item removed from cart' })
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      update: { quantity },
      create: { userId: user.id, productId, quantity },
      include: { product: true },
    })

    return NextResponse.json({ cartItem })
  } catch (error) {
    console.error('[CART PATCH ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return apiError('Product ID required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id, productId },
    })

    return NextResponse.json({ message: 'Item removed from cart' })
  } catch (error) {
    console.error('[CART DELETE ERROR]', error)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
