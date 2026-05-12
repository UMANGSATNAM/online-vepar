'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface CartItem {
  productId: string
  name: string
  price: number
  comparePrice?: number
  quantity: number
  image?: string
  sku?: string
  stock: number
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function useStorefrontCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useStorefrontCart must be used inside StorefrontCartProvider')
  return ctx
}

export function StorefrontCartProvider({
  children,
  storeSlug,
}: {
  children: ReactNode
  storeSlug: string
}) {
  const storageKey = `cart_${storeSlug}`
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setHydrated(true)
  }, [storageKey])

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {}
  }, [items, storageKey, hydrated])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === item.productId)
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.quantity + (item.quantity ?? 1), i.stock) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev =>
      prev.map(i => i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i)
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    try { localStorage.removeItem(storageKey) } catch {}
  }, [storageKey])

  const count = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      updateQty,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  )
}
