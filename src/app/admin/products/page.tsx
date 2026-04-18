'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { Plus, Search, Pencil, ToggleLeft, ToggleRight, Package } from 'lucide-react'
import type { Product } from '@/types'

const CATEGORIES = ['ALL', 'Supplements', 'Equipment', 'Apparel', 'Accessories', 'Other']
const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: 'Supplements',
  stock: '0',
}

export default function AdminProductsPage() {
  const { token } = useAuthStore()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    const params = new URLSearchParams({ search, category })
    const res = await fetch(`/api/admin/products?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setProducts(data.products ?? [])
    setIsLoading(false)
  }, [token, search, category])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [fetchProducts])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditTarget(p)
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl ?? '',
      category: p.category,
      stock: String(p.stock),
    })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      setError('Name, price, and category are required.')
      return
    }
    setSaving(true)
    setError('')

    const url = editTarget ? `/api/admin/products/${editTarget.id}` : '/api/products'
    const method = editTarget ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setSaving(false)
      return
    }

    setModalOpen(false)
    fetchProducts()
    setSaving(false)
  }

  const toggleActive = async (product: Product) => {
    await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive: !product.isActive }),
    })
    fetchProducts()
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-xl shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={16} />
          New Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              category === c
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">No products found</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                !p.isActive ? 'border-gray-100 opacity-60' : 'border-gray-100'
              }`}
            >
              <div className="p-4 flex items-start gap-3">
                {/* Icon / image */}
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package size={20} className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-900 truncate">{p.name}</span>
                    {!p.isActive && (
                      <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{p.category}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-sm font-bold text-green-600">${p.price.toFixed(2)}</span>
                    <span
                      className={`text-xs font-medium ${
                        p.stock === 0
                          ? 'text-red-500'
                          : p.stock < 10
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} in stock`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(p)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      p.isActive
                        ? 'bg-green-50 hover:bg-green-100 text-green-600'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-400'
                    }`}
                    title={p.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {p.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                {editTarget ? 'Edit Product' : 'New Product'}
              </h2>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
              )}

              <div className="space-y-3">
                <Field label="Product Name *">
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-base"
                    placeholder="e.g. Whey Protein 1kg"
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="input-base resize-none"
                    rows={2}
                    placeholder="Short description…"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Price ($) *">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input-base"
                      placeholder="29.99"
                    />
                  </Field>
                  <Field label="Stock">
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="input-base"
                    />
                  </Field>
                </div>
                <Field label="Category *">
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-base"
                  >
                    {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Image URL">
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className="input-base"
                    placeholder="https://…"
                  />
                </Field>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          background: white;
          outline: none;
        }
        .input-base:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 2px #bbf7d0;
        }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
