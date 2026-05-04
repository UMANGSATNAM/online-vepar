'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Tablet, Smartphone, ExternalLink,
  ShoppingCart, Store, Package, ChevronRight, Share2, Check,
  X, Star, Truck, Shield, Info, MapPin, Mail, Phone,
  Heart, Minus, Plus, Trash2, ArrowRight, Search,
  Menu, Tag, Clock, Award, Users, Sparkles,
  Instagram, Twitter, Facebook, Send, Eye, Zap
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppStore, type CartItem } from '@/lib/store'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  images: string[]
  status: string
  featured: boolean
  category?: string
  description?: string
  stock?: number
  sku?: string
  avgRating?: number
  reviewCount?: number
  tags?: string[]
}

// Placeholder images using picsum.photos with consistent seeds
const PRODUCT_PLACEHOLDERS: Record<string, string[]> = {
  'Sarees': [
    'https://picsum.photos/seed/saree1/600/800',
    'https://picsum.photos/seed/saree2/600/800',
    'https://picsum.photos/seed/silk3/600/800',
  ],
  'Kurtas': [
    'https://picsum.photos/seed/kurta1/600/800',
    'https://picsum.photos/seed/kurta2/600/800',
    'https://picsum.photos/seed/kurta3/600/800',
  ],
  'Lehengas': [
    'https://picsum.photos/seed/lehenga1/600/800',
    'https://picsum.photos/seed/lehenga2/600/800',
    'https://picsum.photos/seed/lehenga3/600/800',
  ],
  'Accessories': [
    'https://picsum.photos/seed/jewelry1/600/800',
    'https://picsum.photos/seed/jewelry2/600/800',
    'https://picsum.photos/seed/accessory3/600/800',
  ],
  'Western Wear': [
    'https://picsum.photos/seed/western1/600/800',
    'https://picsum.photos/seed/western2/600/800',
    'https://picsum.photos/seed/western3/600/800',
  ],
}

const DEFAULT_PLACEHOLDERS = [
  'https://picsum.photos/seed/product1/600/800',
  'https://picsum.photos/seed/product2/600/800',
  'https://picsum.photos/seed/product3/600/800',
]

// Testimonials for the preview
const PREVIEW_TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely love the quality! The Banarasi saree was even more beautiful in person. Will definitely order again.',
    avatar: 'https://picsum.photos/seed/avatar1/100/100',
  },
  {
    name: 'Ananya Patel',
    location: 'Delhi',
    rating: 5,
    text: 'Fast delivery and excellent packaging. The kurta set was exactly as shown. Highly recommended!',
    avatar: 'https://picsum.photos/seed/avatar2/100/100',
  },
  {
    name: 'Kavita Nair',
    location: 'Bengaluru',
    rating: 4,
    text: 'Great collection and very reasonable prices. The customer service was very helpful when I had questions.',
    avatar: 'https://picsum.photos/seed/avatar3/100/100',
  },
]

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

// Loading skeleton component
function StoreSkeleton() {
  return (
    <div className="space-y-0">
      {/* Header skeleton */}
      <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-4 w-12 hidden md:block" />
          <Skeleton className="h-4 w-14 hidden md:block" />
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </div>
      {/* Hero skeleton */}
      <div className="px-4 md:px-8 py-16 md:py-24 text-center">
        <Skeleton className="h-8 md:h-10 w-64 mx-auto mb-3" />
        <Skeleton className="h-4 w-80 mx-auto mb-6" />
        <Skeleton className="h-10 w-32 mx-auto rounded-md" />
      </div>
      {/* Categories skeleton */}
      <div className="px-4 md:px-8 py-8">
        <Skeleton className="h-6 w-40 mx-auto mb-6" />
        <div className="flex gap-3 justify-center flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
      {/* Product grid skeleton */}
      <div className="px-4 md:px-8 py-8">
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl overflow-hidden border">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ primaryColor, storeName }: { primaryColor: string; storeName: string }) {
  return (
    <div className="px-4 md:px-8 py-16 text-center">
      <div
        className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        style={{ backgroundColor: `${primaryColor}12` }}
      >
        <Package className="w-10 h-10" style={{ color: `${primaryColor}50` }} />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>
        No Products Yet
      </h3>
      <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: '#6b7280' }}>
        {storeName
          ? `${storeName} hasn't added any products yet. Check back soon for exciting new items!`
          : 'This store doesn\'t have any products yet. Products will appear here once they are added.'
        }
      </p>
      <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#9ca3af' }}>
        <Clock className="w-4 h-4" />
        <span>New products coming soon</span>
      </div>
    </div>
  )
}

