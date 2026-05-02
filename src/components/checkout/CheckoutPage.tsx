'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Trash2, Tag, Store, Package,
  ArrowRight, ArrowLeft, Check, Loader2, X, ShoppingBag,
  MapPin, Mail, Phone, User, Search, Star, ChevronRight,
  Heart, Share2, Truck, Shield, RotateCcw,
  Twitter, Instagram, Linkedin, Youtube, ArrowUpRight,
  ChevronDown, Menu, Eye, Sparkles, Clock, Zap, Gift,
  ExternalLink, CreditCard, Lock, MessageSquare, ChevronUp,
  Filter, SlidersHorizontal, Grid3X3, LayoutList
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore, type CartItem } from '@/lib/store'

// ─────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────
interface StorefrontProduct {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  comparePrice?: number
  images: string[]
  sku?: string
  stock: number
  trackInventory: boolean
  featured: boolean
  category?: string
  tags: string[]
  variants?: StorefrontVariant[]
  avgRating?: number
  reviewCount?: number
}

interface StorefrontVariant {
  id: string
  name: string
  sku?: string
  price?: number
  comparePrice?: number
  stock: number
  options: Record<string, string>
  position: number
  isActive: boolean
}

interface StorefrontStore {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  banner?: string
  theme: string
  primaryColor: string
  currency: string
}

interface DiscountResult {
  valid: boolean
  discount?: {
    id: string
    code: string
    name: string
    type: string
    value: number
    discountAmount: number
  }
  error?: string
}

interface OrderResult {
  success: boolean
  order: {
    id: string
    orderNumber: string
    status: string
    subtotal: number
    discount: number
    total: number
    currency: string
    items: { name: string; price: number; quantity: number; total: number }[]
  }
}

type StoreView = 'home' | 'product' | 'checkout' | 'confirmation'

