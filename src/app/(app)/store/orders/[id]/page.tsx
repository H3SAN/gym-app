'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order, OrderItem, Product, OrderStatus } from '@/types'
import Image from 'next/image'
import Badge from '@/components/ui/Badge'
import {
  ArrowLeft,
  Package,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  PartyPopper,
} from 'lucide-react'

type PopulatedOrder = Order & {
  items: (OrderItem & { product: Product })[]
  shippingName?: string | null
  shippingLine1?: string | null
  shippingCity?: string | null
  shippingState?: string | null
  shippingPostal?: string | null
  shippingCountry?: string | null
}

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'PENDING',   label: 'Order placed',     icon: Clock        },
  { status: 'PAID',      label: 'Payment confirmed', icon: CheckCircle2 },
  { status: 'SHIPPED',   label: 'Shipped',           icon: Truck        },
  { status: 'DELIVERED', label: 'Delivered',         icon: PartyPopper  },
]

const STATUS_ORDER: OrderStatus[] = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED']

const STATUS_BADGE: Record<OrderStatus, { label: string; variant: 'green' | 'gray' | 'red' | 'blue' }> = {
  PENDING:   { label: 'Pending',   variant: 'gray'  },
  PAID:      { label: 'Paid',      variant: 'green' },
  SHIPPED:   { label: 'Shipped',   variant: 'blue'  },
  DELIVERED: { label: 'Delivered', variant: 'green' },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justPaid = searchParams.get('paid') === '1'

  const { token } = useAuthStore()
  const [order, setOrder] = useState<PopulatedOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !id) return
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.orders as PopulatedOrder[])?.find((o) => o.id === id) ?? null
        setOrder(found)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="h-24 bg-gray-100" />
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl w-1/2" />
          <div className="h-20 bg-gray-100 rounded-2xl" />
          <div className="h-32 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400">Order not found</p>
        <button onClick={() => router.back()} className="text-green-600 text-sm font-medium">
          Go back
        </button>
      </div>
    )
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const { label: badgeLabel, variant: badgeVariant } = STATUS_BADGE[order.status] ?? STATUS_BADGE.PENDING

  const hasShipping = order.shippingName || order.shippingLine1

  return (
    <div className="min-h-full bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100 px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Order Details</h1>
            <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
          </div>
          <div className="ml-auto">
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Just-paid banner */}
        {justPaid && (
          <div className="bg-green-600 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-white flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">Payment successful!</p>
              <p className="text-xs text-white/80 mt-0.5">
                Thank you for your order. We&apos;ll notify you when it ships.
              </p>
            </div>
          </div>
        )}

        {/* Status tracker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Status</h2>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />

            <div className="space-y-5">
              {STATUS_STEPS.map(({ status, label, icon: Icon }, i) => {
                const isDone = i <= currentStatusIndex
                const isCurrent = i === currentStatusIndex
                return (
                  <div key={status} className="flex items-start gap-4 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                        isDone
                          ? 'bg-green-600 shadow-sm'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Icon size={15} className={isDone ? 'text-white' : 'text-gray-400'} />
                    </div>
                    <div className="pt-0.5">
                      <p className={`text-sm font-semibold ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                        {label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">Current status</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Items ({order.items.length})
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package size={18} className="text-green-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {item.product?.name ?? 'Product'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Order Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Shipping</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(Math.max(0, order.total - order.items.reduce((s, i) => s + i.price * i.quantity, 0)))}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-base font-bold text-green-600">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Shipping Address */}
        {hasShipping && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={15} className="text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Shipping address</h2>
            </div>
            <p className="text-sm font-medium text-gray-900">{order.shippingName}</p>
            <p className="text-sm text-gray-500 mt-0.5">{order.shippingLine1}</p>
            <p className="text-sm text-gray-500">
              {order.shippingCity}, {order.shippingState} {order.shippingPostal}
            </p>
            <p className="text-sm text-gray-500">{order.shippingCountry}</p>
          </div>
        )}

        {/* Order ID reference */}
        <p className="text-center text-xs text-gray-300 pb-2">
          Order ID: {order.id}
        </p>
      </div>
    </div>
  )
}
