'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, ChevronRight, X, Minus, Plus } from 'lucide-react'
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
  
  const primary = store.primaryColor || '#10b981'
  let images: string[] = []
  try { images = JSON.parse(product.images) } catch {}
  if (images.length === 0) images = [''] // fallback placeholder

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
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
            
            <div className="flex items-end gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">{formatPrice(product.price, store.currency)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-lg text-gray-400 line-through mb-1">{formatPrice(product.comparePrice, store.currency)}</span>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed mb-8">{product.description || 'No description available for this product.'}</p>

            {/* Qty & Add to cart */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-xl h-14 w-32">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900"><Minus size={18} /></button>
                  <span className="font-medium text-lg w-10 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="flex-1 flex items-center justify-center text-gray-500 hover:text-gray-900"><Plus size={18} /></button>
                </div>
                <button 
                  disabled={product.stock === 0}
                  className="flex-1 h-14 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: primary }}
                >
                  <ShoppingCart size={20} />
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
              <button 
                disabled={product.stock === 0}
                className="w-full h-14 rounded-xl font-bold text-lg border-2 transition-all disabled:opacity-50 hover:bg-gray-50"
                style={{ borderColor: primary, color: primary }}
              >
                Buy it now
              </button>
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

      {/* ── STICKY BUY BAR (Visible on scroll / mobile) ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between gap-4">
        <div className="hidden md:flex items-center gap-4 flex-1">
          {images[0] && <Image src={images[0]} alt={product.name} width={48} height={48} className="rounded-lg object-cover" />}
          <div>
            <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{product.name}</h4>
            <p className="text-sm font-medium text-gray-500">{formatPrice(product.price, store.currency)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center border border-gray-300 rounded-lg h-12 w-24 flex-shrink-0 bg-white">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 flex items-center justify-center text-gray-500">-</button>
            <span className="font-medium text-sm w-6 text-center">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="flex-1 flex items-center justify-center text-gray-500">+</button>
          </div>
          <button 
            disabled={product.stock === 0}
            className="flex-1 md:w-48 h-12 rounded-lg text-white font-bold text-sm shadow-sm transition-all"
            style={{ background: primary }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
