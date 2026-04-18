'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Order, OrderItem, Product, OrderStatus } from '@/types'
import { ArrowLeft, Package, ChevronRight, ShoppingBag } from 'lucide-react'
import Badge from '@/components/ui/Badge'

type PopulatedOrder = Order & {
  items: (OrderItem & { product: Product })[]
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'green' | 'gray' | 'red' | 'blue' }> = {
  PENDING:   { label: 'Pending',   variant: 'gray'  },
  PAID:      { label: 'Paid',      variant: 'green' },
  SHIPPED:   { label: 'Shipped',   variant: 'blue'  },
  DELIVERED: { label: 'Delivered', variant: 'green' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [orders, setOrders] = useState<PopulatedOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100 px-4 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 gap-5">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag size={36} className="text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">Your purchase history will appear here.</p>
            </div>
            <button
              onClick={() => router.push('/store')}
              className="text-green-600 text-sm font-semibold hover:underline"
            >
              Browse the store
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const { label, variant } = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING
              const firstItem = order.items[0]
              const extraCount = order.items.length - 1

              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/store/orders/${order.id}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  {/* Product thumbnail */}
                  <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={24} className="text-green-300" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={variant}>{label}</Badge>
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {firstItem?.product?.name ?? 'Order'}
                      {extraCount > 0 && (
                        <span className="text-gray-400 font-normal"> +{extraCount} more</span>
                      )}
                    </p>
                    <p className="text-sm font-bold text-green-600 mt-0.5">
                      {formatCurrency(order.total)}
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