// ─────────────────────────────────────────────
// STAR RATING COMPONENT
// ─────────────────────────────────────────────
function StarRating({ rating, count, size = 'sm' }: { rating: number; count?: number; size?: 'sm' | 'md' | 'lg' }) {
  const starSize = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${starSize} ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={`${size === 'lg' ? 'text-base' : size === 'md' ? 'text-sm' : 'text-xs'} text-muted-foreground ml-1`}>
          {count > 0 ? `(${count})` : ''}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// PRODUCT CARD COMPONENT
// ─────────────────────────────────────────────
function ProductCard({
  product,
  primaryColor,
  currencySymbol,
  onOpen,
  onAddToCart,
  inCart,
  isAdded,
}: {
  product: StorefrontProduct
  primaryColor: string
  currencySymbol: string
  onOpen: (p: StorefrontProduct) => void
  onAddToCart: (p: StorefrontProduct) => void
  inCart: number
  isAdded: boolean
}) {
  const outOfStock = product.trackInventory && product.stock <= 0
  const onSale = product.comparePrice && product.comparePrice > product.price
  const discountPercent = onSale ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100) : 0
  const formatPrice = (price: number) => `${currencySymbol}${price.toLocaleString('en-IN')}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group ${isAdded ? 'scale-[1.02]' : ''} transition-transform`}
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/50 hover:border-border/80 cursor-pointer bg-card">
        {/* Product Image */}
        <div
          className="aspect-square relative overflow-hidden bg-gray-50 dark:bg-gray-900"
          onClick={() => onOpen(product)}
        >
          {product.images?.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/15" />
            </div>
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {onSale && (
              <Badge className="text-white border-0 text-[10px] font-bold" style={{ backgroundColor: '#ef4444' }}>
                -{discountPercent}%
              </Badge>
            )}
            {outOfStock && (
              <Badge className="bg-gray-800/90 text-white border-0 text-[10px]">Sold Out</Badge>
            )}
            {product.featured && !onSale && !outOfStock && (
              <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: primaryColor }}>
                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Featured
              </Badge>
            )}
          </div>

          {/* Quick action buttons on hover */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <button className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Heart className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Quick add on hover (desktop) */}
          {!outOfStock && (
            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Button
                className="w-full h-10 text-white text-sm font-medium shadow-xl backdrop-blur-sm"
                style={{ backgroundColor: primaryColor }}
                onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4" onClick={() => onOpen(product)}>
          {/* Category */}
          {product.category && (
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-1">
              {product.category}
            </p>
          )}

          {/* Rating */}
          {(product.avgRating ?? 0) > 0 && (
            <div className="mb-1">
              <StarRating rating={product.avgRating || 0} count={product.reviewCount} />
            </div>
          )}

          <h3 className="font-semibold text-sm line-clamp-2 leading-snug mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="font-bold text-base" style={{ color: primaryColor }}>
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(product.comparePrice!)}
              </span>
            )}
          </div>

          {/* Cart indicator */}
          {inCart > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit"
              style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
            >
              <Check className="w-3 h-3" />
              {inCart} in cart
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// MAIN CHECKOUT PAGE COMPONENT
// ─────────────────────────────────────────────
export default function CheckoutPage() {
  const { currentStore, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, setView } = useAppStore()

  // Data state
  const [storeData, setStoreData] = useState<StorefrontStore | null>(null)
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // View state
  const [storeView, setStoreView] = useState<StoreView>('home')
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null)
  const [addedProductId, setAddedProductId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Discount state
  const [discountCode, setDiscountCode] = useState('')
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  // Checkout form
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', zip: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Filters & search
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'featured'>('featured')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Cart drawer
  const [cartOpen, setCartOpen] = useState(false)

  // Product detail state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [productTab, setProductTab] = useState('description')

  // Sticky header
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerScrolled, setHeaderScrolled] = useState(false)

  // ─────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────
  const fetchStorefront = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      setError('No store selected. Go back to the dashboard and select a store first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/storefront?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setStoreData(data.store)
        setProducts(data.products || [])
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to load store. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id])

  useEffect(() => {
    fetchStorefront()
  }, [fetchStorefront, retryCount])

  const handleRetry = () => setRetryCount((prev) => prev + 1)

  // Scroll detection for sticky header
  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // ─────────────────────────────────────────────
  // COMPUTED VALUES
  // ─────────────────────────────────────────────
  const primaryColor = storeData?.primaryColor || '#10b981'
  const currencySymbol = storeData?.currency === 'INR' ? '\u20B9' : storeData?.currency === 'USD' ? '$' : storeData?.currency === 'EUR' ? '\u20AC' : '\u20B9'

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = discountResult?.valid && discountResult.discount ? discountResult.discount.discountAmount : 0
  const total = Math.max(subtotal - discountAmount, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const formatPrice = (price: number) => `${currencySymbol}${price.toLocaleString('en-IN')}`

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]
  const featuredProducts = products.filter(p => p.featured)
  const onSaleProducts = products.filter(p => p.comparePrice && p.comparePrice > p.price)

  const filteredProducts = products
    .filter(p => {
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase()) || p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
      return 0
    })

  const relatedProducts = selectedProduct
    ? products.filter(p => p.id !== selectedProduct.id && (p.category === selectedProduct.category || p.tags?.some(t => selectedProduct.tags?.includes(t)))).slice(0, 4)
    : []

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────
  const showToast = (msg: string) => setToastMessage(msg)

  const handleAddToCart = (product: StorefrontProduct, qty: number = 1) => {
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: qty,
      image: product.images?.[0] || undefined,
      sku: product.sku || undefined,
    }
    addToCart(item)
    setAddedProductId(product.id)
    showToast(`${product.name} added to cart!`)
    setTimeout(() => setAddedProductId(null), 800)
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim() || !storeData?.id) return
    setValidatingDiscount(true)
    setDiscountResult(null)
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, storeId: storeData.id, subtotal }),
      })
      const data = await res.json()
      setDiscountResult(data)
    } catch {
      setDiscountResult({ valid: false, error: 'Failed to validate discount code' })
    } finally {
      setValidatingDiscount(false)
    }
  }

  const removeDiscount = () => {
    setDiscountCode('')
    setDiscountResult(null)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!customerForm.name.trim()) errors.name = 'Name is required'
    if (!customerForm.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) errors.email = 'Invalid email'
    if (!customerForm.phone.trim()) errors.phone = 'Phone is required'
    if (!customerForm.address.trim()) errors.address = 'Address is required'
    if (!customerForm.city.trim()) errors.city = 'City is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePlaceOrder = async () => {
    if (!validateForm() || !storeData?.id) return
    setPlacingOrder(true)
    try {
      const res = await fetch('/api/storefront/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeData.id,
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          customer: customerForm,
          discountCode: discountResult?.valid ? discountCode : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOrderResult(data)
        setStoreView('confirmation')
        clearCart()
        removeDiscount()
      } else {
        setFormErrors({ general: data.error || 'Failed to place order' })
      }
    } catch {
      setFormErrors({ general: 'Network error. Please try again.' })
    } finally {
      setPlacingOrder(false)
    }
  }

  const getCartItemQuantity = (productId: string) => cart.find((c) => c.productId === productId)?.quantity || 0

  const openProductDetail = (product: StorefrontProduct) => {
    setSelectedProduct(product)
    setSelectedImageIndex(0)
    setQuantity(1)
    setProductTab('description')
    setStoreView('product')
    window.scrollTo(0, 0)
  }

  const goHome = () => {
    setStoreView('home')
    setSelectedProduct(null)
    window.scrollTo(0, 0)
  }

  // ─────────────────────────────────────────────
  // SHARED COMPONENTS
  // ─────────────────────────────────────────────

  // STORE HEADER
  const StoreHeader = () => (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        headerScrolled
          ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg shadow-md'
          : 'bg-white dark:bg-gray-950'
      } border-b border-border`}
    >
      {/* Top announcement bar */}
      <div
        className="text-center py-1.5 text-white text-xs font-medium"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2">
          <Zap className="w-3 h-3" />
          <span>Free shipping on all orders! Use code WELCOME10 for 10% off</span>
          <Zap className="w-3 h-3" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Store Name */}
          <button
            onClick={goHome}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            {storeData?.logo ? (
              <img src={storeData.logo} alt="" className="h-9 w-9 rounded-lg object-contain" />
            ) : (
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {storeData?.name?.charAt(0) || 'S'}
              </div>
            )}
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-none block">{storeData?.name || 'Store'}</span>
              <span className="text-[10px] text-muted-foreground leading-none">by Online Vepar</span>
            </div>
          </button>

          {/* Desktop Navigation with categories */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={goHome}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
            >
              Shop
            </button>
            {categories.filter(c => c !== 'all').slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' }) }}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <div className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-64 text-sm bg-accent/30 border-transparent focus:border-border focus:bg-background transition-colors"
              />
            </div>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="w-5 h-5 text-muted-foreground" />
            </Button>

            {/* Cart button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] text-white font-bold rounded-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </motion.div>
              )}
            </Button>

            {/* Back to Dashboard - always visible */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-medium h-8 ml-1"
              onClick={() => setView('dashboard')}
              style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden pb-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden border-t border-border"
            >
              <div className="py-3 space-y-1">
                <button
                  onClick={() => { goHome(); setMobileMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-accent/50 rounded-lg transition-colors"
                >
                  Home
                </button>
                <button
                  onClick={() => { document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                >
                  All Products
                </button>
                {categories.filter(c => c !== 'all').map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false) }}
                    className="block w-full text-left px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
                  >
                    {cat}
                  </button>
                ))}
                <Separator className="my-2" />
                <button
                  onClick={() => { setView('dashboard'); setMobileMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-accent/50 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: primaryColor }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )

  // CART DRAWER
  const CartDrawer = () => (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
            Your Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}10` }}>
                <ShoppingBag className="w-10 h-10" style={{ color: primaryColor }} />
              </div>
              <p className="font-semibold text-lg mb-1">Your cart is empty</p>
              <p className="text-muted-foreground text-sm mb-6">Browse products and add items to your cart</p>
              <Button
                className="text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card hover:shadow-sm transition-shadow"
                  >
                    <div
                      className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <Package className="w-6 h-6" style={{ color: primaryColor }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{item.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: primaryColor }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors ml-1"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            {/* Discount Code */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Discount code</span>
              </div>
              {discountResult?.valid && discountResult.discount ? (
                <div className="flex items-center gap-2 p-2.5 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300 flex-1">
                    {discountResult.discount.name} (-{formatPrice(discountResult.discount.discountAmount)})
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removeDiscount}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      className="h-9 text-sm"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount() }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount || !discountCode.trim()}
                      className="h-9 px-4 shrink-0"
                    >
                      {validatingDiscount ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {discountResult && !discountResult.valid && discountResult.error && (
                    <p className="text-xs text-destructive">{discountResult.error}</p>
                  )}
                </>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-green-600 dark:text-green-400">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-xl" style={{ color: primaryColor }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full text-white font-semibold h-12 text-sm shadow-lg"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setCartOpen(false)
                setStoreView('checkout')
                window.scrollTo(0, 0)
              }}
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Ship</span>
              <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Returns</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )

  // STORE FOOTER
  const StoreFooter = () => (
    <footer className="bg-gray-900 dark:bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {storeData?.logo ? (
                <img src={storeData.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: primaryColor }}>
                  {storeData?.name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="font-bold text-white text-lg">{storeData?.name || 'Store'}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              {storeData?.description || 'Welcome to our store. Discover amazing products curated just for you.'}
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {['Home', 'Shop', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <button onClick={goHome} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2.5">
              {['Shipping Policy', 'Return Policy', 'FAQ', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-3">Get special offers and new arrivals</p>
            <div className="flex gap-2">
              <Input
                placeholder="Your email"
                className="h-9 text-sm bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button
                size="sm"
                className="h-9 px-4 text-white shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} {storeData?.name || 'Store'}. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>Online Vepar</span>
          </p>
        </div>
      </div>
    </footer>
  )

  // TOAST NOTIFICATION
  const ToastNotification = () => (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[100] px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-4 h-4" />
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ─────────────────────────────────────────────
  // CONFIRMATION VIEW
  // ─────────────────────────────────────────────
  if (storeView === 'confirmation' && orderResult) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Check className="w-12 h-12" style={{ color: primaryColor }} />
            </motion.div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-8">Thank you for your purchase</p>

            <Card className="p-6 text-left mb-6 shadow-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Order Number</span>
                  <span className="font-mono font-bold text-lg" style={{ color: primaryColor }}>
                    {orderResult.order.orderNumber}
                  </span>
                </div>
                <Separator />
                {orderResult.order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} &times; {item.quantity}</span>
                    <span className="font-medium">{formatPrice(item.total)}</span>
                  </div>
                ))}
                <Separator />
                {orderResult.order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Discount</span>
                    <span className="font-medium">-{formatPrice(orderResult.order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>{formatPrice(orderResult.order.total)}</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground mb-6 flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5" /> A confirmation email has been sent to your email address.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={goHome}>
                Continue Shopping
              </Button>
              <Button
                className="flex-1 text-white h-11"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setView('dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </div>
          </motion.div>
        </main>
        <CartDrawer />
        <ToastNotification />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // CHECKOUT VIEW
  // ─────────────────────────────────────────────
  if (storeView === 'checkout') {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <button onClick={goHome} className="hover:text-foreground transition-colors">Home</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Checkout</span>
            </nav>

            {/* Checkout Steps Indicator */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Cart</span>
              </div>
              <div className="flex-1 h-0.5 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Details</span>
              </div>
              <div className="flex-1 h-0.5 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground text-sm font-bold">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm text-muted-foreground">Confirm</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Customer Details Form */}
              <div className="lg:col-span-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Shipping Details</h2>
                      <p className="text-xs text-muted-foreground">Where should we deliver your order?</p>
                    </div>
                  </div>

                  {formErrors.general && (
                    <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {formErrors.general}
                    </div>
                  )}

                  <Card className="p-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Full Name *
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className={`h-11 ${formErrors.name ? 'border-destructive' : ''}`}
                      />
                      {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" /> Email *
                        </label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={customerForm.email}
                          onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                          className={`h-11 ${formErrors.email ? 'border-destructive' : ''}`}
                        />
                        {formErrors.email && <p className="text-xs text-destructive mt-1">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" /> Phone *
                        </label>
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          className={`h-11 ${formErrors.phone ? 'border-destructive' : ''}`}
                        />
                        {formErrors.phone && <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" /> Address *
                      </label>
                      <Input
                        placeholder="123 Main Street, Apt 4"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className={`h-11 ${formErrors.address ? 'border-destructive' : ''}`}
                      />
                      {formErrors.address && <p className="text-xs text-destructive mt-1">{formErrors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5">City *</label>
                        <Input
                          placeholder="Mumbai"
                          value={customerForm.city}
                          onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                          className={`h-11 ${formErrors.city ? 'border-destructive' : ''}`}
                        />
                        {formErrors.city && <p className="text-xs text-destructive mt-1">{formErrors.city}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5">State</label>
                        <Input
                          placeholder="Maharashtra"
                          value={customerForm.state}
                          onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium mb-1.5">Zip Code</label>
                        <Input
                          placeholder="400001"
                          value={customerForm.zip}
                          onChange={(e) => setCustomerForm({ ...customerForm, zip: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Trust badges */}
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { icon: Shield, label: 'Secure Checkout' },
                      { icon: Truck, label: 'Free Shipping' },
                      { icon: RotateCcw, label: '30-Day Returns' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                        <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-6 sticky top-32 shadow-lg">
                    <h3 className="font-bold text-lg mb-4">Order Summary</h3>

                    <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative"
                            style={{ backgroundColor: `${primaryColor}10` }}
                          >
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <Package className="w-5 h-5" style={{ color: primaryColor }} />
                            )}
                            <span
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{formatPrice(item.price)} each</p>
                          </div>
                          <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg pt-1">
                        <span>Total</span>
                        <span style={{ color: primaryColor }}>{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full text-white font-semibold h-12 text-sm shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                      onClick={handlePlaceOrder}
                      disabled={placingOrder}
                    >
                      {placingOrder ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...</>
                      ) : (
                        <><Lock className="w-4 h-4 mr-2" /> Place Order &mdash; {formatPrice(total)}</>
                      )}
                    </Button>

                    <button
                      onClick={() => { setStoreView('home'); setCartOpen(true) }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Edit Cart
                    </button>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
        <StoreFooter />
        <CartDrawer />
        <ToastNotification />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // PRODUCT DETAIL VIEW
  // ─────────────────────────────────────────────
  if (storeView === 'product' && selectedProduct) {
    const inCart = getCartItemQuantity(selectedProduct.id)
    const outOfStock = selectedProduct.trackInventory && selectedProduct.stock <= 0
    const onSale = selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price
    const discountPercent = onSale ? Math.round(((selectedProduct.comparePrice! - selectedProduct.price) / selectedProduct.comparePrice!) * 100) : 0

    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 md:mb-8">
            <button onClick={goHome} className="hover:text-foreground transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            {selectedProduct.category && (
              <>
                <button onClick={goHome} className="hover:text-foreground transition-colors">{selectedProduct.category}</button>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[200px]">{selectedProduct.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 relative border border-border/30"
              >
                {selectedProduct.images?.length > 0 ? (
                  <img
                    src={selectedProduct.images[selectedImageIndex] || selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-32 h-32 text-muted-foreground/15" />
                  </div>
                )}
                {onSale && (
                  <Badge className="absolute top-4 left-4 text-white border-0 text-sm px-3 py-1" style={{ backgroundColor: '#ef4444' }}>
                    -{discountPercent}% OFF
                  </Badge>
                )}
              </motion.div>

              {/* Thumbnail Gallery */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {selectedProduct.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${
                        i === selectedImageIndex
                          ? 'shadow-md scale-105'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 opacity-70 hover:opacity-100'
                      }`}
                      style={i === selectedImageIndex ? { borderColor: primaryColor } : undefined}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-5">
              {/* Category */}
              {selectedProduct.category && (
                <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
                  {selectedProduct.category}
                </p>
              )}

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">{selectedProduct.name}</h1>

              {/* Rating */}
              {(selectedProduct.avgRating ?? 0) > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating rating={selectedProduct.avgRating || 0} count={selectedProduct.reviewCount} size="md" />
                  <span className="text-sm text-muted-foreground">{selectedProduct.avgRating?.toFixed(1)} out of 5</span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(selectedProduct.price)}
                </span>
                {onSale && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(selectedProduct.comparePrice!)}
                    </span>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 font-bold">
                      Save {discountPercent}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Description - brief */}
              {selectedProduct.description && (
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {selectedProduct.description}
                </p>
              )}

              {/* SKU & Stock */}
              <div className="flex items-center gap-4 text-sm">
                {selectedProduct.sku && (
                  <span className="text-muted-foreground">SKU: <span className="font-mono font-medium">{selectedProduct.sku}</span></span>
                )}
                {selectedProduct.trackInventory && (
                  <Badge
                    variant="outline"
                    className={`font-medium ${
                      selectedProduct.stock > 10 ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-400' :
                      selectedProduct.stock > 0 ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400' :
                      'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full mr-1.5 inline-block" style={{ backgroundColor: selectedProduct.stock > 10 ? '#22c55e' : selectedProduct.stock > 0 ? '#f59e0b' : '#ef4444' }} />
                    {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? `Only ${selectedProduct.stock} left` : 'Out of Stock'}
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-xl overflow-hidden">
                  <button
                    className="w-11 h-11 flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-14 text-center font-semibold text-base">{quantity}</span>
                  <button
                    className="w-11 h-11 flex items-center justify-center hover:bg-accent transition-colors"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 h-11 text-white font-semibold text-sm shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                  disabled={outOfStock}
                  onClick={() => {
                    handleAddToCart(selectedProduct, quantity)
                    setQuantity(1)
                  }}
                >
                  {outOfStock ? 'Out of Stock' : inCart > 0 ? `Add ${quantity} More to Cart` : 'Add to Cart'}
                  <ShoppingCart className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl hidden sm:flex">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {inCart > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl border"
                  style={{ borderColor: `${primaryColor}30`, backgroundColor: `${primaryColor}08` }}
                >
                  <Check className="w-4 h-4" style={{ color: primaryColor }} />
                  <span className="text-sm">
                    <span className="font-semibold" style={{ color: primaryColor }}>{inCart}</span> already in your cart
                  </span>
                  <button
                    onClick={() => setCartOpen(true)}
                    className="ml-auto text-sm underline font-medium hover:no-underline"
                    style={{ color: primaryColor }}
                  >
                    View Cart
                  </button>
                </motion.div>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[
                  { icon: Truck, label: 'Free Shipping', desc: 'On all orders' },
                  { icon: RotateCcw, label: '30-Day Returns', desc: 'Hassle free' },
                  { icon: Shield, label: 'Secure Payment', desc: 'SSL encrypted' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                    <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Tabs: Description / Reviews / Shipping */}
              <Tabs value={productTab} onValueChange={setProductTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1">
                    Reviews {(selectedProduct.reviewCount ?? 0) > 0 && `(${selectedProduct.reviewCount})`}
                  </TabsTrigger>
                  <TabsTrigger value="shipping" className="flex-1">Shipping</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="mt-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedProduct.description || 'No description available for this product.'}
                  </p>
                  {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="reviews" className="mt-4">
                  {(selectedProduct.reviewCount ?? 0) > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                        <div className="text-center">
                          <p className="text-3xl font-bold" style={{ color: primaryColor }}>{selectedProduct.avgRating?.toFixed(1)}</p>
                          <StarRating rating={selectedProduct.avgRating || 0} size="sm" />
                          <p className="text-xs text-muted-foreground mt-1">{selectedProduct.reviewCount} reviews</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Reviews are managed in the dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                      <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="shipping" className="mt-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-semibold text-foreground">Free Standard Shipping</p>
                        <p>Delivered in 5-7 business days</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <RotateCcw className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-semibold text-foreground">Easy Returns</p>
                        <p>30-day hassle-free return policy</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-semibold text-foreground">Secure Checkout</p>
                        <p>SSL encrypted payment processing</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">You May Also Like</h2>
                <Button variant="ghost" size="sm" onClick={() => { goHome(); setCategoryFilter(selectedProduct.category || 'all') }} className="text-xs" style={{ color: primaryColor }}>
                  View More <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    primaryColor={primaryColor}
                    currencySymbol={currencySymbol}
                    onOpen={openProductDetail}
                    onAddToCart={handleAddToCart}
                    inCart={getCartItemQuantity(product.id)}
                    isAdded={addedProductId === product.id}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        <StoreFooter />
        <CartDrawer />
        <ToastNotification />
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // ERROR / NO STORE FALLBACK
  // ─────────────────────────────────────────────
  if (!loading && (error || !storeData)) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-emerald-500">S</div>
                <span className="font-bold text-lg">Online Vepar</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-medium"
                onClick={() => setView('dashboard')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Dashboard
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md w-full text-center"
          >
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <Store className="w-12 h-12 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {!currentStore?.id ? 'No Store Selected' : 'Store Not Available'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {error || 'The store could not be loaded. Please go back to the dashboard and try again.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setView('dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              {currentStore?.id && (
                <Button variant="outline" onClick={handleRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              {!currentStore?.id && (
                <Button variant="outline" onClick={() => setView('login')}>
                  Sign In
                </Button>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // LOADING STATE
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm animate-pulse"
                  style={{ backgroundColor: primaryColor }}
                >
                  {currentStore?.name?.charAt(0) || 'S'}
                </div>
                <span className="font-bold text-lg">{currentStore?.name || 'Loading...'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
                <div className="w-9 h-9 rounded-lg bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
            <p className="font-semibold text-lg mb-1">Loading store...</p>
            <p className="text-muted-foreground text-sm">{currentStore?.name || 'Please wait'}</p>
          </div>
        </main>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // HOME / SHOP VIEW (Main Storefront)
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <StoreHeader />

      {/* Hero Banner */}
      {storeData && (
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            {storeData.banner ? (
              <>
                <img
                  src={storeData.banner}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}20, ${primaryColor}08)`,
                }}
              />
            )}
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 lg:py-32">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge
                  className="mb-4 text-white border-0 font-medium px-3 py-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Sparkles className="w-3 h-3 mr-1" /> New Collection
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900 dark:text-white leading-tight">
                  {storeData.name}
                </h1>
                <p className="text-base md:text-lg max-w-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  {storeData.description || 'Discover amazing products curated just for you. Quality meets style in every piece.'}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Button
                    className="text-white font-semibold h-12 px-8 text-sm shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Shop Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" className="h-12 font-medium bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                    View Collection
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 mt-10">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>{products.length}+</p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>{categories.length - 1}+</p>
                    <p className="text-xs text-muted-foreground">Categories</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: primaryColor }}>Free</p>
                    <p className="text-xs text-muted-foreground">Shipping</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && categoryFilter === 'all' && !searchQuery && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Handpicked favorites just for you</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium"
              style={{ color: primaryColor }}
              onClick={() => setSortBy('featured')}
            >
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                primaryColor={primaryColor}
                currencySymbol={currencySymbol}
                onOpen={openProductDetail}
                onAddToCart={handleAddToCart}
                inCart={getCartItemQuantity(product.id)}
                isAdded={addedProductId === product.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* On Sale Products */}
      {onSaleProducts.length > 0 && categoryFilter === 'all' && !searchQuery && (
        <section className="py-12" style={{ backgroundColor: `${primaryColor}05` }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                  <Tag className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">On Sale</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Don&apos;t miss these deals</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {onSaleProducts.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  primaryColor={primaryColor}
                  currencySymbol={currencySymbol}
                  onOpen={openProductDetail}
                  onAddToCart={handleAddToCart}
                  inCart={getCartItemQuantity(product.id)}
                  isAdded={addedProductId === product.id}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main id="shop-section" className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">All Products</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              {categoryFilter !== 'all' && ` in ${categoryFilter}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode('grid')}
              style={viewMode === 'grid' ? { backgroundColor: primaryColor } : undefined}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMode('list')}
              style={viewMode === 'list' ? { backgroundColor: primaryColor } : undefined}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mb-8 space-y-4">
          {/* Search + Sort row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products, categories, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-44 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  categoryFilter === cat
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={categoryFilter === cat ? { backgroundColor: primaryColor } : undefined}
              >
                {cat === 'all' ? 'All Products' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <Package className="w-12 h-12 text-muted-foreground/20" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No products found</h3>
            <p className="text-sm text-muted-foreground/60 mb-6">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setCategoryFilter('all') }}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => {
              const inCart = getCartItemQuantity(product.id)
              const outOfStock = product.trackInventory && product.stock <= 0
              const onSale = product.comparePrice && product.comparePrice > product.price
              return (
                <Card
                  key={product.id}
                  className="flex items-center gap-4 p-4 hover:shadow-lg transition-shadow cursor-pointer border-border/50 hover:border-border/80"
                  onClick={() => openProductDetail(product)}
                >
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-900 relative">
                    {product.images?.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                    {onSale && (
                      <Badge className="absolute top-2 left-2 text-white border-0 text-[9px]" style={{ backgroundColor: '#ef4444' }}>Sale</Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {product.category && (
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/60 mb-0.5">{product.category}</p>
                    )}
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1 mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                    )}
                    {(product.avgRating ?? 0) > 0 && (
                      <StarRating rating={product.avgRating || 0} count={product.reviewCount} />
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base sm:text-lg" style={{ color: primaryColor }}>{formatPrice(product.price)}</p>
                    {onSale && (
                      <p className="text-xs text-muted-foreground line-through">{formatPrice(product.comparePrice!)}</p>
                    )}
                    {inCart > 0 && (
                      <Badge className="mt-1 text-[10px]" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }} variant="secondary">
                        {inCart} in cart
                      </Badge>
                    )}
                    <Button
                      className="mt-2 h-8 text-xs text-white hidden sm:flex"
                      style={{ backgroundColor: primaryColor }}
                      disabled={outOfStock}
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }}
                    >
                      {outOfStock ? 'Sold Out' : 'Add to Cart'}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                primaryColor={primaryColor}
                currencySymbol={currencySymbol}
                onOpen={openProductDetail}
                onAddToCart={handleAddToCart}
                inCart={getCartItemQuantity(product.id)}
                isAdded={addedProductId === product.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Newsletter Section */}
      <section className="py-16" style={{ backgroundColor: `${primaryColor}08` }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <Gift className="w-10 h-10 mx-auto mb-4" style={{ color: primaryColor }} />
          <h2 className="text-2xl font-bold mb-2">Stay in the Loop</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Subscribe to our newsletter and get 10% off your first order plus exclusive deals.
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="Enter your email"
              className="h-11 bg-white dark:bg-gray-900"
            />
            <Button
              className="h-11 px-6 text-white font-medium shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      <StoreFooter />
      <CartDrawer />
      <ToastNotification />

      {/* Back to top button */}
      {headerScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110"
          style={{ backgroundColor: primaryColor }}
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
