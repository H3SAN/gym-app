import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import prisma from '@/lib/prisma'
import type { MembershipTier } from '@prisma/client'
import { apiError, ErrorCode } from '@/lib/api-error'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
}

/**
 * Stripe requires the raw body for signature verification.
 * Next.js App Router exposes request.text() for this.
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return apiError('Missing stripe-signature header', ErrorCode.VALIDATION_REQUIRED, 400)
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[WEBHOOK SIGNATURE ERROR]', err)
    return apiError('Invalid signature', ErrorCode.VALIDATION_INVALID, 400)
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent

        // ── Membership upgrade ────────────────────────────────────────────────
        if (intent.metadata?.type === 'membership_upgrade') {
          const { userId, upgradeTo } = intent.metadata

          const existing = await prisma.membership.findFirst({
            where: { userId, isActive: true },
          })

          if (!existing || existing.tier !== upgradeTo) {
            await prisma.$transaction(async (tx) => {
              // Deactivate all current memberships
              await tx.membership.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false },
              })

              // Create new membership (30-day billing cycle)
              const start = new Date()
              const end = new Date(start)
              end.setDate(end.getDate() + 30)

              await tx.membership.create({
                data: {
                  userId,
                  tier: upgradeTo as MembershipTier,
                  startDate: start,
                  endDate: end,
                  isActive: true,
                  autoRenew: true,
                },
              })
            })

            console.log(`[WEBHOOK] Membership upgraded to ${upgradeTo} for user ${userId}`)
          }
          break
        }

        // ── Product order ─────────────────────────────────────────────────────
        const order = await prisma.order.findUnique({
          where: { paymentIntentId: intent.id },
          include: { items: true },
        })

        if (!order) {
          console.warn('[WEBHOOK] No order found for paymentIntentId:', intent.id)
          break
        }

        if (order.status === 'PAID') break // Idempotency guard

        // Mark order PAID + decrement stock + clear DB cart — all in one transaction
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: 'PAID' },
          })

          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            })
          }

          await tx.cartItem.deleteMany({
            where: {
              userId: order.userId,
              productId: { in: order.items.map((i) => i.productId) },
            },
          })
        })

        console.log(`[WEBHOOK] Order ${order.id} marked PAID`)
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent

        const order = await prisma.order.findUnique({
          where: { paymentIntentId: intent.id },
        })

        if (order && order.status === 'PENDING') {
          // Cancel the pending order so stock is not reserved
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'PENDING' }, // keep PENDING — user may retry
          })
          console.log(`[WEBHOOK] Payment failed for order ${order.id}`)
        }
        break
      }

      default:
        // Unhandled event type — fine to ignore
        break
    }
  } catch (err) {
    console.error('[WEBHOOK HANDLER ERROR]', err)
    return apiError('Webhook handler failed', ErrorCode.INTERNAL_ERROR, 500)
  }

  return NextResponse.json({ received: true })
}
