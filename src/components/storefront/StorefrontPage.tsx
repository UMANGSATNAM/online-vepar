'use client'

import { useState } from 'react'
import { ShoppingCart, Search, Menu, X, Star, ChevronRight, Instagram, Facebook, Twitter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from './ProductCard'

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

      {/* ── STICKY ADD TO CART FLOATER (Mobile Only or Always) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 md:hidden flex justify-between items-center">
        <div className="font-bold text-lg">{formatPrice(cartTotal, store.currency)}</div>
        <button className="px-8 py-3 rounded-full text-white font-bold" style={{ background: primary }}>Checkout Now</button>
      </div>

      {/* ── DYNAMIC SECTIONS RENDERER ── */}
      {sections.map((section) => {
        const { type, settings, id } = section;

        switch (type) {
          case 'hero':
            return (
              <section key={id} className="relative overflow-hidden flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}05)`, minHeight: settings.height || '600px' }}>
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

          case 'promoBanner':
            return (
              <div key={id} style={{ backgroundColor: settings.backgroundColor || '#000', color: settings.textColor || '#fff' }} className="py-2 px-4 text-center text-sm font-medium w-full">
                {settings.text}
              </div>
            );

          case 'countdownTimer':
            return (
              <section key={id} className="py-12 px-4 bg-red-50 text-center">
                <h3 className="text-xl font-bold text-red-600 mb-4">{settings.title}</h3>
                <div className="flex justify-center gap-4 text-2xl font-mono font-bold text-red-900">
                  <div className="flex flex-col items-center"><span className="bg-white px-4 py-2 rounded-lg shadow-sm">12</span><span className="text-xs text-red-500 mt-1 uppercase">Hours</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="bg-white px-4 py-2 rounded-lg shadow-sm">45</span><span className="text-xs text-red-500 mt-1 uppercase">Mins</span></div>
                  <span>:</span>
                  <div className="flex flex-col items-center"><span className="bg-white px-4 py-2 rounded-lg shadow-sm">30</span><span className="text-xs text-red-500 mt-1 uppercase">Secs</span></div>
                </div>
              </section>
            );

          case 'trustBadges':
            return (
              <section key={id} className="py-12 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-8">{settings.title}</h3>
                  <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-gray-500">
                    {(settings.badges || 'Secure Checkout, Free Shipping, 24/7 Support').split(',').map((badge: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 font-medium">
                        <Sparkles size={20} className="text-emerald-500" />
                        <span>{badge.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'faq':
            return (
              <section key={id} className="py-20 px-4 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-10">{settings.title}</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="border border-gray-200 rounded-xl p-5">
                      <h4 className="font-bold flex justify-between">Question {i}? <ChevronRight size={18} className="rotate-90 text-gray-400" /></h4>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'newsletter':
            return (
              <section key={id} className="py-24 px-4 text-white text-center" style={{ background: primary }}>
                <div className="max-w-2xl mx-auto space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold">{settings.title}</h2>
                  <p className="opacity-80">{settings.subtitle}</p>
                  <div className="flex max-w-md mx-auto mt-6">
                    <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 outline-none" />
                    <button className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-r-lg font-bold transition-colors">Subscribe</button>
                  </div>
                </div>
              </section>
            );

          case 'slideshow':
            return (
              <section key={id} className="w-full relative bg-gray-900 text-white flex items-center justify-center" style={{ minHeight: '500px' }}>
                <div className="text-center z-10 px-4">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4">{settings.title || 'Slideshow'}</h2>
                  <p className="text-lg opacity-80">[{settings.slideCount} slides rotating every {settings.delay}s]</p>
                </div>
              </section>
            );

          case 'video':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-3xl font-bold mb-8">{settings.title}</h2>
                <div className="aspect-video bg-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-4xl shadow-xl pl-2">▶</div>
                </div>
              </section>
            );

          case 'blogPosts':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold mb-8 text-center">{settings.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="group cursor-pointer">
                      <div className="aspect-[4/3] bg-gray-200 rounded-xl mb-4 overflow-hidden">
                        <div className="w-full h-full bg-gray-100 group-hover:scale-105 transition-transform"></div>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</p>
                      <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">Amazing Blog Post Title {i}</h4>
                      <p className="text-gray-600 line-clamp-2">A short excerpt of the blog post goes right here, enticing the reader to click and learn more.</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'contactForm':
            return (
              <section key={id} className="max-w-3xl mx-auto px-4 py-20 text-center">
                <h2 className="text-3xl font-bold mb-4">{settings.title}</h2>
                <p className="text-gray-500 mb-10">We'd love to hear from you. Email us directly at {settings.email || 'hello@store.com'}.</p>
                <div className="space-y-4 max-w-lg mx-auto text-left">
                  <input type="text" placeholder="Name" className="w-full border rounded-lg p-3 outline-none focus:border-black" />
                  <input type="email" placeholder="Email" className="w-full border rounded-lg p-3 outline-none focus:border-black" />
                  <textarea placeholder="Message" rows={4} className="w-full border rounded-lg p-3 outline-none focus:border-black"></textarea>
                  <button className="w-full text-white font-bold py-3 rounded-lg" style={{ background: primary }}>Send Message</button>
                </div>
              </section>
            );

          case 'promoPopups':
            return null; // Automatically triggered via useEffect in real environment

          case 'lookbook':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-3xl font-bold mb-10">{settings.title}</h2>
                <div className="w-full aspect-video bg-gray-100 rounded-2xl relative flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400">Lookbook Image</span>
                  <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full shadow-lg animate-pulse"></div>
                  <div className="absolute top-1/2 right-1/3 w-4 h-4 bg-white rounded-full shadow-lg animate-pulse"></div>
                </div>
              </section>
            );

          case 'promoTiles':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-12">
                <h2 className="text-3xl font-bold mb-8 text-center">{settings.title}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-[4/3] bg-gray-900 rounded-2xl text-white flex flex-col justify-end p-8">
                    <h3 className="text-2xl font-bold mb-2">Summer Essentials</h3>
                    <a href="#" className="underline font-medium hover:text-gray-300">Shop Collection</a>
                  </div>
                  <div className="aspect-[4/3] bg-gray-800 rounded-2xl text-white flex flex-col justify-end p-8">
                    <h3 className="text-2xl font-bold mb-2">New Arrivals</h3>
                    <a href="#" className="underline font-medium hover:text-gray-300">Shop Collection</a>
                  </div>
                </div>
              </section>
            );

          case 'logoList':
            return (
              <section key={id} className="border-y border-gray-100 bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">{settings.title}</p>
                  <div className="flex flex-wrap justify-center gap-10 md:gap-20 opacity-50 grayscale">
                    {['VOGUE', 'GQ', 'FORBES', 'WIRED', 'TECHCRUNCH'].map(brand => (
                      <h4 key={brand} className="text-2xl font-black">{brand}</h4>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'richText':
            return (
              <section key={id} className="max-w-3xl mx-auto px-4 py-24 text-center">
                <h2 className="text-3xl font-bold mb-6">{settings.title}</h2>
                <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">{settings.content}</p>
              </section>
            );

          case 'map':
            return (
              <section key={id} className="w-full bg-gray-200 aspect-[21/9] flex items-center justify-center relative">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{settings.title}</h3>
                  <p className="text-gray-600 bg-white/80 px-4 py-2 rounded-lg backdrop-blur-sm">{settings.address}</p>
                </div>
              </section>
            );

          case 'imageGallery':
            return (
              <section key={id} className="max-w-7xl mx-auto px-4 py-20">
                <h2 className="text-3xl font-bold mb-10 text-center">{settings.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className={`bg-gray-100 rounded-xl ${i === 1 || i === 4 ? 'row-span-2 aspect-[1/2]' : 'aspect-square'}`}></div>
                  ))}
                </div>
              </section>
            );

          case 'customCode':
            return (
              <section key={id} className="w-full">
                <div dangerouslySetInnerHTML={{ __html: settings.code || '' }} />
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
