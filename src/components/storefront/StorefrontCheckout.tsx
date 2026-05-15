'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ShieldCheck, Lock, ShoppingBag, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Store {
  id: string
  name: string
  slug: string
  logo?: string | null
  primaryColor: string
  currency: string
  description?: string | null
  theme?: string | null
}

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  return `${symbols[currency] || currency} ${price.toFixed(2)}`
}

export default function StorefrontCheckout({ store }: { store: Store }) {
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState<any>(null)
  const [error, setError] = useState('')
  const [discountCode, setDiscountCode] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    paymentMethod: 'ONLINE'
  })

  useEffect(() => {
    // Load cart from local storage
    const savedCart = localStorage.getItem('online-vepar-cart')
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        setCart([])
      }
    }
    setLoading(false)
  }, [])

  const primary = store.primaryColor || '#10b981'
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  const total = subtotal // Discount logic to be added later if needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (formData.paymentMethod === 'ONLINE') {
        // Simulate Razorpay Gateway Delay
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      const res = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          items: cart.map(c => ({ productId: c.product.id, quantity: c.quantity })),
          customer: formData,
          discountCode: discountCode || undefined
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order')
      }

      setOrderComplete(data.order)
      localStorage.removeItem('online-vepar-cart')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
  }

  const themeClass = `theme-${store.theme || 'modern'}`

  if (orderComplete) {
    return (
      <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex flex-col items-center justify-center p-4 ${themeClass}`}>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Order Confirmed!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Thank you for your purchase. Your order number is <strong className="text-slate-900 dark:text-slate-100">#{orderComplete.orderNumber}</strong>.</p>
          <div className="bg-slate-50/50 dark:bg-zinc-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-white/10 flex justify-between items-center text-left">
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="font-bold text-lg">{formatPrice(orderComplete.total, store.currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-bold text-lg">Cash on Delivery</p>
            </div>
          </div>
          <Link href={`/store/${store.slug}`} className="inline-block w-full py-4 rounded-xl text-white font-bold text-lg transition-transform hover:scale-[1.02]" style={{ background: primary }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex flex-col items-center justify-center p-4 ${themeClass}`}>
        <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
        <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-slate-100">Your cart is empty</h1>
        <Link href={`/store/${store.slug}`} className="px-8 py-3 rounded-xl text-white font-bold" style={{ background: primary }}>Go to Store</Link>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] selection:bg-[#0052FF]/30 ${themeClass}`}>
      {/* Checkout Header */}
      <header className="border-b border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-50 py-6 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-3">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ background: primary }}>{store.name[0]}</div>
            )}
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">{store.name}</h1>
          </Link>
          <Link href={`/store/${store.slug}`} className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
            <ArrowLeft size={16} /> Back to Store
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row min-h-[calc(100vh-89px)]">
        
        {/* LEFT COLUMN - FORM */}
        <div className="w-full md:w-3/5 p-4 md:p-12 bg-transparent">
          <form onSubmit={handleSubmit} className="max-w-xl">
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Contact</h2>
              <input 
                type="email" 
                required 
                placeholder="Email address" 
                className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                style={{ '--tw-ring-color': primary } as any}
                value={formData.email}
                onChange={e => setFormData(p => ({...p, email: e.target.value}))}
              />
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Delivery</h2>
              <div className="space-y-4">
                <input 
                  type="text" 
                  required 
                  placeholder="Full Name" 
                  className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                  style={{ '--tw-ring-color': primary } as any}
                  value={formData.name}
                  onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                />
                <input 
                  type="text" 
                  required 
                  placeholder="Address" 
                  className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                  style={{ '--tw-ring-color': primary } as any}
                  value={formData.address}
                  onChange={e => setFormData(p => ({...p, address: e.target.value}))}
                />
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    required 
                    placeholder="City" 
                    className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                    style={{ '--tw-ring-color': primary } as any}
                    value={formData.city}
                    onChange={e => setFormData(p => ({...p, city: e.target.value}))}
                  />
                  <input 
                    type="text" 
                    required 
                    placeholder="State" 
                    className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                    style={{ '--tw-ring-color': primary } as any}
                    value={formData.state}
                    onChange={e => setFormData(p => ({...p, state: e.target.value}))}
                  />
                  <input 
                    type="text" 
                    required 
                    placeholder="PIN Code" 
                    className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                    style={{ '--tw-ring-color': primary } as any}
                    value={formData.zip}
                    onChange={e => setFormData(p => ({...p, zip: e.target.value}))}
                  />
                </div>
                <input 
                  type="tel" 
                  required 
                  placeholder="Phone number" 
                  className="w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 transition-all shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                  style={{ '--tw-ring-color': primary } as any}
                  value={formData.phone}
                  onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-slate-100">Payment Method</h2>
              <div className="space-y-3">
                <label onClick={() => setFormData(p => ({...p, paymentMethod: 'ONLINE'}))} className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm ${formData.paymentMethod === 'ONLINE' ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200/60 dark:border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'ONLINE' ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {formData.paymentMethod === 'ONLINE' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                    </div>
                    <span className={`font-bold ${formData.paymentMethod === 'ONLINE' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>Online Payment (Razorpay / UPI / Cards)</span>
                  </div>
                  <ShieldCheck className={formData.paymentMethod === 'ONLINE' ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'} />
                </label>
                
                <label onClick={() => setFormData(p => ({...p, paymentMethod: 'COD'}))} className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-colors bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm ${formData.paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-200/60 dark:border-white/10'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'COD' ? 'border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {formData.paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                    </div>
                    <span className={`font-bold ${formData.paymentMethod === 'COD' ? 'text-blue-900 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>Cash on Delivery (COD)</span>
                  </div>
                </label>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1"><Lock size={14} /> Your data is securely encrypted.</p>
            </div>

            {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 rounded-xl mb-6 font-medium">{error}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full h-16 rounded-xl text-white font-black text-xl shadow-xl transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
              style={{ background: primary }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> 
                  {formData.paymentMethod === 'ONLINE' ? 'Processing Payment...' : 'Completing Order...'}
                </>
              ) : (
                formData.paymentMethod === 'ONLINE' ? `Pay ${formatPrice(total, store.currency)}` : 'Complete Order'
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN - SUMMARY */}
        <div className="w-full md:w-2/5 p-4 md:p-12 bg-slate-50/50 dark:bg-zinc-900/50 border-l border-slate-200/60 dark:border-white/10">
          <div className="sticky top-12">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              {cart.map((item, i) => {
                let img = ''
                try { img = JSON.parse(item.product.images)[0] } catch {}
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-white/80 dark:bg-zinc-800/80 rounded-lg border border-slate-200/60 dark:border-white/10 flex-shrink-0">
                      {img && <img src={img} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />}
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{item.quantity}</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm line-clamp-2 text-slate-900 dark:text-slate-100">{item.product.name}</p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.product.price * item.quantity, store.currency)}</p>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 mb-8">
              <input 
                type="text" 
                placeholder="Discount code" 
                className="flex-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-xl px-4 py-3 outline-none shadow-[0_4px_12px_rgb(0,0,0,0.02)] text-slate-900 dark:text-slate-100"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value)}
              />
              <button type="button" className="px-6 rounded-xl bg-slate-200 dark:bg-zinc-800 font-bold hover:bg-slate-300 dark:hover:bg-zinc-700 transition-colors text-slate-900 dark:text-slate-100 shadow-[0_4px_12px_rgb(0,0,0,0.02)]">Apply</button>
            </div>

            <div className="border-t border-slate-200/60 dark:border-white/10 pt-4 space-y-3">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, store.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                <span className="text-blue-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-black text-2xl pt-3 border-t border-slate-200/60 dark:border-white/10 mt-3 text-slate-900 dark:text-slate-100">
                <span>Total</span>
                <span>{formatPrice(total, store.currency)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
