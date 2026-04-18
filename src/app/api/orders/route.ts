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
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[ORDERS GET ERROR]', err)
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
    const { items, total } = body as {
      items: { productId: string; quantity: number; price: number }[]
      total: number
    }

    if (!items || items.length === 0) {
      return apiError('No items provided', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    // Create order + items + decrement stock atomically inside a single transaction.
    // Stock check and decrement are combined into one conditional update so concurrent
    // requests cannot both pass the check and oversell the same stock.
    const order = await prisma.$transaction(async (tx) => {
      // 1. Lock + validate each product, use server prices (prevents price manipulation)
      const productIds = items.map((i) => i.productId)
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        select: { id: true, name: true, price: true, stock: true },
      })

      if (products.length !== items.length) {
        throw new Error('One or more products not found or inactive')
      }

      const productMap = new Map(products.map((p) => [p.id, p]))

      // 2. Atomic conditional decrement — only succeeds if stock is sufficient
      for (const item of items) {
        const product = productMap.get(item.productId)!
        const result = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        })
        if (result.count === 0) {
          throw new Error(`Insufficient stock for "${product.name}"`)
        }
      }

      // 3. Compute server-side total to prevent price manipulation
      const serverTotal = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!
        return sum + product.price * item.quantity
      }, 0)

      // 4. Create order with server-validated prices
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total: serverTotal,
          status: 'PENDING',
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: productMap.get(i.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      })

      // 5. Clear user's cart items for these products
      await tx.cartItem.deleteMany({
        where: {
          userId: user.id,
          productId: { in: productIds },
        },
      })

      return newOrder
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.startsWith('Insufficient stock') || msg.includes('not found or inactive')) {
      return apiError(msg, ErrorCode.VALIDATION_INVALID, 400)
    }
    console.error('[ORDERS POST ERROR]', err)
    return apiError('Internal server error', ErrorCode.INTERNAL_ERROR, 500)
  }
}
