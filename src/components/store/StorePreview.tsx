'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Tablet, Smartphone, ExternalLink,
  ShoppingCart, Store, Package, ChevronRight, Share2, Check,
  X, Star, Truck, Shield, Info, MapPin, Mail, Phone
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
      // Fallback
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    }
  }

  const handlePreviewAddToCart = (product: Product) => {
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || undefined,
      sku: product.sku || undefined,
    }
    addToCart(item)
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const themeStyles = {
    modern: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      navColor: '#6b7280',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}15, ${storeData.primaryColor}30)`,
      cardBg: '#ffffff',
      cardBorder: '#f3f4f6',
      footerBg: '#111827',
      footerText: '#d1d5db',
    },
    classic: {
      bg: '#fefce8',
      headerBg: '#fffbeb',
      headerText: '#78350f',
      navColor: '#92400e',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}25, ${storeData.primaryColor}45)`,
      cardBg: '#fffbeb',
      cardBorder: '#fde68a',
      footerBg: '#78350f',
      footerText: '#fef3c7',
    },
    minimal: {
      bg: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      navColor: '#374151',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}08, ${storeData.primaryColor}15)`,
      cardBg: '#ffffff',
      cardBorder: '#e5e7eb',
      footerBg: '#f9fafb',
      footerText: '#6b7280',
    },
    bold: {
      bg: '#111827',
      headerBg: '#1f2937',
      headerText: '#ffffff',
      navColor: '#d1d5db',
      heroGradient: `linear-gradient(135deg, ${storeData.primaryColor}40, ${storeData.primaryColor}60)`,
      cardBg: '#1f2937',
      cardBorder: '#374151',
      footerBg: '#000000',
      footerText: '#9ca3af',
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

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product)
    setProductDetailOpen(true)
  }

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
            {/* Share Store Link */}
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
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                {/* URL Bar */}
                <div className="ml-3 flex items-center gap-1.5 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground border min-w-0">
                  <span className="shrink-0">🔒</span>
                  <span className="truncate">
                    {storeUrl}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Viewport Toggle */}
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
              {/* Header */}
              <div
                className="px-4 md:px-8 py-4 flex items-center justify-between"
                style={{
                  backgroundColor: currentTheme.headerBg,
                  borderBottom: storeData.theme === 'minimal' ? '1px solid #e5e7eb' : undefined,
                  boxShadow: storeData.theme === 'modern' ? '0 1px 3px rgba(0,0,0,0.05)' : undefined,
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
                    <Store className="w-6 h-6" style={{ color: storeData.primaryColor }} />
                  )}
                  <span
                    className="font-bold text-lg"
                    style={{ color: currentTheme.headerText }}
                  >
                    {storeData.name || 'Your Store'}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-6">
                  {['Home', 'Shop', 'About', 'Contact'].map((item) => (
                    <span
                      key={item}
                      className="text-sm font-medium hover:opacity-80 cursor-pointer"
                      style={{ color: currentTheme.navColor }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="relative cursor-pointer"
                    onClick={() => setCartOpen(true)}
                  >
                    <ShoppingCart
                      className="w-5 h-5"
                      style={{ color: currentTheme.navColor }}
                    />
                    {cartCount > 0 && (
                      <span
                        className="absolute -top-2 -right-2 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center font-bold"
                        style={{ backgroundColor: storeData.primaryColor }}
                      >
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Hero Banner */}
              <div
                className="px-4 md:px-8 py-16 md:py-24 text-center relative"
                style={{ background: currentTheme.heroGradient }}
              >
                {storeData.banner ? (
                  <div className="absolute inset-0 opacity-30">
                    <img
                      src={storeData.banner}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                ) : null}
                <div className="relative z-10">
                  <h2
                    className="text-2xl md:text-4xl font-bold mb-3"
                    style={{ color: storeData.theme === 'bold' ? '#fff' : '#111827' }}
                  >
                    {storeData.name || 'Your Store Name'}
                  </h2>
                  <p
                    className="text-sm md:text-base max-w-md mx-auto mb-6"
                    style={{ color: storeData.theme === 'bold' ? '#d1d5db' : '#6b7280' }}
                  >
                    {storeData.description || 'Welcome to our store. Discover amazing products curated just for you.'}
                  </p>
                  <button
                    className="px-6 py-2.5 text-white rounded-md font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: storeData.primaryColor }}
                  >
                    Shop Now
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Featured Products */}
              <div className="px-4 md:px-8 py-10 md:py-14">
                <div className="text-center mb-8">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-2"
                    style={{ color: currentTheme.headerText }}
                  >
                    Featured Products
                  </h3>
                  <p className="text-sm" style={{ color: storeData.theme === 'bold' ? '#9ca3af' : '#6b7280' }}>
                    Check out our best sellers
                  </p>
                </div>

                {loadingProducts ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="rounded-lg p-3" style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.cardBorder}` }}>
                        <Skeleton className="h-32 w-full rounded-md mb-3" />
                        <Skeleton className="h-3 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    ))}
                  </div>
                ) : products.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((product) => {
                      const images = getImages(product.images)
                      const inCart = cart.find(c => c.productId === product.id)?.quantity || 0
                      return (
                        <div
                          key={product.id}
                          className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                          style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.cardBorder}` }}
                          onClick={() => openProductDetail(product)}
                        >
                          <div
                            className="aspect-square relative overflow-hidden"
                            style={{ backgroundColor: `${storeData.primaryColor}10` }}
                          >
                            {images.length > 0 ? (
                              <img
                                src={images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package
                                  className="w-10 h-10"
                                  style={{ color: `${storeData.primaryColor}50` }}
                                />
                              </div>
                            )}
                            {product.comparePrice && product.comparePrice > product.price && (
                              <Badge
                                className="absolute top-2 left-2 text-[10px]"
                                style={{ backgroundColor: storeData.primaryColor, color: '#fff' }}
                              >
                                Sale
                              </Badge>
                            )}
                            {/* Quick view overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <span className="bg-white text-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-md">
                                Quick View
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4
                              className="font-medium text-sm mb-1 truncate"
                              style={{ color: currentTheme.headerText }}
                            >
                              {product.name}
                            </h4>
                            <div className="flex items-center gap-2 mb-2">
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
                            <button
                              className="w-full py-1.5 text-white text-xs rounded font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                              style={{ backgroundColor: storeData.primaryColor }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePreviewAddToCart(product)
                              }}
                            >
                              {inCart > 0 ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  In Cart ({inCart})
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12" style={{ color: storeData.theme === 'bold' ? '#9ca3af' : '#9ca3af' }}>
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No products yet. Add products to see them here.</p>
                  </div>
                )}
              </div>

              {/* About Section */}
              <div
                className="px-4 md:px-8 py-10 md:py-14"
                style={{ backgroundColor: `${storeData.primaryColor}08` }}
              >
                <div className="max-w-3xl mx-auto text-center">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-4"
                    style={{ color: currentTheme.headerText }}
                  >
                    About {storeData.name || 'Our Store'}
                  </h3>
                  <p
                    className="text-sm md:text-base leading-relaxed mb-6"
                    style={{ color: storeData.theme === 'bold' ? '#9ca3af' : '#6b7280' }}
                  >
                    {storeData.description || 'We are passionate about bringing you the best products with exceptional quality and service. Our mission is to make shopping easy, enjoyable, and accessible for everyone.'}
                  </p>
                  <div className="grid grid-cols-3 gap-4 md:gap-8">
                    {[
                      { icon: Truck, label: 'Free Shipping', desc: 'On all orders' },
                      { icon: Shield, label: 'Secure Payment', desc: '100% protected' },
                      { icon: Star, label: 'Top Rated', desc: '5-star service' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                          style={{ backgroundColor: `${storeData.primaryColor}15` }}
                        >
                          <item.icon className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                        </div>
                        <p className="text-xs font-semibold" style={{ color: currentTheme.headerText }}>{item.label}</p>
                        <p className="text-[10px]" style={{ color: storeData.theme === 'bold' ? '#9ca3af' : '#9ca3af' }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Section */}
              <div className="px-4 md:px-8 py-10 md:py-14">
                <div className="max-w-3xl mx-auto text-center">
                  <h3
                    className="text-xl md:text-2xl font-bold mb-4"
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
                      <div key={item.label} className="flex flex-col items-center gap-1.5 p-3 rounded-lg" style={{ border: `1px solid ${currentTheme.cardBorder}` }}>
                        <item.icon className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                        <p className="text-xs font-semibold" style={{ color: currentTheme.headerText }}>{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-4 md:px-8 py-8"
                style={{ backgroundColor: currentTheme.footerBg }}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {storeData.logo ? (
                      <img src={storeData.logo} alt="" className="h-5 w-5 rounded" />
                    ) : (
                      <Store className="w-4 h-4" style={{ color: storeData.primaryColor }} />
                    )}
                    <span className="font-semibold text-sm" style={{ color: currentTheme.footerText }}>
                      {storeData.name || 'Your Store'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: currentTheme.footerText }}>
                    <span className="hover:opacity-80 cursor-pointer">Privacy Policy</span>
                    <span className="hover:opacity-80 cursor-pointer">Terms of Service</span>
                    <span className="hover:opacity-80 cursor-pointer">Contact</span>
                  </div>
                  <p className="text-xs" style={{ color: currentTheme.footerText, opacity: 0.6 }}>
                    © {new Date().getFullYear()} {storeData.name || 'Your Store'}. Powered by Online Vepar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Product Detail Sheet (Mini Preview) */}
      <Sheet open={productDetailOpen} onOpenChange={setProductDetailOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="sr-only">Product Detail</SheetTitle>
          </SheetHeader>
          {selectedProduct && (
            <div className="mt-4 space-y-4">
              {/* Product Image */}
              <div
                className="aspect-square rounded-xl overflow-hidden"
                style={{ backgroundColor: `${storeData.primaryColor}10` }}
              >
                {getImages(selectedProduct.images).length > 0 ? (
                  <img
                    src={getImages(selectedProduct.images)[0]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/20" />
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
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-bold" style={{ color: storeData.primaryColor }}>
                    {formatPrice(selectedProduct.price)}
                  </span>
                  {selectedProduct.comparePrice && selectedProduct.comparePrice > selectedProduct.price && (
                    <span className="text-sm line-through text-muted-foreground">
                      {formatPrice(selectedProduct.comparePrice)}
                    </span>
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
                <p className="text-xs text-emerald-600 font-medium">
                  {selectedProduct.stock > 10 ? 'In Stock' : `Only ${selectedProduct.stock} left`}
                </p>
              )}

              <Separator />

              {/* Add to Cart */}
              <div className="space-y-2">
                <Button
                  className="w-full text-white font-semibold"
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
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Shipping</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mini Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" style={{ color: storeData.primaryColor }} />
              Preview Cart ({cartCount})
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click products to add items</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: `${storeData.primaryColor}10` }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <Package className="w-5 h-5" style={{ color: storeData.primaryColor }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-sm font-bold" style={{ color: storeData.primaryColor }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-accent text-xs"
                        onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">{item.quantity}</span>
                      <button
                        className="w-6 h-6 rounded-full border border-border flex items-center justify-center hover:bg-accent text-xs"
                        onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="w-6 h-6 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 ml-1"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="border-t pt-4 mt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span style={{ color: storeData.primaryColor }}>{formatPrice(cartTotal)}</span>
              </div>
              <Button
                className="w-full text-white"
                style={{ backgroundColor: storeData.primaryColor }}
                onClick={() => {
                  setCartOpen(false)
                  setView('checkout')
                }}
              >
                Open Live Store to Checkout
                <ChevronRight className="w-4 h-4 ml-1" />
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
