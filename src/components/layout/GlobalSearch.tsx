'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { useAppStore, type ViewType } from '@/lib/store'

interface SearchResult {
  products: Array<{ id: string; name: string; price: number; status: string; sku: string | null }>
  orders: Array<{ id: string; orderNumber: string; customerName: string; total: number; status: string }>
  customers: Array<{ id: string; name: string; email: string | null; phone: string | null; totalOrders: number }>
}

interface QuickAction {
  label: string
  view: ViewType
  icon: React.ComponentType<{ className?: string }>
}

const quickActions: QuickAction[] = [
  { label: 'Go to Products', view: 'products', icon: Package },
  { label: 'Go to Orders', view: 'orders', icon: ShoppingCart },
  { label: 'Go to Customers', view: 'customers', icon: Users },
  { label: 'Go to Analytics', view: 'analytics', icon: BarChart3 },
  { label: 'Go to Settings', view: 'store-settings', icon: Settings },
]

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { currentStore, setView, setSelectedProductId, setSelectedOrderId, setSelectedCustomerId } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult>({ products: [], orders: [], customers: [] })
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const searchAll = useCallback(async (searchQuery: string) => {
    if (!currentStore?.id || !searchQuery.trim()) {
      setResults({ products: [], orders: [], customers: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        q: searchQuery.trim(),
        limit: '5',
      })
      const res = await fetch(`/api/search?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false)
    }
  }, [currentStore?.id])

  // Debounced search
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults({ products: [], orders: [], customers: [] })
      setIsLoading(false)
      return
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (!query.trim()) {
      setResults({ products: [], orders: [], customers: [] })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    debounceRef.current = setTimeout(() => {
      searchAll(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, open, searchAll])

  const formatPrice = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
  }

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    setView('products')
    onOpenChange(false)
  }

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId)
    setView('orders')
    onOpenChange(false)
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setView('customers')
    onOpenChange(false)
  }

  const handleQuickAction = (view: ViewType) => {
    setView(view)
    onOpenChange(false)
  }

  const hasResults = results.products.length > 0 || results.orders.length > 0 || results.customers.length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search across products, orders, and customers"
    >
      <CommandInput
        placeholder="Search products, orders, customers..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Searching...
          </div>
        )}

        {!isLoading && query.trim() && !hasResults && (
          <CommandEmpty>No results found for &quot;{query}&quot;</CommandEmpty>
        )}

        {!query.trim() && (
          <>
            <CommandGroup heading="Quick Actions">
              {quickActions.map((action) => (
                <CommandItem
                  key={action.view}
                  onSelect={() => handleQuickAction(action.view)}
                  className="cursor-pointer"
                >
                  <action.icon className="w-4 h-4 text-emerald-600" />
                  <span>{action.label}</span>
                  <ArrowRight className="w-3 h-3 ml-auto text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.products.length > 0 && (
          <CommandGroup heading="Products">
            {results.products.map((product) => (
              <CommandItem
                key={product.id}
                onSelect={() => handleProductSelect(product.id)}
                className="cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.sku && `SKU: ${product.sku} · `}
                    {formatPrice(product.price)}
                    {product.status !== 'active' && ` · ${product.status}`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.orders.length > 0 && (
          <>
            {results.products.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Orders">
              {results.orders.map((order) => (
                <CommandItem
                  key={order.id}
                  onSelect={() => handleOrderSelect(order.id)}
                  className="cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{order.orderNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.customerName} · {formatPrice(order.total)} · {order.status}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {results.customers.length > 0 && (
          <>
            {(results.products.length > 0 || results.orders.length > 0) && <CommandSeparator />}
            <CommandGroup heading="Customers">
              {results.customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  onSelect={() => handleCustomerSelect(customer.id)}
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4 text-violet-600" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {customer.email || customer.phone || 'No contact info'}
                      {customer.totalOrders > 0 && ` · ${customer.totalOrders} order${customer.totalOrders !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
