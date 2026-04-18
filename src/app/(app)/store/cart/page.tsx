'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/components/auth/AuthProvider'
import { useCart } from '@/hooks/useCart'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  CreditCard,
  ChevronRight,
} from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'cart' | 'address' | 'payment' | 'confirmation'

interface ShippingAddress {
  name: string
  line1: string
  city: string
  state: string
  postal: string
  country: string
}

const EMPTY_ADDRESS: ShippingAddress = {
  name: '',
  line1: '',
  city: '',
  state: '',
  postal: '',
  country: 'US',
}

// ─── Payment Form (must live inside <Elements>) ────────────────────────────────

interface PaymentFormProps {
  orderId: string
  onSuccess: () => void
  onBack: () => void
}

function PaymentForm({ orderId, onSuccess, onBack }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handlePay = async () => {
    if (!stripe || !elements) return
    setErrorMsg(null)
    setPaying(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We handle redirect ourselves via return_url but rely on onSuccess for in-app flow
        return_url: `${window.location.origin}/store/orders/${orderId}?paid=1`,
      },
      redirect: 'if_required',
    })

    if (error) {
      setErrorMsg(error.message || 'Payment failed. Please try again.')
      setPaying(false)
    } else {
      // Payment succeeded without redirect
      onSuccess()
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-green-600" />
          <h2 className="text-sm font-semibold text-gray-900">Payment details</h2>
        </div>
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'never' } },
          }}
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {errorMsg}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 font-medium hover:text-gray-700 px-2"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <Button
          variant="primary"
          fullWidth
          size="lg"
          loading={paying}
          disabled={!stripe || !elements}
          onClick={handlePay}
        >
          Pay now
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const { token } = useAuthStore()
  const { items, updateQuantity, removeItem, clearCart } = useCart()

  const [step, setStep] = useState<Step>('cart')
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS)
  const [addressErrors, setAddressErrors] = useState<Partial<ShippingAddress>>({})
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const shipping = subtotal > 50 ? 0 : 5.99
  const total = subtotal + shipping

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Step helpers ────────────────────────────────────────────────────────────

  const validateAddress = (): boolean => {
    const errs: Partial<ShippingAddress> = {}
    if (!address.name.trim()) errs.name = 'Required'
    if (!address.line1.trim()) errs.line1 = 'Required'
    if (!address.city.trim()) errs.city = 'Required'
    if (!address.postal.trim()) errs.postal = 'Required'
    setAddressErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleProceedToPayment = useCallback(async () => {
    if (!validateAddress() || !token) return
    setCreatingIntent(true)
    try {
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            price: i.product.price,
          })),
          total,
          shipping: address,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Could not start payment', 'error')
        return
      }
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
      setStep('payment')
    } catch {
      showToast('Something went wrong', 'error')
    } finally {
      setCreatingIntent(false)
    }
  }, [token, items, total, address]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePaymentSuccess = () => {
    clearCart()
    setStep('confirmation')
  }

  // ── Step indicator ──────────────────────────────────────────────────────────

  const steps: { key: Step; label: string }[] = [
    { key: 'cart', label: 'Cart' },
    { key: 'address', label: 'Address' },
    { key: 'payment', label: 'Payment' },
  ]

  const stepIndex = steps.findIndex((s) => s.key === step)

  // ── Render ──────────────────────────────────────────────────────────────────

  if (step === 'confirmation') {
    return (
      <div className="min-h-full bg-white flex flex-col items-center justify-center px-8 gap-6">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} className="text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">Order Placed!</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Payment successful. We&apos;ll prepare your order and let you know when it ships.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          {orderId && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push(`/store/orders/${orderId}`)}
            >
              View Order
            </Button>
          )}
          <Button variant="outline" fullWidth onClick={() => router.push('/store')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-gray-50 pb-36">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-gray-100 px-4 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step === 'cart' ? router.back() : setStep(step === 'payment' ? 'address' : 'cart'))}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 'cart' && 'My Cart'}
            {step === 'address' && 'Shipping Address'}
            {step === 'payment' && 'Payment'}
          </h1>
          {step === 'cart' && items.length > 0 && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          )}
        </div>

        {/* Step indicator */}
        {step !== 'confirmation' && (
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= stepIndex ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
                {i < steps.length - 1 && (
                  <ChevronRight size={10} className={i < stepIndex ? 'text-green-600' : 'text-gray-300'} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {/* ── Step 1: Cart Review ── */}
        {step === 'cart' && (
          <>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-20 gap-5">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingBag size={36} className="text-gray-300" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-gray-700">Your cart is empty</p>
                  <p className="text-sm text-gray-400 mt-1">Add products from the store to get started.</p>
                </div>
                <Button variant="primary" onClick={() => router.push('/store')}>
                  Browse Store
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-3 items-start"
                  >
                    <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Package size={24} className="text-green-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.product.category}</p>
                      <p className="text-sm font-bold text-green-600 mt-1">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus size={12} className="text-gray-600" />
                        </button>
                        <span className="text-sm font-bold text-gray-900 w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus size={12} className="text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Order Summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                  <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className={shipping === 0 ? 'font-medium text-green-600' : 'font-medium text-gray-900'}>
                      {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-400">
                      Add {formatCurrency(50 - subtotal)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-gray-100 pt-2 flex justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-green-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: Shipping Address ── */}
        {step === 'address' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-green-600" />
                <h2 className="text-sm font-semibold text-gray-900">Where should we ship?</h2>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full name</label>
                <Input
                  placeholder="Jane Smith"
                  value={address.name}
                  error={addressErrors.name}
                  onChange={(e) => setAddress((a) => ({ ...a, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Street address</label>
                <Input
                  placeholder="123 Main St"
                  value={address.line1}
                  error={addressErrors.line1}
                  onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">City</label>
                  <Input
                    placeholder="New York"
                    value={address.city}
                    error={addressErrors.city}
                    onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">State</label>
                  <Input
                    placeholder="NY"
                    value={address.state}
                    onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">ZIP code</label>
                  <Input
                    placeholder="10001"
                    value={address.postal}
                    error={addressErrors.postal}
                    onChange={(e) => setAddress((a) => ({ ...a, postal: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Country</label>
                  <Input
                    placeholder="US"
                    value={address.country}
                    onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Order total reminder */}
            <div className="bg-green-50 rounded-2xl border border-green-100 px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-green-700 font-medium">Total due</span>
              <span className="text-base font-bold text-green-700">{formatCurrency(total)}</span>
            </div>
          </div>
        )}

        {/* ── Step 3: Payment (Stripe Elements) ── */}
        {step === 'payment' && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#16a34a',
                  borderRadius: '12px',
                  fontFamily: 'inherit',
                },
              },
            }}
          >
            <div className="space-y-3">
              {/* Address summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={14} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{address.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {address.line1}, {address.city}, {address.state} {address.postal}
                  </p>
                </div>
              </div>

              <PaymentForm
                orderId={orderId!}
                onSuccess={handlePaymentSuccess}
                onBack={() => setStep('address')}
              />

              <p className="text-center text-xs text-gray-400">
                Secured by Stripe · SSL encrypted
              </p>
            </div>
          </Elements>
        )}
      </div>

      {/* Sticky CTAs */}
      {(step === 'cart' && items.length > 0) && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 pt-3 z-40">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => setStep('address')}
          >
            Proceed to Checkout · {formatCurrency(total)}
          </Button>
        </div>
      )}

      {step === 'address' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-3 bg-white/90 backdrop-blur-sm border-t border-gray-100 pt-3 z-40">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={creatingIntent}
            onClick={handleProceedToPayment}
          >
            Continue to Payment
          </Button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-36 left-1/2 -translate-x-1/2 w-72 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-white text-center z-50 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