export default function StorePreview() {
  const { currentStore, setView, cart, addToCart, removeFromCart, updateCartQuantity, clearCart } = useAppStore()
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDetailOpen, setProductDetailOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [wishlistItems, setWishlistItems] = useState<Set<string>>(new Set())
  const [storeData, setStoreData] = useState<{
    name: string
    slug: string
    description: string
    logo: string
    banner: string
    theme: string
    primaryColor: string
    currency: string
  }>({
    name: '',
    slug: '',
    description: '',
    logo: '',
    banner: '',
    theme: 'modern',
    primaryColor: '#10b981',
    currency: 'INR',
  })

  const fetchStoreAndProducts = useCallback(async () => {
    if (!currentStore?.id) {
      setLoadingProducts(false)
      return
    }
    setLoadingProducts(true)
    try {
      const res = await fetch(`/api/storefront?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setStoreData({
          name: data.store?.name || '',
          slug: data.store?.slug || '',
          description: data.store?.description || '',
          logo: data.store?.logo || '',
          banner: data.store?.banner || '',
          theme: data.store?.theme || 'modern',
          primaryColor: data.store?.primaryColor || '#10b981',
          currency: data.store?.currency || 'INR',
        })
        setProducts(data.products || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoadingProducts(false)
    }
  }, [currentStore?.id])

  useEffect(() => {
    fetchStoreAndProducts()
  }, [fetchStoreAndProducts])

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
    return symbols[currency] || '₹'
  }

  const formatPrice = (price: number) => {
    return `${getCurrencySymbol(storeData.currency)}${price.toLocaleString('en-IN')}`
  }

  const getDiscountPercent = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return 0
    return Math.round(((comparePrice - price) / comparePrice) * 100)
  }

  const getViewportWidth = () => {
    switch (viewport) {
      case 'desktop': return '100%'
      case 'tablet': return '768px'
      case 'mobile': return '375px'
    }
  }

  const storeUrl = `${storeData.slug || 'your-store'}.onlinevepar.com`

  const handleShareStore = async () => {
    const url = `https://${storeUrl}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handlePreviewAddToCart = (product: Product, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: getProductImage(product, 0) || undefined,
      sku: product.sku || undefined,
    }
    addToCart(item)
  }

  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setWishlistItems(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const themeStyles = {
    modern: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      navColor: '#6b7280',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}12, ${storeData.primaryColor}25)`,
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      footerBg: '#111827',
      footerText: '#d1d5db',
      sectionAlt: `${storeData.primaryColor}06`,
      textMuted: '#6b7280',
    },
    classic: {
      bg: '#fefce8',
      headerBg: '#fffbeb',
      headerText: '#78350f',
      navColor: '#92400e',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}20, ${storeData.primaryColor}40)`,
      cardBg: '#fffbeb',
      cardBorder: '#fde68a',
      footerBg: '#78350f',
      footerText: '#fef3c7',
      sectionAlt: `${storeData.primaryColor}10`,
      textMuted: '#92400e',
    },
    minimal: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      navColor: '#374151',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}06, ${storeData.primaryColor}12)`,
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      footerBg: '#f9fafb',
      footerText: '#6b7280',
      sectionAlt: '#f9fafb',
      textMuted: '#6b7280',
    },
    bold: {
      bg: '#111827',
      headerBg: '#1f2937',
      headerText: '#ffffff',
      navColor: '#d1d5db',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}35, ${storeData.primaryColor}55)`,
      cardBg: '#1f2937',
      cardBorder: '#374151',
      footerBg: '#000000',
      footerText: '#9ca3af',
      sectionAlt: '#1f2937',
      textMuted: '#9ca3af',
    },
  }

  const currentTheme = themeStyles[(storeData.theme as keyof typeof themeStyles) || 'modern'] || themeStyles.modern

  const getImages = (images: string[] | string): string[] => {
    if (Array.isArray(images)) return images
    try {
      return JSON.parse(images || '[]')
    } catch {
      return []
    }
  }

  // Get product image with placeholder fallback
  const getProductImage = (product: Product, index: number = 0): string => {
    const images = getImages(product.images)
    if (images.length > index && images[index]) {
      return images[index]
    }
    // Fallback to category-based placeholder
    const category = product.category || ''
    const placeholders = PRODUCT_PLACEHOLDERS[category] || DEFAULT_PLACEHOLDERS
    return placeholders[index % placeholders.length]
  }

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product)
    setProductDetailOpen(true)
  }

  // Compute categories from products
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))
    return ['all', ...cats]
  }, [products])

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return products
    return products.filter(p => p.category === activeCategory)
  }, [products, activeCategory])

  // Featured products
  const featuredProducts = useMemo(() => {
    return products.filter(p => p.featured).slice(0, 4)
  }, [products])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Store Preview</h1>
            <p className="text-muted-foreground mt-1">
              Preview how your store looks to customers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleShareStore}
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Share Link
                </>
              )}
            </Button>
            <Button
              className="gap-2 text-white"
              style={{ backgroundColor: currentStore?.primaryColor || '#10b981' }}
              onClick={() => setView('checkout')}
            >
              <ExternalLink className="w-4 h-4" />
              Open Live Store
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="overflow-hidden">
          {/* Browser Frame */}
          <div className="border-b bg-muted/50 px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-3 flex items-center gap-1.5 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground border min-w-0">
                  <span className="shrink-0">🔒</span>
                  <span className="truncate">{storeUrl}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md overflow-hidden">
                  <Button
                    variant={viewport === 'desktop' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 rounded-none"
                    onClick={() => setViewport('desktop')}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewport === 'tablet' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 rounded-none"
                    onClick={() => setViewport('tablet')}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant={viewport === 'mobile' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-7 px-2 rounded-none"
                    onClick={() => setViewport('mobile')}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 hover:text-emerald-700 dark:hover:text-emerald-300"
                  onClick={() => setView('checkout')}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </Button>
              </div>
            </div>
          </div>

          {/* Store Preview Content */}
          <div
            className="mx-auto transition-all duration-300 overflow-hidden"
            style={{
              maxWidth: getViewportWidth(),
              minHeight: '600px',
            }}
          >
            <div style={{ backgroundColor: currentTheme.bg }}>
              {/* ─── Header ─── */}
              <div
                className="px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-10"
                style={{
                  backgroundColor: currentTheme.headerBg,
                  borderBottom: `1px solid ${currentTheme.cardBorder}`,
                  boxShadow: storeData.theme === 'modern' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  {storeData.logo ? (
                    <img
                      src={storeData.logo}
                      alt=""
                      className="h-8 w-8 rounded object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: storeData.primaryColor }}
                    >
                      {storeData.name?.charAt(0) || 'S'}
                    </div>
                  )}
                  <span className="font-bold text-lg" style={{ color: currentTheme.headerText }}>
                    {storeData.name || 'Your Store'}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-6">
                  {['Home', 'Shop', 'About', 'Contact'].map((item) => (
                    <span
                      key={item}
                      className="text-sm font-medium hover:opacity-80 cursor-pointer transition-opacity"
                      style={{ color: currentTheme.navColor }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button className="relative cursor-pointer" onClick={() => setCartOpen(true)}>
                    <ShoppingCart className="w-5 h-5" style={{ color: currentTheme.navColor }} />
                    {cartCount > 0 && (
                      <span
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                        style={{ backgroundColor: storeData.primaryColor }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {loadingProducts ? (
                <StoreSkeleton />
              ) : (
                <>
                  {/* ─── Hero Banner ─── */}
                  <div
                    className="px-4 md:px-8 py-14 md:py-20 text-center relative overflow-hidden"
                    style={{ background: currentTheme.heroGradient }}
                  >
                    {storeData.banner ? (
                      <div className="absolute inset-0 opacity-20">
                        <img
                          src={storeData.banner}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    ) : null}
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: storeData.primaryColor, transform: 'translate(30%, -30%)' }} />
                    <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-8" style={{ backgroundColor: storeData.primaryColor, transform: 'translate(-30%, 30%)', opacity: 0.08 }} />

                    <div className="relative z-10">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <Badge
                          className="mb-4 text-[10px] font-medium px-3 py-1 border-0"
                          style={{ backgroundColor: `${storeData.primaryColor}18`, color: storeData.primaryColor }}
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          New Collection Available
                        </Badge>
                        <h2
                          className="text-2xl md:text-4xl font-bold mb-3 leading-tight"
                          style={{ color: storeData.theme === 'bold' ? '#fff' : '#111827' }}
                        >
                          {storeData.name || 'Your Store Name'}
                        </h2>
                        <p
                          className="text-sm md:text-base max-w-lg mx-auto mb-6 leading-relaxed"
                          style={{ color: storeData.theme === 'bold' ? '#d1d5db' : '#6b7280' }}
                        >
                          {storeData.description || 'Welcome to our store. Discover amazing products curated just for you.'}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            className="px-6 py-2.5 text-white rounded-lg font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-all duration-200 shadow-lg"
                            style={{ backgroundColor: storeData.primaryColor }}
                          >
                            Shop Now
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            className="px-6 py-2.5 rounded-lg font-medium text-sm inline-flex items-center gap-2 transition-all duration-200 border"
                            style={{
                              borderColor: storeData.primaryColor,
                              color: storeData.primaryColor,
                              backgroundColor: 'transparent',
                            }}
                          >
                            View Collection
                          </button>
                        </div>
                      </motion.div>

                      {/* Stats bar */}
                      <div
                        className="mt-10 inline-flex items-center gap-6 md:gap-10 px-6 py-3 rounded-xl"
                        style={{ backgroundColor: `${currentTheme.bg}CC`, backdropFilter: 'blur(8px)', border: `1px solid ${currentTheme.cardBorder}` }}
                      >
                        {[
                          { value: `${products.length}+`, label: 'Products' },
                          { value: '4.8', label: 'Avg Rating' },
                          { value: '2K+', label: 'Happy Customers' },
                        ].map((stat, i) => (
                          <div key={i} className="text-center">
                            <p className="font-bold text-lg" style={{ color: storeData.primaryColor }}>{stat.value}</p>
                            <p className="text-[10px]" style={{ color: currentTheme.textMuted }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <EmptyState primaryColor={storeData.primaryColor} storeName={storeData.name} />
                  ) : (
                    <>
                      {/* ─── Category Filter ─── */}
                      {categories.length > 2 && (
                        <div
                          className="px-4 md:px-8 py-6"
                          style={{ backgroundColor: currentTheme.sectionAlt }}
                        >
                          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                className="px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200"
                                style={{
                                  backgroundColor: activeCategory === cat ? storeData.primaryColor : `${storeData.primaryColor}10`,
                                  color: activeCategory === cat ? '#ffffff' : storeData.primaryColor,
                                }}
                                onClick={() => setActiveCategory(cat)}
                              >
                                {cat === 'all' ? 'All Products' : cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ─── Featured Products Banner ─── */}
                      {featuredProducts.length > 0 && activeCategory === 'all' && (
                        <div className="px-4 md:px-8 py-10 md:py-14">
                          <div className="text-center mb-8">
                            <Badge
                              className="mb-2 text-[10px] font-medium px-2.5 py-0.5 border-0"
                              style={{ backgroundColor: `${storeData.primaryColor}15`, color: storeData.primaryColor }}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Best Sellers
                            </Badge>
                            <h3
                              className="text-xl md:text-2xl font-bold mb-2"
                              style={{ color: currentTheme.headerText }}
                            >
                              Featured Products
                            </h3>
                            <p className="text-sm" style={{ color: currentTheme.textMuted }}>
                              Our most popular items loved by customers
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {featuredProducts.map((product) => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                storeData={storeData}
                                currentTheme={currentTheme}
                                getProductImage={getProductImage}
                                formatPrice={formatPrice}
                                getDiscountPercent={getDiscountPercent}
                                cart={cart}
                                onAddToCart={handlePreviewAddToCart}
                                onOpenDetail={openProductDetail}
                                onToggleWishlist={toggleWishlist}
                                isWishlisted={wishlistItems.has(product.id)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ─── All Products / Filtered ─── */}
                      <div
                        className="px-4 md:px-8 py-10 md:py-14"
                        style={{ backgroundColor: currentTheme.sectionAlt }}
                      >
                        <div className="text-center mb-8">
                          <h3
                            className="text-xl md:text-2xl font-bold mb-2"
                            style={{ color: currentTheme.headerText }}
                          >
                            {activeCategory === 'all' ? 'All Products' : activeCategory}
                          </h3>
                          <p className="text-sm" style={{ color: currentTheme.textMuted }}>
                            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              storeData={storeData}
                              currentTheme={currentTheme}
                              getProductImage={getProductImage}
                              formatPrice={formatPrice}
                              getDiscountPercent={getDiscountPercent}
                              cart={cart}
                              onAddToCart={handlePreviewAddToCart}
                              onOpenDetail={openProductDetail}
                              onToggleWishlist={toggleWishlist}
                              isWishlisted={wishlistItems.has(product.id)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* ─── Trust Badges ─── */}
                      <div className="px-4 md:px-8 py-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                          {[
                            { icon: Truck, label: 'Free Shipping', desc: 'On all orders over ₹500' },
                            { icon: Shield, label: 'Secure Payment', desc: '100% protected checkout' },
                            { icon: Award, label: 'Quality Guarantee', desc: 'Premium products only' },
                            { icon: Info, label: '24/7 Support', desc: 'Always here to help' },
                          ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center text-center p-4">
                              <div
                                className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
                                style={{ backgroundColor: `${storeData.primaryColor}12` }}
                              >
                                <item.icon className="w-6 h-6" style={{ color: storeData.primaryColor }} />
                              </div>
                              <p className="text-sm font-semibold mb-1" style={{ color: currentTheme.headerText }}>{item.label}</p>
                              <p className="text-xs" style={{ color: currentTheme.textMuted }}>{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ─── Testimonials ─── */}
                      <div
                        className="px-4 md:px-8 py-10 md:py-14"
                        style={{ backgroundColor: currentTheme.sectionAlt }}
                      >
                        <div className="text-center mb-8">
                          <Badge
                            className="mb-2 text-[10px] font-medium px-2.5 py-0.5 border-0"
                            style={{ backgroundColor: `${storeData.primaryColor}15`, color: storeData.primaryColor }}
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Customer Love
                          </Badge>
                          <h3
                            className="text-xl md:text-2xl font-bold mb-2"
                            style={{ color: currentTheme.headerText }}
                          >
                            What Our Customers Say
                          </h3>
                          <p className="text-sm" style={{ color: currentTheme.textMuted }}>
                            Real reviews from happy shoppers
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                          {PREVIEW_TESTIMONIALS.map((t, i) => (
                            <div
                              key={i}
                              className="p-5 rounded-xl transition-shadow hover:shadow-md"
                              style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.cardBorder}` }}
                            >
                              <StarRating rating={t.rating} size="sm" />
                              <p className="text-sm mt-3 leading-relaxed" style={{ color: currentTheme.textMuted }}>
                                &ldquo;{t.text}&rdquo;
                              </p>
                              <div className="flex items-center gap-3 mt-4">
                                <img
                                  src={t.avatar}
                                  alt={t.name}
                                  className="w-9 h-9 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: currentTheme.headerText }}>{t.name}</p>
                                  <p className="text-xs" style={{ color: currentTheme.textMuted }}>{t.location}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ─── About Section ─── */}
                      <div className="px-4 md:px-8 py-10 md:py-14">
                        <div className="max-w-3xl mx-auto text-center">
                          <h3
                            className="text-xl md:text-2xl font-bold mb-4"
                            style={{ color: currentTheme.headerText }}
                          >
                            About {storeData.name || 'Our Store'}
                          </h3>
                          <p
                            className="text-sm md:text-base leading-relaxed mb-8"
                            style={{ color: currentTheme.textMuted }}
                          >
                            {storeData.description || 'We are passionate about bringing you the best products with exceptional quality and service. Our mission is to make shopping easy, enjoyable, and accessible for everyone.'}
                          </p>
                          <div className="grid grid-cols-3 gap-6 md:gap-10">
                            {[
                              { icon: Package, label: `${products.length}+`, desc: 'Products' },
                              { icon: Users, label: '2,000+', desc: 'Customers' },
                              { icon: Star, label: '4.8★', desc: 'Avg Rating' },
                            ].map((item) => (
                              <div key={item.label} className="text-center">
                                <div
                                  className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
                                  style={{ backgroundColor: `${storeData.primaryColor}12` }}
                                >
                                  <item.icon className="w-6 h-6" style={{ color: storeData.primaryColor }} />
                                </div>
                                <p className="text-lg font-bold" style={{ color: currentTheme.headerText }}>{item.label}</p>
                                <p className="text-xs" style={{ color: currentTheme.textMuted }}>{item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* ─── Newsletter Section ─── */}
                      <div
                        className="px-4 md:px-8 py-10 md:py-14"
                        style={{ backgroundColor: storeData.primaryColor }}
                      >
                        <div className="max-w-lg mx-auto text-center">
                          <Mail className="w-8 h-8 text-white/80 mx-auto mb-3" />
                          <h3 className="text-xl md:text-2xl font-bold mb-2 text-white">
                            Stay in the Loop
                          </h3>
                          <p className="text-sm text-white/80 mb-6">
                            Subscribe to get exclusive offers, new arrivals, and style tips delivered to your inbox.
                          </p>
                          <div className="flex gap-2 max-w-sm mx-auto">
                            <Input
                              placeholder="Enter your email"
                              className="h-10 text-sm bg-white/20 border-white/30 text-white placeholder:text-white/60 focus-visible:ring-white/50"
                            />
                            <Button
                              className="h-10 px-5 bg-white font-semibold shrink-0 hover:bg-white/90"
                              style={{ color: storeData.primaryColor }}
                            >
                              <Send className="w-4 h-4 mr-1.5" />
                              Subscribe
                            </Button>
                          </div>
                          <p className="text-[10px] text-white/50 mt-3">
                            No spam, unsubscribe anytime. We respect your privacy.
                          </p>
                        </div>
                      </div>

                      {/* ─── Contact Section ─── */}
                      <div className="px-4 md:px-8 py-10 md:py-14">
                        <div className="max-w-3xl mx-auto text-center">
                          <h3
                            className="text-xl md:text-2xl font-bold mb-6"
                            style={{ color: currentTheme.headerText }}
                          >
                            Get in Touch
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { icon: MapPin, label: 'Address', value: '123 Business Street, Mumbai, India' },
                              { icon: Mail, label: 'Email', value: `hello@${storeData.slug || 'store'}.com` },
                              { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex flex-col items-center gap-2 p-4 rounded-xl transition-shadow hover:shadow-sm"
                                style={{ border: `1px solid ${currentTheme.cardBorder}`, backgroundColor: currentTheme.cardBg }}
                              >
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${storeData.primaryColor}12` }}
                                >
                                  <item.icon className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                                </div>
                                <p className="text-sm font-semibold" style={{ color: currentTheme.headerText }}>{item.label}</p>
                                <p className="text-xs" style={{ color: currentTheme.textMuted }}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── Footer ─── */}
                  <div
                    className="px-4 md:px-8 py-10"
                    style={{ backgroundColor: currentTheme.footerBg }}
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      {/* Brand */}
                      <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                          {storeData.logo ? (
                            <img src={storeData.logo} alt="" className="h-6 w-6 rounded" />
                          ) : (
                            <Store className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                          )}
                          <span className="font-bold text-sm" style={{ color: currentTheme.footerText }}>
                            {storeData.name || 'Your Store'}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: currentTheme.footerText, opacity: 0.7 }}>
                          {storeData.description?.substring(0, 100) || 'Your one-stop shop for amazing products.'}
                        </p>
                        <div className="flex items-center gap-2">
                          {[Instagram, Twitter, Facebook].map((Icon, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: `${currentTheme.footerText}20` }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: currentTheme.footerText }} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Links */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: currentTheme.footerText, opacity: 0.5 }}>
                          Shop
                        </p>
                        <div className="space-y-2">
                          {['All Products', 'New Arrivals', 'Best Sellers', 'Sale'].map((item) => (
                            <p key={item} className="text-xs cursor-pointer hover:opacity-80 transition-opacity" style={{ color: currentTheme.footerText, opacity: 0.8 }}>
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Support */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: currentTheme.footerText, opacity: 0.5 }}>
                          Support
                        </p>
                        <div className="space-y-2">
                          {['Contact Us', 'Shipping Policy', 'Returns', 'FAQ'].map((item) => (
                            <p key={item} className="text-xs cursor-pointer hover:opacity-80 transition-opacity" style={{ color: currentTheme.footerText, opacity: 0.8 }}>
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Company */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: currentTheme.footerText, opacity: 0.5 }}>
                          Company
                        </p>
                        <div className="space-y-2">
                          {['About Us', 'Privacy Policy', 'Terms of Service', 'Blog'].map((item) => (
                            <p key={item} className="text-xs cursor-pointer hover:opacity-80 transition-opacity" style={{ color: currentTheme.footerText, opacity: 0.8 }}>
                              {item}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator style={{ backgroundColor: `${currentTheme.footerText}15` }} />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6">
                      <p className="text-xs" style={{ color: currentTheme.footerText, opacity: 0.5 }}>
                        © {new Date().getFullYear()} {storeData.name || 'Your Store'}. All rights reserved.
                      </p>
                      <p className="text-xs flex items-center gap-1" style={{ color: currentTheme.footerText, opacity: 0.5 }}>
                        Powered by <span className="font-semibold" style={{ color: storeData.primaryColor }}>Online Vepar</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Product Detail Sheet ─── */}
      <Sheet open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="sr-only">Product Detail</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="mt-4 space-y-5">
              {/* Product Images */}
              <div className="space-y-3">
                <div
                  className="aspect-square rounded-xl overflow-hidden"
                  style={{ backgroundColor: `${storeData.primaryColor}08` }}
                >
                  <img
                    src={getProductImage(selectedProduct, 0)}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
                {/* Thumbnail row */}
                {getImages(selectedProduct.images).length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {getImages(selectedProduct.images).map((img, i) => (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 cursor-pointer"
                        style={{ borderColor: i === 0 ? storeData.primaryColor : 'transparent' }}
                      >
                        <img
                          src={img}
                          alt={`${selectedProduct.name} ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {selectedProduct.category && (
                  <p className="text-xs font-medium mb-1" style={{ color: storeData.primaryColor }}>
                    {selectedProduct.category}
                  </p>
                )}
                <h2 className="text-lg font-bold">{selectedProduct.name}</h2>
                {/* Rating */}
                {(selectedProduct.avgRating ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={selectedProduct.avgRating ?? 0} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {selectedProduct.avgRating} ({selectedProduct.reviewCount} reviews)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xl font-bold" style={{ color: storeData.primaryColor }}>
                    {formatPrice(selectedProduct.price)}
                  </span>
                  {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                    <>
                      <span className="text-sm line-through text-muted-foreground">
                        {formatPrice(selectedProduct.comparePrice)}
                      </span>
                      <Badge
                        className="text-[10px] px-1.5 py-0 border-0"
                        style={{ backgroundColor: `${storeData.primaryColor}15`, color: storeData.primaryColor }}
                      >
                        {getDiscountPercent(selectedProduct.price, selectedProduct.comparePrice)}% OFF
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {/* Stock Info */}
              {selectedProduct.stock !== undefined && selectedProduct.stock > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${selectedProduct.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className={`text-xs font-medium ${selectedProduct.stock > 10 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedProduct.stock > 10 ? 'In Stock' : `Only ${selectedProduct.stock} left — order soon!`}
                  </p>
                </div>
              )}

              <Separator />

              {/* Quantity & Add to Cart */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Quantity</span>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">1</span>
                    <button className="w-8 h-8 flex items-center justify-center hover:bg-accent transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <Button
                  className="w-full text-white font-semibold h-11"
                  style={{ backgroundColor: storeData.primaryColor }}
                  onClick={() => {
                    handlePreviewAddToCart(selectedProduct)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setProductDetailOpen(false)
                    setView('checkout')
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Live Store
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Shipping</span>
                <span className="flex items-center gap-1"><Award className="w-3 h-3" /> Guaranteed</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Mini Cart Drawer ─── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-sm flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" style={{ color: storeData.primaryColor }} />
              Preview Cart ({cartCount})
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto max-h-[60vh]">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">Cart is empty</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click products to add items</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {cart.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/50"
                    >
                      <div
                        className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: `${storeData.primaryColor}08` }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <Package className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: storeData.primaryColor }}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors text-xs"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors text-xs"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          className="w-6 h-6 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-emerald-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span style={{ color: storeData.primaryColor }}>{formatPrice(cartTotal)}</span>
              </div>
              <Button
                className="w-full text-white font-semibold"
                style={{ backgroundColor: storeData.primaryColor }}
                onClick={() => {
                  setCartOpen(false)
                  setView('checkout')
                }}
              >
                Open Live Store to Checkout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={clearCart}
              >
                Clear Cart
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Product Card Component ───
function ProductCard({
  product,
  storeData,
  currentTheme,
  getProductImage,
  formatPrice,
  getDiscountPercent,
  cart,
  onAddToCart,
  onOpenDetail,
  onToggleWishlist,
  isWishlisted,
}: {
  product: Product
  storeData: { primaryColor: string; theme: string }
  currentTheme: any
  getProductImage: (product: Product, index: number) => string
  formatPrice: (price: number) => string
  getDiscountPercent: (price: number, comparePrice?: number) => number
  cart: CartItem[]
  onAddToCart: (product: Product, e?: React.MouseEvent) => void
  onOpenDetail: (product: Product) => void
  onToggleWishlist: (productId: string, e?: React.MouseEvent) => void
  isWishlisted: boolean
}) {
  const discount = getDiscountPercent(product.price, product.comparePrice)
  const inCart = cart.find(c => c.productId === product.id)?.quantity || 0

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.cardBorder}` }}
      onClick={() => onOpenDetail(product)}
    >
      {/* Image Area */}
      <div
        className="aspect-square relative overflow-hidden"
        style={{ backgroundColor: `${storeData.primaryColor}06` }}
      >
        <img
          src={getProductImage(product, 0)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />

        {/* Sale badge */}
        {discount > 0 && (
          <Badge
            className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 border-0"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            {discount}% OFF
          </Badge>
        )}

        {/* Featured badge */}
        {product.featured && discount === 0 && (
          <Badge
            className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 border-0"
            style={{ backgroundColor: storeData.primaryColor, color: '#fff' }}
          >
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            Best Seller
          </Badge>
        )}

        {/* Wishlist button */}
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
          onClick={(e) => onToggleWishlist(product.id, e)}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'
            }`}
          />
        </button>

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span
            className="bg-white text-gray-900 text-xs font-medium px-4 py-2 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick View
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3">
        {/* Category */}
        {product.category && (
          <p className="text-[10px] font-medium mb-1" style={{ color: storeData.primaryColor }}>
            {product.category}
          </p>
        )}

        {/* Name */}
        <h4
          className="font-medium text-sm mb-1.5 line-clamp-2 leading-snug"
          style={{ color: currentTheme.headerText }}
        >
          {product.name}
        </h4>

        {/* Rating */}
        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <StarRating rating={product.avgRating ?? 0} size="sm" />
            <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="font-bold text-sm"
            style={{ color: storeData.primaryColor }}
          >
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs line-through text-muted-foreground">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          className="w-full py-2 text-white text-xs rounded-lg font-medium hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-1.5"
          style={{ backgroundColor: storeData.primaryColor }}
          onClick={(e) => onAddToCart(product, e)}
        >
          {inCart > 0 ? (
            <>
              <Check className="w-3.5 h-3.5" />
              In Cart ({inCart})
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  )
}
