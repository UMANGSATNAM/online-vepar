'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ChevronRight, X, Minus, Plus, Flame, Eye, Clock, CheckCircle2 } from 'lucide-react'
import ProductCard from '@/components/storefront/ProductCard'

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  return `${symbols[currency] || currency} ${price.toFixed(2)}`
}

export default function ProductPageClient({ 
  store, 
  product, 
  relatedProducts 
}: { 
  store: any
  product: any
  relatedProducts: any[]
}) {
  const [quantity, setQuantity] = useState(1)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [viewers] = useState(Math.floor(Math.random() * 40) + 10) // 10-50 viewers
  const [soldToday] = useState(Math.floor(Math.random() * 80) + 20) // 20-100 sold

  const stockLeft = product.stock > 0 && product.stock < 10 ? product.stock : 12 // Fake scarcity if stock is high
  
  const primary = store.primaryColor || '#10b981'
  let images: string[] = []
  try { images = JSON.parse(product.images) } catch {}
  if (images.length === 0) images = [''] // fallback placeholder

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0

  const themeClass = `theme-${store.theme || 'modern'}`

  return (
    <div className={`min-h-screen bg-gray-50 pb-32 ${themeClass}`}>
      {/* ── HEADER ── */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-2">
            {store.logo 
              ? <Image src={store.logo} alt={store.name} width={40} height={40} className="rounded-lg object-cover" />
              : <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ background: primary }}>{store.name[0]}</div>
            }
            <span className="font-bold text-xl text-gray-900">{store.name}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/store/${store.slug}`} className="text-sm font-medium text-gray-600 hover:text-gray-900">Back to Store</Link>
          </div>
        </div>
      </header>

      {/* ── BREADCRUMBS ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 text-sm text-gray-500 flex items-center gap-2">
        <Link href={`/store/${store.slug}`} className="hover:text-gray-900">Home</Link>
        <ChevronRight size={14} />
        {product.categoryRef && (
          <>
            <span>{product.categoryRef.name}</span>
            <ChevronRight size={14} />
          </>
        )}
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* ── IMAGE GALLERY ── */}
          <div className="md:w-1/2 p-4 md:p-8 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="relative aspect-square rounded-2xl bg-gray-50 overflow-hidden">
              {images[activeImageIndex] ? (
                <Image src={images[activeImageIndex]} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">Save {discount}%</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${activeImageIndex === i ? 'border-emerald-500' : 'border-transparent'}`}
                  >
                    <Image src={img} alt={`Thumbnail ${i}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── PRODUCT DETAILS ── */}
          <div className="md:w-1/2 p-6 md:p-10 flex flex-col">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>
            
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-black text-gray-900 tracking-tight">{formatPrice(product.price, store.currency)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <div className="flex flex-col">
                  <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(product.comparePrice, store.currency)}</span>
                  <span className="text-red-500 font-bold text-sm">Save {discount}%</span>
                </div>
              )}
            </div>

            {/* URGENCY CREATORS (1000x Optimized) */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg font-bold text-sm w-fit animate-pulse">
                <Flame size={16} /> High Demand! {soldToday} sold in the last 24 hours.
              </div>
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-bold text-sm w-fit">
                <Eye size={16} /> {viewers} people are viewing this right now.
              </div>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5"><Clock size={16}/> Hurry! Sale ends in:</span>
                  <span className="font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded">02:14:45</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2 mb-1">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-amber-800 font-semibold text-right">Only {stockLeft} items left in stock!</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-8 text-lg">{product.description || 'No description available for this product.'}</p>

            {/* Qty & Add to cart */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-200 rounded-xl h-14 w-32 bg-white">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-l-xl"><Minus size={18} /></button>
                  <span className="font-black text-lg w-10 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-r-xl"><Plus size={18} /></button>
                </div>
                <button 
                  disabled={product.stock === 0}
                  onClick={() => {
                    // Update cart logic
                    const currentCart = JSON.parse(localStorage.getItem('online-vepar-cart') || '[]')
                    const ex = currentCart.find((c: any) => c.product.id === product.id)
                    if (ex) {
                      ex.quantity += quantity
                    } else {
                      currentCart.push({ product, quantity })
                    }
                    localStorage.setItem('online-vepar-cart', JSON.stringify(currentCart))
                    window.dispatchEvent(new Event('storage'))
                    // Open cart
                  }}
                  className="flex-1 h-14 rounded-xl text-white font-black text-lg shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-b-4 border-black/20"
                  style={{ background: primary }}
                >
                  <ShoppingCart size={20} />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
              <Link 
                href={`/store/${store.slug}/checkout`}
                className={`flex items-center justify-center w-full h-14 rounded-xl font-black text-lg transition-all border-b-4 ${product.stock === 0 ? 'opacity-50 pointer-events-none' : 'hover:scale-[1.02] active:scale-95'}`}
                style={{ background: '#000', borderColor: '#333', color: '#fff' }}
                onClick={(e) => {
                  if (product.stock === 0) e.preventDefault();
                  // Pre-fill cart for direct buy
                  localStorage.setItem('online-vepar-cart', JSON.stringify([{ product, quantity }]))
                }}
              >
                BUY IT NOW
              </Link>
            </div>

            {/* TRUST BADGES */}
            <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full"><ShieldCheck size={20} /></div>
                Secure Checkout
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-full"><Truck size={20} /></div>
                Fast Shipping
              </div>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-full"><RotateCcw size={20} /></div>
                30-Day Returns
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── CROSS-SELLING / RECOMMENDED ── */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">You might also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => {
              let pImages = []
              try { pImages = JSON.parse(p.images) } catch {}
              return (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  currency={store.currency} 
                  primary={primary} 
                  onAdd={() => {}} 
                  images={pImages} 
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── STICKY BUY BAR (1000x Optimized) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 md:p-4 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4 animate-in slide-in-from-bottom">
        <div className="hidden md:flex items-center gap-4 flex-1">
          {images[0] && <Image src={images[0]} alt={product.name} width={56} height={56} className="rounded-xl object-cover shadow-sm" />}
          <div>
            <h4 className="font-black text-gray-900 line-clamp-1 text-lg">{product.name}</h4>
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400 text-xs">★★★★★</div>
              <p className="text-sm font-bold" style={{ color: primary }}>{formatPrice(product.price, store.currency)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center border-2 border-gray-200 rounded-xl h-12 w-28 flex-shrink-0 bg-white mr-1">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 font-bold text-gray-500 hover:text-black">-</button>
            <span className="font-black text-sm w-8 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="flex-1 font-bold text-gray-500 hover:text-black">+</button>
          </div>
          <button 
            disabled={product.stock === 0}
            className="flex-1 md:w-40 h-12 rounded-xl text-white font-bold text-sm shadow-[0_5px_15px_-5px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.02] active:scale-95 border-b-4 border-black/20"
            style={{ background: primary }}
            onClick={() => {
              const currentCart = JSON.parse(localStorage.getItem('online-vepar-cart') || '[]')
              const ex = currentCart.find((c: any) => c.product.id === product.id)
              if (ex) ex.quantity += quantity
              else currentCart.push({ product, quantity })
              localStorage.setItem('online-vepar-cart', JSON.stringify(currentCart))
              window.dispatchEvent(new Event('storage'))
            }}
          >
            Add to Cart
          </button>
          <Link 
            href={`/store/${store.slug}/checkout`}
            onClick={(e) => {
              if (product.stock === 0) e.preventDefault();
              localStorage.setItem('online-vepar-cart', JSON.stringify([{ product, quantity }]))
            }}
            className={`flex items-center justify-center flex-1 md:w-40 h-12 rounded-xl font-black text-sm transition-all hover:scale-[1.02] active:scale-95 shadow-lg border-b-4 ${product.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}
            style={{ background: '#000', borderColor: '#333', color: '#fff' }}
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  )
}
