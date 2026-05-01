'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import LandingPage from '@/components/landing/LandingPage'
import LoginPage from '@/components/auth/LoginPage'
import RegisterPage from '@/components/auth/RegisterPage'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CheckoutPage from '@/components/checkout/CheckoutPage'

export default function Home() {
  const { currentView, setUser, setStore, setStores, setView } = useAppStore()

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            if (data.stores && data.stores.length > 0) {
              setStores(data.stores)
              setStore(data.stores[0])
            }
            setView('dashboard')
          }
        }
      } catch {
        // Not authenticated, stay on landing page
      }
    }

    checkAuth()
  }, [setUser, setStore, setStores, setView])

  // Render the current view
  switch (currentView) {
    case 'landing':
      return <LandingPage />
    case 'login':
      return <LoginPage />
    case 'register':
      return <RegisterPage />
    case 'checkout':
      return <CheckoutPage />
    case 'dashboard':
    case 'products':
    case 'orders':
    case 'customers':
    case 'store-settings':
    case 'store-preview':
    case 'analytics':
    case 'pages':
    case 'create-store':
    case 'discounts':
    case 'inventory':
    case 'shipping':
    case 'reviews':
      return <DashboardLayout />
    default:
      return <LandingPage />
  }
}
