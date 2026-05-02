'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Trash2, Tag, Store, Package,
  ArrowRight, ArrowLeft, Check, Loader2, X, ShoppingBag,
  MapPin, Mail, Phone, User, Search, Star, ChevronRight,
  Home, Info, Heart, Share2, Truck, Shield, RotateCcw,
  Twitter, Instagram, Linkedin, Youtube, ArrowUpRight,
  ChevronDown, Menu
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAppStore, type CartItem } from '@/lib/store'

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
  avgRating?: number
  reviewCount?: number
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

// Star rating display component
function StarRating({ rating, count, size = 'sm' }: { rating: number; count?: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5'
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
        <span className={`${size === 'md' ? 'text-sm' : 'text-xs'} text-muted-foreground ml-1`}>
          ({count})
        </span>
      )}
    </div>
  )
}

export default function CheckoutPage() {
  const { currentStore, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, setView } = useAppStore()

  const [storeData, setStoreData] = useState<StorefrontStore | null>(null)
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
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
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Cart drawer
  const [cartOpen, setCartOpen] = useState(false)

  // Product detail state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  // Sticky header ref
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerScrolled, setHeaderScrolled] = useState(false)

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
  }, [fetchStorefront, retryCount]) // retryCount triggers refetch

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  // Sticky header scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  // Computed values
  const primaryColor = storeData?.primaryColor || '#10b981'
  const currencySymbol = storeData?.currency === 'INR' ? '₹' : storeData?.currency === 'USD' ? '$' : storeData?.currency === 'EUR' ? '€' : '₹'

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = discountResult?.valid && discountResult.discount ? discountResult.discount.discountAmount : 0
  const total = Math.max(subtotal - discountAmount, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const formatPrice = (price: number) => {
    return `${currencySymbol}${price.toLocaleString('en-IN')}`
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
  }

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

  const getCartItemQuantity = (productId: string) => {
    const item = cart.find((c) => c.productId === productId)
    return item?.quantity || 0
  }

  const openProductDetail = (product: StorefrontProduct) => {
    setSelectedProduct(product)
    setSelectedImageIndex(0)
    setQuantity(1)
    setStoreView('product')
    window.scrollTo(0, 0)
  }

  const goHome = () => {
    setStoreView('home')
    setSelectedProduct(null)
    window.scrollTo(0, 0)
  }

  // Filtered & sorted products
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))]
  const filteredProducts = products
    .filter(p => {
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      return 0 // newest (default order)
    })

  // Related products for product detail
  const relatedProducts = selectedProduct
    ? products.filter(p => p.id !== selectedProduct.id && (p.category === selectedProduct.category || p.tags?.some(t => selectedProduct.tags?.includes(t)))).slice(0, 4)
    : []

  // ─────────────────────────────────────────────
  // STORE HEADER (shared across all store views)
  // ─────────────────────────────────────────────
  const StoreHeader = () => (
    <header
      ref={headerRef}
      className={`sticky top-0 z-50 transition-all duration-200 ${
        headerScrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm' : 'bg-white dark:bg-gray-950'
      } border-b border-border`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Store Name */}
          <button
            onClick={goHome}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            {storeData?.logo ? (
              <img src={storeData.logo} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {storeData?.name?.charAt(0) || 'S'}
              </div>
            )}
            <span className="font-bold text-lg hidden sm:block">{storeData?.name || 'Store'}</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home', action: goHome },
              { label: 'Shop', action: goHome },
              { label: 'About', action: () => {} },
              { label: 'Contact', action: () => {} },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side: Search + Cart + Back to Dashboard */}
          <div className="flex items-center gap-2">
            {/* Search (desktop) */}
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 w-56 text-sm"
              />
            </div>

            {/* Wishlist (decorative) */}
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
                <Badge
                  className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-[10px] text-white border-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Back to Dashboard (subtle) */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setView('dashboard')}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden border-t border-border"
            >
              <div className="py-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                {['Home', 'Shop', 'About', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => { goHome(); setMobileMenuOpen(false) }}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => { setView('dashboard'); setMobileMenuOpen(false) }}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )

  // ─────────────────────────────────────────────
  // CART DRAWER (slide-out from right)
  // ─────────────────────────────────────────────
  const CartDrawer = () => (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" style={{ color: primaryColor }} />
            Your Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">Your cart is empty</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Browse products and add items to your cart</p>
              <Button
                className="mt-4 text-white"
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
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-card"
                  >
                    <div
                      className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: `${primaryColor}10` }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <Package className="w-6 h-6" style={{ color: primaryColor }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
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
          <div className="border-t border-border pt-4 mt-4 space-y-3">
            {/* Discount Code */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Discount code</span>
              </div>
              {discountResult?.valid && discountResult.discount ? (
                <div className="flex items-center gap-2 p-2 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
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
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-bold text-base">Total</span>
                <span className="font-bold text-lg" style={{ color: primaryColor }}>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full text-white font-semibold h-12 text-sm"
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

            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Secure checkout
              <span className="mx-1">•</span>
              <Truck className="w-3 h-3" /> Free shipping
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )

  // ─────────────────────────────────────────────
  // STORE FOOTER (shared across all store views)
  // ─────────────────────────────────────────────
  const StoreFooter = () => (
    <footer className="bg-gray-900 dark:bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Store Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {storeData?.logo ? (
                <img src={storeData.logo} alt="" className="h-7 w-7 rounded object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: primaryColor }}>
                  {storeData?.name?.charAt(0) || 'S'}
                </div>
              )}
              <span className="font-bold text-white">{storeData?.name || 'Store'}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {storeData?.description || 'Welcome to our store. Discover amazing products curated just for you.'}
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Twitter, Instagram, Linkedin, Youtube].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {['Home', 'Shop', 'About', 'Contact'].map((item) => (
                <li key={item}>
                  <button onClick={goHome} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-white mb-4">Customer Service</h4>
            <ul className="space-y-2">
              {['Shipping Policy', 'Return Policy', 'FAQ', 'Privacy Policy'].map((item) => (
                <li key={item}>
                  <span className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold text-white mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-3">Subscribe to get special offers and new arrivals</p>
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
            © {new Date().getFullYear()} {storeData?.name || 'Store'}. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Powered by <span className="font-semibold" style={{ color: primaryColor }}>Online Vepar</span>
          </p>
        </div>
      </div>
    </footer>
  )

  // ─────────────────────────────────────────────
  // TOAST NOTIFICATION
  // ─────────────────────────────────────────────
  const ToastNotification = () => (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: primaryColor }}
        >
          <Check className="w-4 h-4" />
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ═══════════════════════════════════════════════
  // CONFIRMATION VIEW
  // ═══════════════════════════════════════════════
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
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Check className="w-10 h-10" style={{ color: primaryColor }} />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">Thank you for your purchase</p>

            <Card className="p-6 text-left mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order Number</span>
                  <span className="font-mono font-bold" style={{ color: primaryColor }}>
                    {orderResult.order.orderNumber}
                  </span>
                </div>
                <Separator />
                {orderResult.order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.total)}</span>
                  </div>
                ))}
                <Separator />
                {orderResult.order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(orderResult.order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>{formatPrice(orderResult.order.total)}</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-muted-foreground mb-4">
              A confirmation email has been sent to your email address.
            </p>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={goHome}>
                Continue Shopping
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setView('dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>
        </main>
        <CartDrawer />
        <ToastNotification />
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // CHECKOUT VIEW
  // ═══════════════════════════════════════════════
  if (storeView === 'checkout') {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <button onClick={goHome} className="hover:text-foreground transition-colors">Home</button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">Checkout</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Customer Details Form */}
              <div className="lg:col-span-3">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="text-xl font-bold mb-6">Shipping Details</h2>

                  {formErrors.general && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" /> Full Name *
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className={formErrors.name ? 'border-destructive' : ''}
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
                          className={formErrors.email ? 'border-destructive' : ''}
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
                          className={formErrors.phone ? 'border-destructive' : ''}
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
                        className={formErrors.address ? 'border-destructive' : ''}
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
                          className={formErrors.city ? 'border-destructive' : ''}
                        />
                        {formErrors.city && <p className="text-xs text-destructive mt-1">{formErrors.city}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5">State</label>
                        <Input
                          placeholder="Maharashtra"
                          value={customerForm.state}
                          onChange={(e) => setCustomerForm({ ...customerForm, state: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium mb-1.5">Zip Code</label>
                        <Input
                          placeholder="400001"
                          value={customerForm.zip}
                          onChange={(e) => setCustomerForm({ ...customerForm, zip: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-6 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure checkout</span>
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Free shipping</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> 30-day returns</span>
                  </div>
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-6 sticky top-20">
                    <h3 className="font-bold mb-4">Order Summary</h3>

                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative"
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
                          <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600">Free</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span style={{ color: primaryColor }}>{formatPrice(total)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full text-white font-medium h-12"
                      style={{ backgroundColor: primaryColor }}
                      onClick={handlePlaceOrder}
                      disabled={placingOrder}
                    >
                      {placingOrder ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Placing Order...</>
                      ) : (
                        <>Place Order — {formatPrice(total)}</>
                      )}
                    </Button>

                    <button
                      onClick={() => { setStoreView('home'); setCartOpen(true) }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
                    >
                      ← Edit Cart
                    </button>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
        <CartDrawer />
        <ToastNotification />
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // PRODUCT DETAIL VIEW
  // ═══════════════════════════════════════════════
  if (storeView === 'product' && selectedProduct) {
    const inCart = getCartItemQuantity(selectedProduct.id)
    const outOfStock = selectedProduct.trackInventory && selectedProduct.stock <= 0
    const onSale = selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price
    const discountPercent = onSale ? Math.round(((selectedProduct.comparePrice! - selectedProduct.price) / selectedProduct.comparePrice!) * 100) : 0

    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <button onClick={goHome} className="hover:text-foreground transition-colors">Home</button>
            <ChevronRight className="w-3 h-3" />
            {selectedProduct.category && (
              <>
                <button onClick={goHome} className="hover:text-foreground transition-colors">{selectedProduct.category}</button>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-xs">{selectedProduct.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Product Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 relative"
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
                    <Package className="w-24 h-24 text-muted-foreground/20" />
                  </div>
                )}
                {onSale && (
                  <Badge className="absolute top-4 left-4 text-white" style={{ backgroundColor: primaryColor }}>
                    -{discountPercent}%
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
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        i === selectedImageIndex
                          ? 'border-emerald-500 shadow-sm'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                {selectedProduct.category && (
                  <p className="text-sm font-medium mb-2" style={{ color: primaryColor }}>
                    {selectedProduct.category}
                  </p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold">{selectedProduct.name}</h1>
              </div>

              {/* Rating */}
              {(selectedProduct.avgRating ?? 0) > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating rating={selectedProduct.avgRating || 0} count={selectedProduct.reviewCount} size="md" />
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
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">
                      Save {discountPercent}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {selectedProduct.description}
                </p>
              )}

              {/* SKU & Stock */}
              <div className="flex items-center gap-4 text-sm">
                {selectedProduct.sku && (
                  <span className="text-muted-foreground">SKU: <span className="font-mono">{selectedProduct.sku}</span></span>
                )}
                {selectedProduct.trackInventory && (
                  <span className={selectedProduct.stock > 10 ? 'text-green-600' : selectedProduct.stock > 0 ? 'text-amber-600' : 'text-red-600'}>
                    {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? `Only ${selectedProduct.stock} left` : 'Out of Stock'}
                  </span>
                )}
              </div>

              <Separator />

              {/* Quantity + Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors rounded-l-lg"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    className="w-10 h-10 flex items-center justify-center hover:bg-accent transition-colors rounded-r-lg"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  className="flex-1 h-12 text-white font-semibold text-sm"
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
                <Button variant="outline" size="icon" className="h-12 w-12 shrink-0">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {inCart > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium" style={{ color: primaryColor }}>{inCart}</span> already in your cart
                  <button
                    onClick={() => setCartOpen(true)}
                    className="ml-2 underline hover:no-underline"
                    style={{ color: primaryColor }}
                  >
                    View Cart
                  </button>
                </p>
              )}

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { icon: Truck, label: 'Free Shipping' },
                  { icon: RotateCcw, label: '30-Day Returns' },
                  { icon: Shield, label: 'Secure Payment' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 text-center">
                    <Icon className="w-5 h-5" style={{ color: primaryColor }} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
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

  // ═══════════════════════════════════════════════
  // HOME / SHOP VIEW (main storefront)
  // ═══════════════════════════════════════════════

  // Product Card Component
  const ProductCard = ({ product }: { product: StorefrontProduct }) => {
    const inCart = getCartItemQuantity(product.id)
    const outOfStock = product.trackInventory && product.stock <= 0
    const onSale = product.comparePrice && product.comparePrice > product.price
    const isAdded = addedProductId === product.id

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`group ${isAdded ? 'added-to-cart-pop' : ''}`}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-border/50 hover:border-border cursor-pointer">
          {/* Product Image */}
          <div
            className="aspect-square relative overflow-hidden"
            style={{ backgroundColor: `${primaryColor}08` }}
            onClick={() => openProductDetail(product)}
          >
            {product.images?.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/20" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {onSale && (
                <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: '#ef4444' }}>
                  Sale
                </Badge>
              )}
              {outOfStock && (
                <Badge className="bg-gray-800 text-white border-0 text-[10px]">Sold Out</Badge>
              )}
              {product.featured && !onSale && (
                <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: primaryColor }}>
                  Featured
                </Badge>
              )}
            </div>

            {/* Quick add on hover (desktop) */}
            {!outOfStock && (
              <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  className="w-full h-9 text-white text-xs font-medium shadow-lg"
                  style={{ backgroundColor: primaryColor }}
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product) }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4" onClick={() => openProductDetail(product)}>
            {/* Rating */}
            {(product.avgRating ?? 0) > 0 && (
              <div className="mb-1.5">
                <StarRating rating={product.avgRating || 0} count={product.reviewCount} />
              </div>
            )}

            <h3 className="font-medium text-sm line-clamp-2 leading-snug mb-1.5 group-hover:text-emerald-600 transition-colors">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2">
              <span className="font-bold" style={{ color: primaryColor }}>
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
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: primaryColor }}>
                <Check className="w-3 h-3" />
                <span className="font-medium">{inCart} in cart</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════
  // ERROR / NO STORE FALLBACK
  // ═══════════════════════════════════════════════
  if (!loading && (error || !storeData)) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-emerald-500">
                  S
                </div>
                <span className="font-bold text-lg">Online Vepar</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
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
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20">
              <Store className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {!currentStore?.id ? 'No Store Selected' : 'Store Not Available'}
            </h1>
            <p className="text-muted-foreground mb-6">
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

  // ═══════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════
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
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: primaryColor }} />
            <p className="text-muted-foreground font-medium">Loading store...</p>
            <p className="text-muted-foreground/60 text-sm mt-1">{currentStore?.name || 'Please wait'}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <StoreHeader />

      {/* Hero Banner */}
      {storeData && (
        <section
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}25, ${primaryColor}10)` }}
        >
          {storeData.banner && (
            <div className="absolute inset-0 opacity-20">
              <img
                src={storeData.banner}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900 dark:text-white">
              {storeData.name}
            </h1>
            <p className="text-sm md:text-base max-w-lg mx-auto text-gray-600 dark:text-gray-300">
              {storeData.description || 'Welcome to our store. Discover amazing products curated just for you.'}
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                className="text-white font-medium"
                style={{ backgroundColor: primaryColor }}
                onClick={() => document.getElementById('shop-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main id="shop-section" className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">All Products</h2>
          <Badge variant="secondary" className="text-xs">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Search, Category Filters, Sort */}
        <div className="mb-8 space-y-4">
          {/* Search + Sort row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-10 pl-4 pr-10 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? 'text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                style={categoryFilter === cat ? { backgroundColor: primaryColor } : undefined}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-xl mb-3" />
                <div className="space-y-2 px-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 mx-auto text-muted-foreground/15 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-1">No products found</h3>
            <p className="text-sm text-muted-foreground/60">Try adjusting your search or filters</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setCategoryFilter('all') }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <StoreFooter />
      <CartDrawer />
      <ToastNotification />
    </div>
  )
}
