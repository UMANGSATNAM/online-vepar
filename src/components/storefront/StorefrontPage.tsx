'use client'

import { useState } from 'react'
import { ShoppingCart, Search, Menu, X, Star, ChevronRight, Instagram, Facebook, Twitter } from 'lucide-react'
import Image from 'next/image'

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
}

interface Category { id: string; name: string; slug: string; image?: string | null }
interface Collection { id: string; name: string; slug: string; description?: string | null }

interface Store {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  theme: string
  primaryColor: string
  currency: string
  facebookPixelId?: string | null
  googleAnalyticsId?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  products: Product[]
  categories: Category[]
  collections: Collection[]
  sectionsConfig?: string | null
}

interface CartItem { product: Product; quantity: number }

function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
  return `${symbols[currency] || currency} ${price.toFixed(2)}`
}

export default function StorefrontPage({ store }: { store: Store }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const primary = store.primaryColor || '#10b981'
  const images = (p: Product) => {
    try { return JSON.parse(p.images) as string[] } catch { return [] }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const ex = prev.find(c => c.product.id === product.id)
      if (ex) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const updateQty = (id: string, q: number) => {
    if (q <= 0) setCart(prev => prev.filter(c => c.product.id !== id))
    else setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: q } : c))
  }

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.quantity, 0)
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0)

  const filteredProducts = store.products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = !selectedCategory || p.categoryRef?.name === selectedCategory
    return matchSearch && matchCat
  })

  const featuredProducts = filteredProducts.filter(p => p.featured)
  const allProducts = filteredProducts

  let sections: any[] = []
  try {
    if (store.sectionsConfig) {
      sections = JSON.parse(store.sectionsConfig)
    }
  } catch (e) {
    console.error('Failed to parse sections', e)
  }

  // If no custom layout is saved, fallback to a default layout
  if (!sections || sections.length === 0) {
    sections = [
      { id: '1', type: 'hero', settings: { title: store.seoTitle || `Welcome to ${store.name}`, subtitle: store.description || 'Discover our amazing collection of products', buttonText: 'Shop Now' } },
      { id: '2', type: 'categories', settings: { title: 'Shop by Category' } },
      { id: '3', type: 'featuredProducts', settings: { title: '⭐ Featured Products', count: 4 } },
      { id: '4', type: 'allProducts', settings: { title: 'All Products' } }
    ]
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Inject Pixels */}
      {store.googleAnalyticsId && (
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${store.googleAnalyticsId}`} />
      )}

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            {store.logo
              ? <Image src={store.logo} alt={store.name} width={40} height={40} className="rounded-lg object-cover" />
              : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: primary }}>{store.name[0]}</div>
            }
            <span className="font-bold text-xl text-gray-900">{store.name}</span>
          </a>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">All Products</a>
            {store.categories.slice(0, 4).map(c => (
              <button key={c.id} onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
                className="text-sm font-medium transition-colors" style={{ color: selectedCategory === c.name ? primary : undefined }}>
                {c.name}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="bg-transparent text-sm outline-none w-32" />
            </div>
            <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-full transition-colors hover:bg-gray-100">
              <ShoppingCart size={20} className="text-gray-700" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ background: primary }}>{cartCount}</span>
              )}
            </button>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-2">
              <Search size={14} className="text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none flex-1" />
            </div>
            {store.categories.map(c => (
              <button key={c.id} onClick={() => { setSelectedCategory(c.name === selectedCategory ? null : c.name); setMenuOpen(false) }}
                className="block w-full text-left text-sm font-medium text-gray-700 py-1">{c.name}</button>
            ))}
          </div>
        )}
      </header>

      {/* ── DYNAMIC SECTIONS RENDERER ── */}
      {sections.map((section) => {
        const { type, settings, id } = section;

        switch (type) {
          case 'hero':
            return (
              <section key={id} className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}05)` }}>
                {store.banner && (
                  <Image src={store.banner} alt="Banner" fill className="object-cover opacity-20" />
                )}
                <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
                  <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                    {settings.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    {settings.subtitle}
                  </p>
                  <a href="#products" className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg hover:opacity-90 transition-all transform hover:-translate-y-0.5"
                    style={{ background: primary }}>
                    {settings.buttonText || 'Shop Now'} <ChevronRight size={20} />
                  </a>
                </div>
              </section>
            );

          case 'categories':
            if (store.categories.length === 0) return null;
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{settings.title || 'Shop by Category'}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <button onClick={() => setSelectedCategory(null)}
                    className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                    style={{ borderColor: !selectedCategory ? primary : '#e5e7eb', color: !selectedCategory ? primary : '#6b7280', background: !selectedCategory ? `${primary}10` : 'white' }}>
                    All
                  </button>
                  {store.categories.map(c => (
                    <button key={c.id} onClick={() => setSelectedCategory(c.name === selectedCategory ? null : c.name)}
                      className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold border-2 transition-all"
                      style={{ borderColor: selectedCategory === c.name ? primary : '#e5e7eb', color: selectedCategory === c.name ? primary : '#6b7280', background: selectedCategory === c.name ? `${primary}10` : 'white' }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </section>
            );

          case 'featuredProducts':
            if (featuredProducts.length === 0) return null;
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{settings.title}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featuredProducts.slice(0, settings.count || 4).map(p => <ProductCard key={p.id} product={p} currency={store.currency} primary={primary} onAdd={() => addToCart(p)} images={images(p)} />)}
                </div>
              </section>
            );

          case 'textWithImage':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-16">
                <div className={`flex flex-col ${settings.imagePosition === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}>
                  <div className="flex-1 space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{settings.title}</h2>
                    <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{settings.content}</p>
                  </div>
                  <div className="flex-1 w-full aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <ImageIcon size={64} className="opacity-20" />
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'testimonials':
            return (
              <section key={id} className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-12">{settings.title}</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center space-y-4">
                        <div className="flex justify-center gap-1 text-yellow-400">{'⭐⭐⭐⭐⭐'}</div>
                        <p className="text-gray-600 italic leading-relaxed">"{settings.subtitle || 'Amazing quality and fast shipping! Will definitely buy again.'}"</p>
                        <p className="font-semibold text-gray-900">- Customer {i}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'allProducts':
            return (
              <section key={id} id="products" className="max-w-7xl mx-auto px-4 pb-20 pt-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory ? selectedCategory : settings.title || 'All Products'}
                    <span className="ml-2 text-sm font-normal text-gray-500">({allProducts.length} items)</span>
                  </h2>
                </div>
                {allProducts.length === 0 ? (
                  <div className="text-center py-20 text-gray-500">
                    <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {allProducts.map(p => <ProductCard key={p.id} product={p} currency={store.currency} primary={primary} onAdd={() => addToCart(p)} images={images(p)} />)}
                  </div>
                )}
              </section>
            );

          default:
            return null;
        }
      })}

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100" style={{ background: `${primary}08` }}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {store.logo
                  ? <Image src={store.logo} alt={store.name} width={32} height={32} className="rounded-lg" />
                  : <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: primary }}>{store.name[0]}</div>
                }
                <span className="font-bold text-gray-900">{store.name}</span>
              </div>
              <p className="text-sm text-gray-500">{store.description || 'Quality products delivered to your door.'}</p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="p-2 rounded-full bg-white border border-gray-200 hover:border-gray-400 transition-colors"><Facebook size={16} /></a>
                <a href="#" className="p-2 rounded-full bg-white border border-gray-200 hover:border-gray-400 transition-colors"><Instagram size={16} /></a>
                <a href="#" className="p-2 rounded-full bg-white border border-gray-200 hover:border-gray-400 transition-colors"><Twitter size={16} /></a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#products" className="hover:text-gray-900 transition-colors">All Products</a></li>
                {store.categories.map(c => <li key={c.id}><button onClick={() => setSelectedCategory(c.name)} className="hover:text-gray-900 transition-colors">{c.name}</button></li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Customer Support</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-900">Shipping Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Return Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span>© {new Date().getFullYear()} {store.name}. All rights reserved.</span>
            <span>Powered by <a href="https://onlinevepar.com" className="font-semibold hover:text-gray-600" style={{ color: primary }}>Online Vepar</a></span>
          </div>
        </div>
      </footer>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg text-gray-900">Your Cart ({cartCount})</h2>
              <button onClick={() => setCartOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Your cart is empty</p>
                </div>
              ) : cart.map(({ product, quantity }) => {
                const imgs = images(product)
                return (
                  <div key={product.id} className="flex gap-4 items-start">
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {imgs[0] ? <Image src={imgs[0]} alt={product.name} width={64} height={64} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📦</div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{product.name}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: primary }}>{formatPrice(product.price, store.currency)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(product.id, quantity - 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50">-</button>
                        <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQty(product.id, quantity + 1)} className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-50">+</button>
                      </div>
                    </div>
                    <button onClick={() => updateQty(product.id, 0)} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                )
              })}
            </div>
            {cart.length > 0 && (
              <div className="border-t px-6 py-4 space-y-3">
                <div className="flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal, store.currency)}</span>
                </div>
                <button className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all" style={{ background: primary }}>
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, currency, primary, onAdd, images }: { product: Product; currency: string; primary: string; onAdd: () => void; images: string[] }) {
  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100) : 0

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {images[0]
          ? <Image src={images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
        }
        {discount > 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">-{discount}%</div>
        )}
        {product.featured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Star size={10} fill="currentColor" /> Featured</div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/70 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        {product.categoryRef && (
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: primary }}>{product.categoryRef.name}</p>
        )}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm leading-snug">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-lg font-bold text-gray-900">{formatPrice(product.price, currency)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1">{formatPrice(product.comparePrice, currency)}</span>
            )}
          </div>
          <button onClick={onAdd} disabled={product.stock === 0}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 active:scale-95 transition-all shadow-sm"
            style={{ background: primary }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
