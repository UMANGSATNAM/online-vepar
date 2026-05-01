'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Trash2, Tag, Store, Package,
  ArrowRight, ArrowLeft, Check, Loader2, X, ShoppingBag,
  MapPin, Mail, Phone, User
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
  SheetTrigger,
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

type CheckoutStep = 'products' | 'cart' | 'checkout' | 'confirmation'

export default function CheckoutPage() {
  const { currentStore, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, setView } = useAppStore()

  const [storeData, setStoreData] = useState<StorefrontStore | null>(null)
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<CheckoutStep>('products')
  const [addedProductId, setAddedProductId] = useState<string | null>(null)

  // Discount state
  const [discountCode, setDiscountCode] = useState('')
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null)
  const [validatingDiscount, setValidatingDiscount] = useState(false)

  // Checkout form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Mobile cart sheet
  const [cartOpen, setCartOpen] = useState(false)

  const fetchStorefront = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/storefront?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setStoreData(data.store)
        setProducts(data.products || [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id])

  useEffect(() => {
    fetchStorefront()
  }, [fetchStorefront])

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

  const handleAddToCart = (product: StorefrontProduct) => {
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || undefined,
      sku: product.sku || undefined,
    }
    addToCart(item)
    setAddedProductId(product.id)
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
        body: JSON.stringify({
          code: discountCode,
          storeId: storeData.id,
          subtotal,
        }),
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
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customer: customerForm,
          discountCode: discountResult?.valid ? discountCode : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setOrderResult(data)
        setStep('confirmation')
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

  // Theme styles
  const themeStyles: Record<string, { bg: string; headerBg: string; headerText: string; cardBg: string; cardBorder: string; footerBg: string; footerText: string }> = {
    modern: {
      bg: 'bg-white dark:bg-gray-950',
      headerBg: 'bg-white dark:bg-gray-950',
      headerText: 'text-gray-900 dark:text-white',
      cardBg: 'bg-white dark:bg-gray-900',
      cardBorder: 'border-gray-200 dark:border-gray-800',
      footerBg: 'bg-gray-900 dark:bg-black',
      footerText: 'text-gray-300',
    },
    classic: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      headerBg: 'bg-amber-50 dark:bg-amber-950',
      headerText: 'text-amber-900 dark:text-amber-100',
      cardBg: 'bg-amber-50 dark:bg-amber-900',
      cardBorder: 'border-amber-200 dark:border-amber-800',
      footerBg: 'bg-amber-900 dark:bg-amber-950',
      footerText: 'text-amber-200',
    },
    minimal: {
      bg: 'bg-white dark:bg-gray-950',
      headerBg: 'bg-white dark:bg-gray-950',
      headerText: 'text-gray-900 dark:text-white',
      cardBg: 'bg-white dark:bg-gray-900',
      cardBorder: 'border-gray-100 dark:border-gray-800',
      footerBg: 'bg-gray-50 dark:bg-gray-900',
      footerText: 'text-gray-500',
    },
    bold: {
      bg: 'bg-gray-900 dark:bg-black',
      headerBg: 'bg-gray-800 dark:bg-gray-950',
      headerText: 'text-white',
      cardBg: 'bg-gray-800 dark:bg-gray-900',
      cardBorder: 'border-gray-700 dark:border-gray-800',
      footerBg: 'bg-black dark:bg-gray-950',
      footerText: 'text-gray-400',
    },
  }

  const currentTheme = themeStyles[storeData?.theme || 'modern'] || themeStyles.modern

  // Cart content component (reused in mobile sheet)
  const CartContent = () => (
    <div className="space-y-4">
      {cart.length === 0 ? (
        <div className="text-center py-8">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Your cart is empty</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Browse products and add items to your cart</p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20"
              >
                <div
                  className="w-12 h-12 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: `${primaryColor}10` }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <Package className="w-5 h-5" style={{ color: primaryColor }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Separator />

          {/* Discount Code */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Have a coupon?</span>
            </div>
            {discountResult?.valid && discountResult.discount ? (
              <div className="flex items-center gap-2 p-2 rounded-md border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
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
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="h-9 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount() }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyDiscount}
                    disabled={validatingDiscount || !discountCode.trim()}
                    className="h-9 px-4"
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
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">Discount</span>
                <span className="text-green-600 dark:text-green-400 font-medium">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg" style={{ color: primaryColor }}>{formatPrice(total)}</span>
            </div>
          </div>

          {step === 'products' && cart.length > 0 && (
            <Button
              className="w-full text-white font-medium"
              style={{ backgroundColor: primaryColor }}
              onClick={() => {
                setStep('checkout')
                setCartOpen(false)
              }}
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </>
      )}
    </div>
  )

  // Confirmation page
  if (step === 'confirmation' && orderResult) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: currentTheme.bg.includes('950') ? '#030712' : undefined }}>
        {/* Header */}
        <header className={`border-b ${currentTheme.headerBg} ${currentTheme.headerText} px-4 md:px-8 py-4`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              {storeData?.logo ? (
                <img src={storeData.logo} alt="" className="h-8 w-8 rounded object-contain" />
              ) : (
                <Store className="w-6 h-6" style={{ color: primaryColor }} />
              )}
              <span className="font-bold text-lg">{storeData?.name || 'Store'}</span>
            </div>
          </div>
        </header>

        {/* Confirmation */}
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
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStep('products')
                  setOrderResult(null)
                }}
              >
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
      </div>
    )
  }

  // Checkout form
  if (step === 'checkout') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: currentTheme.bg.includes('950') ? '#030712' : undefined }}>
        {/* Header */}
        <header className={`border-b ${currentTheme.headerBg} ${currentTheme.headerText} px-4 md:px-8 py-4`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              {storeData?.logo ? (
                <img src={storeData.logo} alt="" className="h-8 w-8 rounded object-contain" />
              ) : (
                <Store className="w-6 h-6" style={{ color: primaryColor }} />
              )}
              <span className="font-bold text-lg">{storeData?.name || 'Store'}</span>
            </div>
            <Button variant="ghost" onClick={() => setStep('products')} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Store</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Customer Details Form */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-xl font-bold mb-6">Shipping Details</h2>

                  {formErrors.general && (
                    <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                      {formErrors.general}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        Full Name *
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className={formErrors.name ? 'border-destructive' : ''}
                      />
                      {formErrors.name && <p className="text-xs text-destructive mt-1">{formErrors.name}</p>}
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          Email *
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
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          Phone *
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

                    {/* Address */}
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        Address *
                      </label>
                      <Input
                        placeholder="123 Main Street, Apt 4"
                        value={customerForm.address}
                        onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                        className={formErrors.address ? 'border-destructive' : ''}
                      />
                      {formErrors.address && <p className="text-xs text-destructive mt-1">{formErrors.address}</p>}
                    </div>

                    {/* City, State, Zip */}
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
                </motion.div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6 sticky top-4">
                    <h3 className="font-bold mb-4">Order Summary</h3>

                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: `${primaryColor}10` }}
                          >
                            {item.image ? (
                              <img src={item.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <Package className="w-4 h-4" style={{ color: primaryColor }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">× {item.quantity}</p>
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
                      className="w-full text-white font-medium h-11"
                      style={{ backgroundColor: primaryColor }}
                      onClick={handlePlaceOrder}
                      disabled={placingOrder}
                    >
                      {placingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          Place Order - {formatPrice(total)}
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center mt-3">
                      By placing this order, you agree to the terms and conditions.
                    </p>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Products page (main storefront view)
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: currentTheme.bg.includes('950') ? '#030712' : undefined }}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b ${currentTheme.headerBg} ${currentTheme.headerText} px-4 md:px-8 py-3`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            {storeData?.logo ? (
              <img src={storeData.logo} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <Store className="w-6 h-6" style={{ color: primaryColor }} />
            )}
            <span className="font-bold text-lg hidden sm:inline">{storeData?.name || 'Store'}</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['Home', 'Shop', 'About', 'Contact'].map((item) => (
              <span key={item} className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Cart Sheet */}
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative lg:hidden">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Your Cart ({cartCount})
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                  <CartContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Cart Button */}
            <Button
              variant="outline"
              className="hidden lg:flex gap-2 relative"
              onClick={() => setStep('cart')}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart</span>
              {cartCount > 0 && (
                <Badge
                  className="h-5 w-5 flex items-center justify-center p-0 text-[10px] text-white ml-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  {cartCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setView('dashboard')}
            >
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {storeData && (
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}30)`,
          }}
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
          <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20 text-center">
            <h1
              className="text-2xl md:text-4xl font-bold mb-3"
              style={{ color: storeData.theme === 'bold' ? '#fff' : '#111827' }}
            >
              {storeData.name}
            </h1>
            <p
              className="text-sm md:text-base max-w-lg mx-auto"
              style={{ color: storeData.theme === 'bold' ? '#d1d5db' : '#6b7280' }}
            >
              {storeData.description || 'Welcome to our store. Discover amazing products curated just for you.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Products</h2>
              <Badge variant="secondary" className="text-xs">
                {products.length} items
              </Badge>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-5 bg-muted rounded w-1/3" />
                      <div className="h-9 bg-muted rounded" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-1">No Products Available</h3>
                <p className="text-sm text-muted-foreground/60">Check back later for new products</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product, index) => {
                  const inCart = getCartItemQuantity(product.id)
                  const outOfStock = product.trackInventory && product.stock <= 0
                  const onSale = product.comparePrice && product.comparePrice > product.price

                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <Card className={`overflow-hidden group hover:shadow-lg transition-shadow duration-300 ${currentTheme.cardBorder}`}>
                        {/* Product Image */}
                        <div
                          className="aspect-square relative overflow-hidden"
                          style={{ backgroundColor: `${primaryColor}08` }}
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
                              <Package className="w-12 h-12" style={{ color: `${primaryColor}30` }} />
                            </div>
                          )}

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {onSale && (
                              <Badge
                                className="text-[10px] text-white"
                                style={{ backgroundColor: '#ef4444' }}
                              >
                                Sale
                              </Badge>
                            )}
                            {product.featured && (
                              <Badge
                                className="text-[10px] text-white"
                                style={{ backgroundColor: primaryColor }}
                              >
                                Featured
                              </Badge>
                            )}
                            {outOfStock && (
                              <Badge variant="secondary" className="text-[10px]">
                                Out of Stock
                              </Badge>
                            )}
                          </div>

                          {/* Quick Add overlay */}
                          {!outOfStock && (
                            <motion.div
                              className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                            >
                              <Button
                                className="w-full text-white text-xs h-8"
                                style={{ backgroundColor: primaryColor }}
                                onClick={() => handleAddToCart(product)}
                                disabled={!!addedProductId && addedProductId === product.id}
                              >
                                {addedProductId === product.id ? (
                                  <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Added!
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Quick Add
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                          {product.category && (
                            <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold" style={{ color: primaryColor }}>
                              {formatPrice(product.price)}
                            </span>
                            {onSale && (
                              <span className="text-xs line-through text-muted-foreground">
                                {formatPrice(product.comparePrice!)}
                              </span>
                            )}
                          </div>

                          {/* Stock info */}
                          {product.trackInventory && product.stock > 0 && product.stock <= 5 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                              Only {product.stock} left!
                            </p>
                          )}

                          {/* Add to Cart / Quantity controls */}
                          {outOfStock ? (
                            <Button variant="secondary" className="w-full h-9 text-xs" disabled>
                              Out of Stock
                            </Button>
                          ) : inCart > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => updateCartQuantity(product.id, inCart - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm font-bold">{inCart}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => updateCartQuantity(product.id, inCart + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive ml-auto"
                                onClick={() => removeFromCart(product.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              className="w-full text-white h-9 text-xs"
                              style={{ backgroundColor: primaryColor }}
                              onClick={() => handleAddToCart(product)}
                            >
                              <ShoppingCart className="w-3 h-3 mr-1.5" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Desktop Cart Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold">Your Cart</h3>
                  {cartCount > 0 && (
                    <Badge
                      className="text-white text-[10px] ml-auto"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartCount} items
                    </Badge>
                  )}
                </div>
                <CartContent />
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${currentTheme.footerBg} ${currentTheme.footerText} px-4 md:px-8 py-6 mt-auto`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {storeData?.logo ? (
              <img src={storeData.logo} alt="" className="h-4 w-4 rounded" />
            ) : (
              <Store className="w-4 h-4" style={{ color: primaryColor }} />
            )}
            <span className="font-semibold text-sm">{storeData?.name || 'Store'}</span>
          </div>
          <div className="flex items-center gap-4 text-xs opacity-70">
            <span className="cursor-pointer hover:opacity-100 transition-opacity">Privacy Policy</span>
            <span className="cursor-pointer hover:opacity-100 transition-opacity">Terms of Service</span>
            <span className="cursor-pointer hover:opacity-100 transition-opacity">Contact</span>
          </div>
          <p className="text-xs opacity-50">
            © {new Date().getFullYear()} {storeData?.name || 'Store'}. Powered by Online Vepar.
          </p>
        </div>
      </footer>
    </div>
  )
}
