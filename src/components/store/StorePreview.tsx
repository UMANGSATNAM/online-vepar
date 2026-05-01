'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Monitor, Tablet, Smartphone, ExternalLink,
  ShoppingCart, Store, Package, ChevronRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

interface Product {
  id: string
  name: string
  price: number
  comparePrice?: number
  images: string
  status: string
  featured: boolean
}

export default function StorePreview() {
  const { currentStore, setView } = useAppStore()
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
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
      const [storeRes, productsRes] = await Promise.all([
        fetch(`/api/stores/${currentStore.id}`),
        fetch(`/api/products?storeId=${currentStore.id}&status=active&limit=6`),
      ])
      if (storeRes.ok) {
        const data = await storeRes.json()
        setStoreData({
          name: data.store.name || '',
          slug: data.store.slug || '',
          description: data.store.description || '',
          logo: data.store.logo || '',
          banner: data.store.banner || '',
          theme: data.store.theme || 'modern',
          primaryColor: data.store.primaryColor || '#10b981',
          currency: data.store.currency || 'INR',
        })
      }
      if (productsRes.ok) {
        const data = await productsRes.json()
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

  const parseImages = (imagesStr: string): string[] => {
    try {
      return JSON.parse(imagesStr || '[]')
    } catch {
      return []
    }
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
          <Button
            className="gap-2 text-white"
            style={{ backgroundColor: currentStore?.primaryColor || '#10b981' }}
            onClick={() => setView('checkout')}
          >
            <ExternalLink className="w-4 h-4" />
            Open Live Store
          </Button>
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
                    {storeData.slug || 'your-store'}.onlinevepar.com
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
                  <ShoppingCart
                    className="w-5 h-5 cursor-pointer"
                    style={{ color: currentTheme.navColor }}
                  />
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
                      const images = parseImages(product.images)
                      return (
                        <div
                          key={product.id}
                          className="rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                          style={{ backgroundColor: currentTheme.cardBg, border: `1px solid ${currentTheme.cardBorder}` }}
                        >
                          <div
                            className="aspect-square relative overflow-hidden"
                            style={{ backgroundColor: `${storeData.primaryColor}10` }}
                          >
                            {images.length > 0 ? (
                              <img
                                src={images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                              className="w-full py-1.5 text-white text-xs rounded font-medium hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: storeData.primaryColor }}
                            >
                              Add to Cart
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
                    © 2026 {storeData.name || 'Your Store'}. Powered by Online Vepar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
