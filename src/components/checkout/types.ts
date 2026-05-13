export interface StorefrontProduct {
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

export interface StorefrontVariant {
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

export interface StorefrontStore {
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

export interface DiscountResult {
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

export interface OrderResult {
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

export type StoreView = 'home' | 'product' | 'checkout' | 'confirmation'
