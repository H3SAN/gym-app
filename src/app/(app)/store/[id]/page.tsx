'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { useCart } from '@/hooks/useCart'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'
import Image from 'next/image'
import { ArrowLeft, ShoppingCart, Star, Package } from 'lucide-react'

const SIZE_OPTIONS = [
  { label: '500g', price: 0 },
  { label: '1kg', price: 10 },
  { label: '2kg', price: 18 },
  { label: '2.5kg', price: 24 },
]

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { token } = useAuthStore()
  const { addItem, items } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')
  const [selectedSize, setSelectedSize] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  const hasSize = product?.category === 'Supplements'
  const cartItem = items.find((i) => i.product.id === id)

  useEffect(() => {
    if (!token || !id) return
    fetch(`/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setProduct(data.product || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token, id])

  const handleAddToCart = () => {
    if (!product) return
    const adjustedProduct = hasSize
      ? { ...product, price: product.price + SIZE_OPTIONS[selectedSize].price }
      : product
    addItem(adjustedProduct)
    setToast('Added to cart!')
    setTimeout(() => setToast(null), 2000)
  }

  const finalPrice = product
    ? product.price + (hasSize ? SIZE_OPTIONS[selectedSize].price : 0)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white animate-pulse">
        <div className="h-72 bg-gray-100" />
        <div className="p-4 space-y-4">
          <div className="h-7 bg-gray-100 rounded-xl w-3/4" />
          <div className="h-5 bg-gray-100 rounded w-1/3" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400">Product not found</p>
        <button onClick={() => router.back()} className="text-green-600 text-sm font-medium">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-white pb-24">
      {/* Product Image */}
      <div className="relative bg-green-50 h-64">
        <button
          onClick={() => router.back()}
          className="absolute top-10 left-4 z-10 w-9 h-9 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>

        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package size={64} className="text-green-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-bold text-gray-900 flex-1">{product.name}</h1>
          <div className="flex flex-col items-end gap-1">
            {product.stock > 0 ? (
              <Badge variant="green">In stock</Badge>
            ) : (
              <Badge variant="red">Out of stock</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <p className="text-xs text-gray-400 capitalize">{product.category}</p>
          <span className="text-gray-200">·</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={12} className={s <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
            ))}
            <span className="text-xs text-gray-400 ml-1">4.8 (128)</span>
          </div>
        </div>

        <p className="text-2xl font-bold text-green-600 mb-5">{formatCurrency(finalPrice)}</p>

        {/* Size selector (for supplements) */}
        {hasSize && (
          <div className="mb-5">
            <p className="text-sm font-semibold text-gray-900 mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {SIZE_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedSize(idx)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedSize === idx
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {opt.label}
                  {opt.price > 0 && <span className="ml-1 opacity-70 text-xs">+{formatCurrency(opt.price)}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-100 mb-4">
          {(['description', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'description' ? (
          <p className="text-sm text-gray-500 leading-relaxed">{product.description}</p>
        ) : (
          <div className="space-y-4">
            {[
              { name: 'Alex M.', rating: 5, text: 'Excellent quality! Really helped with my training goals.' },
              { name: 'Sarah K.', rating: 4, text: 'Good product, ships quickly. Will buy again.' },
            ].map((review) => (
              <div key={review.name} className="border-b border-gray-50 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={10} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{review.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 pt-3">
        <div className="flex gap-3">
          <button
            onClick={handleAddToCart}
            className="w-12 h-12 rounded-xl border-2 border-green-600 flex items-center justify-center hover:bg-green-50 transition-colors flex-shrink-0"
          >
            <ShoppingCart size={18} className="text-green-600" />
            {cartItem && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-green-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartItem.quantity}
              </span>
            )}
          </button>
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={product.stock <= 0}
            onClick={handleAddToCart}
          >
            Add to Cart · {formatCurrency(finalPrice)}
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-2xl text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
