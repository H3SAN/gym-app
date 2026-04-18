'use client'

import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  return (
    <Link href={`/store/${product.id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="aspect-square bg-green-50 border-b border-green-100 relative overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingCart size={32} className="text-green-300" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
            {product.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{product.category}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm font-bold text-green-600">{formatCurrency(product.price)}</p>
            <button
              onClick={(e) => {
                e.preventDefault()
                addItem(product)
              }}
              className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 active:scale-95 transition-all"
            >
              <span className="text-white text-lg leading-none mb-0.5">+</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
