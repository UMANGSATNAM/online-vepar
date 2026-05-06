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
          case 'announcementBar':
            return (
              <div key={id} style={{ backgroundColor: settings.backgroundColor || '#000', color: settings.textColor || '#fff' }} className="py-2.5 px-4 text-center text-[10px] sm:text-xs font-bold tracking-widest uppercase w-full flex items-center justify-center gap-2">
                <span className="animate-pulse">🔥</span> {settings.text} <span className="animate-pulse">🔥</span>
              </div>
            );

          case 'heroBannerAdvanced':
            return (
              <section key={id} className="relative w-full bg-[#111111] text-white overflow-hidden flex flex-col md:flex-row min-h-[600px] md:min-h-[800px]">
                {/* Left Content */}
                <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 border-r border-white/10">
                  <div className="bg-[#cc4444] text-white rounded-md mb-6 w-max uppercase tracking-wider text-[10px] font-bold px-3 py-1">
                    ● {settings.productTag || 'BESTSELLER'}
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase text-[#ccff00] mb-2">
                    DRESS<br/>BOLD.
                  </h1>
                  <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase text-white mb-8">
                    LIVE LOUD
                  </h1>
                  <p className="text-gray-400 text-sm md:text-base max-w-md mb-10 leading-relaxed">
                    Street-ready styles, premium fabrics, and drops that never sleep. Built for those who refuse to blend in.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <button className="bg-[#ccff00] hover:bg-[#bbee00] text-black font-bold h-14 px-8 text-sm tracking-widest uppercase transition-colors">
                      SHOP NEW ARRIVALS →
                    </button>
                    <button className="border border-white/20 hover:bg-white/10 text-white font-bold h-14 px-8 text-sm tracking-widest uppercase bg-transparent transition-colors">
                      WATCH LOOKBOOK
                    </button>
                  </div>
                  
                  {/* Stats Footer */}
                  <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 w-full mt-auto">
                    <div>
                      <p className="text-2xl font-black mb-1">50K+</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">HAPPY CUSTOMERS</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black mb-1">200+</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">STYLES AVAILABLE</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black mb-1 flex items-center gap-1">{settings.rating || '4.9'} <Sparkles className="w-4 h-4 text-[#ccff00]"/></p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{settings.statLabel || 'AVERAGE RATING'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Right Imagery */}
                <div className="flex-1 relative flex flex-col md:grid md:grid-cols-2 md:grid-rows-2">
                  <div className="md:col-span-2 md:row-span-1 bg-[#1a1a1a] relative group overflow-hidden border-b border-white/10 min-h-[400px]">
                    {settings.imageUrl ? (
                      <img src={settings.imageUrl} alt="Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">Main Image</div>
                    )}
                    <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1 tracking-widest uppercase">
                      {settings.productTag}
                    </div>
                    <div className="absolute bottom-4 right-4 bg-white text-black p-3 flex flex-col items-end shadow-2xl">
                      <span className="text-xs text-gray-500 line-through font-medium">{settings.originalPrice}</span>
                      <span className="text-xl font-black">{settings.currentPrice}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#222222] relative group overflow-hidden border-r border-white/10 min-h-[300px]">
                      {settings.gridImage1 ? (
                      <img src={settings.gridImage1} alt="Grid 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">Grid Img 1</div>
                    )}
                    <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                      <span className="text-[10px] font-bold text-white tracking-widest uppercase border border-white/30 px-2 py-1 backdrop-blur-sm">{settings.subTag1}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#1a1a1a] relative group overflow-hidden min-h-[300px]">
                      {settings.gridImage2 ? (
                      <img src={settings.gridImage2} alt="Grid 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">Grid Img 2</div>
                    )}
                    <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                      <span className="text-[10px] font-bold text-white tracking-widest uppercase border border-white/30 px-2 py-1 backdrop-blur-sm">{settings.subTag2}</span>
                    </div>
                  </div>
                </div>
              </section>
            );

          case 'featuresBand':
            return (
              <section key={id} className="py-6 border-y border-gray-200 bg-white">
                <div className="flex flex-wrap justify-center gap-8 md:gap-24 text-center">
                  {[settings.text1, settings.text2, settings.text3].filter(Boolean).map((txt, i) => (
                    <div key={i} className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-black">
                      <div className="w-2 h-2 rounded-full bg-[#ccff00]"></div>
                      {txt}
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'categoryGrid':
            return (
              <section key={id} className="py-20 px-4 md:px-8 bg-gray-50 max-w-[1400px] mx-auto">
                <div className="flex justify-between items-end mb-10">
                  <h2 className="text-3xl font-black uppercase tracking-tight">{settings.title}</h2>
                  <a href="#" className="text-xs font-bold border-b-2 border-black pb-1 uppercase tracking-widest hover:text-gray-600 transition-colors">VIEW ALL</a>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {store.categories.length > 0 
                    ? store.categories.slice(0, 4).map((c, i) => (
                        <div key={c.id} onClick={() => setSelectedCategory(c.name)} className="aspect-[4/5] bg-gray-200 relative group overflow-hidden cursor-pointer">
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors z-10"></div>
                          <h3 className="absolute bottom-6 left-6 text-white font-black text-xl z-20 uppercase tracking-widest">{c.name}</h3>
                        </div>
                      ))
                    : [1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-[4/5] bg-gray-200 relative group overflow-hidden cursor-pointer">
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors z-10"></div>
                          <h3 className="absolute bottom-6 left-6 text-white font-black text-xl z-20 uppercase tracking-widest">CATEGORY {i}</h3>
                        </div>
                      ))
                  }
                </div>
              </section>
            );

          case 'featuredCollection':
            return (
              <section key={id} className="py-20 px-4 md:px-8 bg-white max-w-[1400px] mx-auto">
                <div className="flex justify-between items-end mb-10">
                  <h2 className="text-3xl font-black uppercase tracking-tight">{settings.title}</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                  {featuredProducts.length > 0 
                    ? featuredProducts.slice(0, settings.count || 4).map(p => <ProductCard key={p.id} product={p} currency={store.currency} primary={primary} onAdd={() => addToCart(p)} images={images(p)} />)
                    : [1, 2, 3, 4].map(i => (
                        <div key={i} className="group cursor-pointer">
                          <div className="aspect-[3/4] bg-gray-100 mb-4 relative overflow-hidden">
                            <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest z-10 shadow-sm">NEW</div>
                          </div>
                          <h4 className="font-bold text-sm uppercase tracking-wider mb-1 group-hover:underline">Product Title {i}</h4>
                          <p className="text-sm font-medium text-gray-500">₹2,499 <span className="line-through text-gray-300 ml-2">₹3,999</span></p>
                        </div>
                      ))
                  }
                </div>
              </section>
            );

          case 'shoppableVideo':
            return (
              <section key={id} className="py-24 px-4 md:px-8 bg-[#111] text-white">
                <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-12">{settings.title}</h2>
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
                  <div className="flex-1 aspect-[9/16] md:aspect-auto bg-gray-800 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center pl-2 text-2xl shadow-xl hover:scale-110 transition-transform">▶</div>
                  </div>
                  <div className="w-full md:w-80 flex flex-col gap-4 justify-center">
                    {[1, 2].map(i => (
                      <div key={i} className="bg-white/5 p-4 rounded-xl flex gap-4 items-center hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-16 h-20 bg-white/10 rounded"></div>
                        <div className="flex-1">
                          <h4 className="font-bold text-sm uppercase">Featured Item {i}</h4>
                          <p className="text-sm text-gray-400">₹1,999</p>
                          <button className="w-full mt-2 bg-white text-black hover:bg-gray-200 text-xs py-2 font-bold uppercase tracking-wider transition-colors">ADD TO CART</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'bundleBuilder':
            return (
              <section key={id} className="py-24 px-4 md:px-8 bg-[#f4f6f8] text-center">
                <div className="bg-[#ccff00] text-black mb-6 uppercase font-bold tracking-widest inline-block px-4 py-1.5 text-xs shadow-sm">{settings.discount || 'Save 20%'}</div>
                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">{settings.title}</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-12 text-lg">Select 3 items and unlock an exclusive automatic discount at checkout.</p>
                
                <div className="flex justify-center items-center gap-4 md:gap-8 max-w-3xl mx-auto flex-wrap md:flex-nowrap">
                  <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200 hover:border-black hover:text-black cursor-pointer transition-colors shadow-sm">+</div>
                  <span className="font-black text-2xl text-gray-300 hidden md:block">+</span>
                  <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200 hover:border-black hover:text-black cursor-pointer transition-colors shadow-sm">+</div>
                  <span className="font-black text-2xl text-gray-300 hidden md:block">+</span>
                  <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200 hover:border-black hover:text-black cursor-pointer transition-colors shadow-sm">+</div>
                </div>
                
                <button className="mt-12 h-14 px-12 bg-black hover:bg-gray-800 text-white font-bold tracking-widest uppercase transition-colors shadow-xl">Start Building</button>
              </section>
            );

          case 'promotionalBanners':
            return (
              <section key={id} className="py-12 px-4 md:px-8 max-w-[1400px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-[21/9] md:aspect-[16/9] lg:aspect-[21/9] bg-[#cc4444] text-white flex flex-col justify-center items-start p-8 md:p-12 cursor-pointer hover:opacity-95 transition-opacity">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">Buy 1 Get 1</h3>
                    <p className="mb-6 font-medium opacity-90 text-lg">On all accessories</p>
                    <span className="border-b-2 border-white pb-1 font-bold text-xs uppercase tracking-widest hover:text-gray-200 hover:border-gray-200 transition-colors">Shop Now</span>
                  </div>
                  <div className="aspect-[21/9] md:aspect-[16/9] lg:aspect-[21/9] bg-black text-white flex flex-col justify-center items-start p-8 md:p-12 cursor-pointer hover:opacity-95 transition-opacity">
                    <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">New Drops</h3>
                    <p className="mb-6 font-medium opacity-90 text-lg">Limited edition sneakers</p>
                    <span className="border-b-2 border-[#ccff00] text-[#ccff00] pb-1 font-bold text-xs uppercase tracking-widest hover:text-[#bbee00] hover:border-[#bbee00] transition-colors">View Collection</span>
                  </div>
                </div>
              </section>
            );

          case 'reviewsSection':
            return (
              <section key={id} className="py-24 px-4 md:px-8 bg-white border-y border-gray-100">
                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-center mb-16">{settings.title}</h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-50 p-8 md:p-10 hover:shadow-lg transition-shadow">
                      <div className="flex gap-1 text-black mb-6 text-xl">{'★★★★★'}</div>
                      <p className="text-lg font-medium leading-relaxed mb-8">"The quality is absolutely insane. I've been wearing this every single day since it arrived. Definitely buying more."</p>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">— Verified Buyer {i}</p>
                    </div>
                  ))}
                </div>
              </section>
            );

          case 'footer':
            return (
              <section key={id} className="bg-[#111] text-white py-20 px-4 md:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 max-w-[1400px] mx-auto">
                  <div>
                    <h4 className="font-black uppercase tracking-widest mb-6">About</h4>
                    <div className="space-y-3 text-sm text-gray-400">
                      <p className="hover:text-white cursor-pointer transition-colors">Our Story</p>
                      <p className="hover:text-white cursor-pointer transition-colors">Careers</p>
                      <p className="hover:text-white cursor-pointer transition-colors">Press</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-widest mb-6">Support</h4>
                    <div className="space-y-3 text-sm text-gray-400">
                      <p className="hover:text-white cursor-pointer transition-colors">FAQ</p>
                      <p className="hover:text-white cursor-pointer transition-colors">Shipping</p>
                      <p className="hover:text-white cursor-pointer transition-colors">Returns</p>
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <h4 className="font-black uppercase tracking-widest mb-6">Join the Club</h4>
                    <p className="text-sm text-gray-400 mb-4">Subscribe for exclusive drops and 10% off your first order.</p>
                    <div className="flex flex-col sm:flex-row">
                      <input type="email" placeholder="Email Address" className="bg-white/10 px-4 py-3 w-full text-sm outline-none focus:bg-white/20 transition-colors text-white" />
                      <button className="bg-white text-black px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors mt-2 sm:mt-0">Subscribe</button>
                    </div>
                  </div>
                </div>
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-medium max-w-[1400px] mx-auto gap-4">
                  <p>{settings.text}</p>
                  <div className="flex gap-6">
                    <span className="hover:text-white cursor-pointer transition-colors">Instagram</span>
                    <span className="hover:text-white cursor-pointer transition-colors">TikTok</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
                  </div>
                </div>
              </section>
            );

          case 'customCode':
            return (
              <section key={id} className="w-full">
                <div dangerouslySetInnerHTML={{ __html: settings.code || '' }} />
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
