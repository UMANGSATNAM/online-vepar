'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  images: string
  description?: string | null
  featured: boolean
  stock: number
  categoryRef?: { name: string } | null
  storeSlug?: string
}

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  return `${symbols[currency] || currency} ${price.toFixed(2)}`
}

export default function ProductCard({ 
  product, 
  currency, 
  primary, 
  onAdd, 
  images 
}: { 
  product: Product; 
  currency: string; 
  primary: string; 
  onAdd: () => void; 
  images: string[] 
}) {
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0

  return (
    <div className="group bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 dark:border-white/10 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300 relative flex flex-col">
      <Link href={`/store/${product.storeSlug || 'store'}/product/${product.slug}`} className="absolute inset-0 z-10" />
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {images[0]
          ? <Image src={images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
        }
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">-{discount}%</div>
        )}
        {product.featured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-20"><Star size={10} fill="currentColor" /> Featured</div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
            <span className="text-white font-bold text-sm bg-black/70 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {product.categoryRef && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: primary }}>{product.categoryRef.name}</p>
        )}
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 line-clamp-2 text-sm leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1 leading-relaxed">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 relative z-20">
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatPrice(product.price, currency)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-slate-400 dark:text-slate-500 line-through ml-1.5">{formatPrice(product.comparePrice, currency)}</span>
            )}
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd(); }} disabled={product.stock === 0}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-md shadow-black/10"
            style={{ background: primary }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
