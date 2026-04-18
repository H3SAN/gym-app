'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import ProductCard from '@/components/store/ProductCard'
import Input from '@/components/ui/Input'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types'
import { Search, ShoppingCart, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = ['ALL', 'Supplements', 'Equipment', 'Apparel', 'Accessories']

export default function StorePage() {
  const { token } = useAuthStore()
  const { itemCount } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'ALL') params.set('category', category)

      const res = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [token, category]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 pt-10 pb-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Store</h1>
          <Link href="/store/cart" className="relative w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ShoppingCart size={18} className="text-gray-600" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); fetchProducts() }}
          className="flex gap-2"
        >
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <button
            type="button"
            className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-green-700 transition-colors"
          >
            <SlidersHorizontal size={18} className="text-white" />
          </button>
        </form>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-3 pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                category === cat
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">Products</p>
          {!loading && (
            <p className="text-xs text-gray-400">{products.length} items</p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-400 text-sm">No products found</p>
            <button
              onClick={() => { setSearch(''); setCategory('ALL') }}
              className="text-green-600 text-sm font-medium mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
