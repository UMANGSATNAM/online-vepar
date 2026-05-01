'use client'

import { create } from 'zustand'

export type ViewType =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'products'
  | 'orders'
  | 'customers'
  | 'store-settings'
  | 'store-preview'
  | 'analytics'
  | 'pages'
  | 'create-store'
  | 'discounts'
  | 'inventory'
  | 'shipping'
  | 'reviews'
  | 'checkout'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Store {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  banner?: string
  theme?: string
  primaryColor?: string
  currency: string
  domain?: string
  isActive?: boolean
  ownerId: string
  createdAt: string
  updatedAt?: string
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  sku?: string
}

interface AppState {
  // View state
  currentView: ViewType
  currentUser: User | null
  currentStore: Store | null
  stores: Store[]

  // UI state
  sidebarOpen: boolean

  // Selections
  selectedProductId: string | null
  selectedOrderId: string | null
  selectedCustomerId: string | null

  // Cart
  cart: CartItem[]

  // Actions
  setView: (view: ViewType) => void
  setUser: (user: User | null) => void
  setStore: (store: Store | null) => void
  setStores: (stores: Store[]) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedProductId: (id: string | null) => void
  setSelectedOrderId: (id: string | null) => void
  setSelectedCustomerId: (id: string | null) => void
  logout: () => void
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  currentView: 'landing',
  currentUser: null,
  currentStore: null,
  stores: [],
  sidebarOpen: true,
  selectedProductId: null,
  selectedOrderId: null,
  selectedCustomerId: null,
  cart: [],

  // Actions
  setView: (view) => set({ currentView: view }),
  setUser: (user) => set({ currentUser: user }),
  setStore: (store) => set({ currentStore: store }),
  setStores: (stores) => set({ stores }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedProductId: (id) => set({ selectedProductId: id }),
  setSelectedOrderId: (id) => set({ selectedOrderId: id }),
  setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
  logout: () =>
    set({
      currentView: 'landing',
      currentUser: null,
      currentStore: null,
      stores: [],
      sidebarOpen: true,
      selectedProductId: null,
      selectedOrderId: null,
      selectedCustomerId: null,
      cart: [],
    }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((c) => c.productId === item.productId)
      if (existing) {
        return {
          cart: state.cart.map((c) =>
            c.productId === item.productId
              ? { ...c, quantity: c.quantity + item.quantity }
              : c
          ),
        }
      }
      return { cart: [...state.cart, item] }
    }),
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((c) => c.productId !== productId),
    })),
  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((c) => c.productId !== productId) }
      }
      return {
        cart: state.cart.map((c) =>
          c.productId === productId ? { ...c, quantity } : c
        ),
      }
    }),
  clearCart: () => set({ cart: [] }),
}))
