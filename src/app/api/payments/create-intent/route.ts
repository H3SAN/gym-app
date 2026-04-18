import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

interface OrderItemInput {
  productId: string
  quantity: number
  price: number
}

interface ShippingAddress {
  name: string
  line1: string
  city: string
  state: string
  postal: string
  country: string
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request)
  if (error || !user) {
    return apiError(error || 'Unauthorized', ErrorCode.AUTH_REQUIRED, 401)
  }

  try {
    const body = await request.json()
    const { items, total, shipping } = body as {
      items: OrderItemInput[]
      total: number
      shipping: ShippingAddress
    }

    if (!items || items.length === 0) {
      return apiError('No items provided', ErrorCode.VALIDATION_REQUIRED, 400)
    }
    if (!shipping?.name || !shipping?.line1 || !shipping?.city || !shipping?.postal) {
      return apiError('Shipping address is required', ErrorCode.VALIDATION_REQUIRED, 400)
    }

    // Validate stock availability
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) {
        return apiError('Product not found', ErrorCode.NOT_FOUND, 404)
      }
      if (product.stock < item.quantity) {
        return apiError(`Insufficient stock for "${product.name}"`, ErrorCode.VALIDATION_INVALID, 400)
      }
    }

    // Create Stripe PaymentIntent (amount in cents)
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      metadata: { userId: user.id },
      automatic_payment_methods: { enabled: true },
    })

    // Create the Order (PENDING) with paymentIntentId and shipping info
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
        shippingName: shipping.name,
        shippingLine1: shipping.line1,
        shippingCity: shipping.city,
        shippingState: shipping.state,
        shippingPostal: shipping.postal,
        shippingCountry: shipping.country || 'US',
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (err) {
    console.error('[CREATE INTENT ERROR]', err)
    return apiError('Failed to create payment', ErrorCode.INTERNAL_ERROR, 500)
  }
}
