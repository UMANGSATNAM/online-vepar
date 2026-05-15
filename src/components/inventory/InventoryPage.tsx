'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Plus,
  Download,
  ArrowUpDown,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  History,
  Warehouse,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: string
  name: string
  sku: string | null
  stock: number
  images: string
  price: number
  status: string
  category: string | null
  updatedAt: string
}

interface InventoryLog {
  id: string
  productId: string
  type: string
  quantity: number
  previousStock: number
  newStock: number
  reason: string | null
  reference: string | null
  createdAt: string
  product: {
    id: string
    name: string
    sku: string | null
    stock: number
  }
}

interface StockSummary {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export default function InventoryPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<StockSummary>({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productHistoryId, setProductHistoryId] = useState<string | null>(null)

  // Pagination for logs
  const [logPage, setLogPage] = useState(1)
  const [logTotal, setLogTotal] = useState(0)
  const logLimit = 15

  // Dialog state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)

  // Adjust form state
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    type: 'in',
    quantity: 0,
    reason: '',
    reference: '',
  })

  // Bulk adjust form state
  const [bulkReason, setBulkReason] = useState('')
  const [bulkQuantities, setBulkQuantities] = useState<Record<string, number>>({})

  // Fetch products
  const fetchProducts = useCallback(async () => {
    if (!currentStore) return
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        limit: '100',
        status: 'active',
      })
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        const prods = data.products || []
        setProducts(prods)

        // Calculate summary
        const totalProducts = prods.length
        const inStock = prods.filter((p: Product) => p.stock > 10).length
        const lowStock = prods.filter((p: Product) => p.stock > 0 && p.stock <= 10).length
        const outOfStock = prods.filter((p: Product) => p.stock === 0).length
        setSummary({ totalProducts, inStock, lowStock, outOfStock })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }, [currentStore, searchQuery])

  // Fetch inventory logs
  const fetchLogs = useCallback(async () => {
    if (!currentStore) return
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        page: logPage.toString(),
        limit: logLimit.toString(),
      })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (searchQuery) params.set('search', searchQuery)
      if (productHistoryId) params.set('productId', productHistoryId)

      const res = await fetch(`/api/inventory?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setLogTotal(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching inventory logs:', error)
    }
  }, [currentStore, typeFilter, searchQuery, logPage, productHistoryId])

  // Fetch low stock products
  const fetchLowStock = useCallback(async () => {
    if (!currentStore) return
    try {
      const res = await fetch(`/api/inventory/low-stock?storeId=${currentStore.id}&threshold=10`)
      if (res.ok) {
        const data = await res.json()
        setLowStockProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching low stock:', error)
    }
  }, [currentStore])

  // Initial data load and refetch on filter changes
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchLogs(), fetchLowStock()])
      setLoading(false)
    }
    loadAll()
  }, [fetchProducts, fetchLogs, fetchLowStock])

  // Handle stock adjustment
  const handleAdjustStock = async () => {
    if (!currentStore) return
    if (!adjustForm.productId || !adjustForm.quantity || adjustForm.quantity <= 0) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          ...adjustForm,
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Stock adjusted successfully' })
        setAdjustDialogOpen(false)
        setAdjustForm({ productId: '', type: 'in', quantity: 0, reason: '', reference: '' })
        await Promise.all([fetchProducts(), fetchLogs(), fetchLowStock()])
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to adjust stock', variant: 'destructive' })
    }
  }

  // Handle bulk adjustment
  const handleBulkAdjust = async () => {
    if (!currentStore) return

    const adjustments = selectedProducts
      ? Array.from(selectedProducts)
          .filter((id) => bulkQuantities[id] && bulkQuantities[id] > 0)
          .map((productId) => ({
            productId,
            type: 'in' as const,
            quantity: bulkQuantities[productId],
          }))
      : []

    if (adjustments.length === 0) {
      toast({ title: 'Error', description: 'No valid adjustments', variant: 'destructive' })
      return
    }

    try {
      const res = await fetch('/api/inventory/bulk-adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          adjustments,
          reason: bulkReason,
        }),
      })

      if (res.ok) {
        toast({ title: 'Success', description: `${adjustments.length} products updated` })
        setBulkDialogOpen(false)
        setSelectedProducts(new Set())
        setBulkReason('')
        setBulkQuantities({})
        await Promise.all([fetchProducts(), fetchLogs(), fetchLowStock()])
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to bulk adjust', variant: 'destructive' })
    }
  }

  // Export inventory data
  const handleExport = () => {
    if (!currentStore) return
    window.open(`/api/export?storeId=${currentStore.id}&type=products`, '_blank')
    toast({ title: 'Export Started', description: 'Your CSV file is downloading' })
  }

  // Toggle product selection
  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle all products
  const toggleAllProducts = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(products.map((p) => p.id)))
    }
  }

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', dot: 'bg-red-500' }
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' }
    return { label: 'In Stock', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' }
  }

  // Get log type badge
  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return { label: 'Stock In', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: TrendingUp }
      case 'out':
        return { label: 'Stock Out', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: TrendingDown }
      case 'adjustment':
        return { label: 'Adjustment', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: SlidersHorizontal }
      case 'return':
        return { label: 'Return', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', icon: RotateCcw }
      default:
        return { label: type, color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300', icon: Package }
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get selected product for adjust form
  const selectedAdjustProduct = products.find((p) => p.id === adjustForm.productId)
  const previewNewStock = selectedAdjustProduct
    ? adjustForm.type === 'in' || adjustForm.type === 'return'
      ? selectedAdjustProduct.stock + adjustForm.quantity
      : adjustForm.type === 'out'
        ? Math.max(0, selectedAdjustProduct.stock - adjustForm.quantity)
        : adjustForm.quantity
    : null

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Products',
      value: summary.totalProducts,
      icon: Package,
      color: 'emerald',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'In Stock',
      value: summary.inStock,
      icon: CheckCircle2,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Low Stock',
      value: summary.lowStock,
      icon: AlertTriangle,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Out of Stock',
      value: summary.outOfStock,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      iconColor: 'text-red-600 dark:text-red-400',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Warehouse className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
            <p className="text-sm text-muted-foreground">Track and manage your stock levels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <Button
              onClick={() => setBulkDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bulk Adjust ({selectedProducts.size})
            </Button>
          )}
          <Button
            onClick={() => {
              setAdjustForm({ productId: '', type: 'in', quantity: 0, reason: '', reference: '' })
              setAdjustDialogOpen(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Adjust Stock
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className={`card-premium animate-card-entrance stagger-${idx + 1} hover-lift border-t-2 ${card.bgColor} ${
              card.color === 'emerald' ? 'border-t-blue-500 stat-glow-green' :
              card.color === 'green' ? 'border-t-green-500 stat-glow-green' :
              card.color === 'amber' ? 'border-t-amber-500 stat-glow-orange' :
              'border-t-red-500 stat-glow-orange'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="card-premium animate-border-pulse border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <span className="font-semibold">{lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''}</span>{' '}
                  {lowStockProducts.length === 1 ? 'has' : 'have'} low stock (≤10 units).
                  {lowStockProducts.slice(0, 3).map((p) => (
                    <span key={p.id} className="ml-1">
                      <Badge variant="outline" className="text-[10px] h-4 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ml-0.5">
                        {p.name} ({p.stock})
                      </Badge>
                    </span>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <span className="text-amber-600 dark:text-amber-400 ml-1">
                      +{lowStockProducts.length - 3} more
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        {activeTab === 'history' && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40 h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="in">Stock In</SelectItem>
              <SelectItem value="out">Stock Out</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="return">Return</SelectItem>
            </SelectContent>
          </Select>
        )}
        {productHistoryId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProductHistoryId(null)}
            className="gap-1.5 h-9"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50 dark:bg-blue-900/20">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-1.5" />
            Stock Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <History className="w-4 h-4 mr-1.5" />
            Inventory History
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Stock Overview */}
        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedProducts.size === products.length && products.length > 0}
                          onCheckedChange={toggleAllProducts}
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <ArrowUpDown className="w-3 h-3" />
                          Stock
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="w-10 h-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No products found</p>
                            <p className="text-xs text-muted-foreground/70">Add products to start tracking inventory</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product) => {
                        const status = getStockStatus(product.stock)
                        return (
                          <TableRow
                            key={product.id}
                            className={`table-row-hover cursor-pointer ${
                              productHistoryId === product.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedProducts.has(product.id)}
                                onCheckedChange={() => toggleProductSelection(product.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                                  {product.category && (
                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {product.sku || '—'}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold tabular-nums">{product.stock}</span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`gap-1.5 text-xs font-semibold px-2 py-0.5 ${status.color}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                              {formatDate(product.updatedAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={() => {
                                    setAdjustForm({
                                      productId: product.id,
                                      type: 'in',
                                      quantity: 0,
                                      reason: '',
                                      reference: '',
                                    })
                                    setAdjustDialogOpen(true)
                                  }}
                                >
                                  <SlidersHorizontal className="w-3 h-3" />
                                  Adjust
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => {
                                    setProductHistoryId(product.id)
                                    setActiveTab('history')
                                    setLogPage(1)
                                  }}
                                >
                                  <History className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Inventory History */}
        <TabsContent value="history" className="mt-4">
          {productHistoryId && (
            <div className="mb-4">
              <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      Showing history for: <strong>{products.find(p => p.id === productHistoryId)?.name || 'Product'}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs ml-auto"
                      onClick={() => setProductHistoryId(null)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="hidden sm:table-cell">Stock Change</TableHead>
                      <TableHead className="hidden md:table-cell">Reason</TableHead>
                      <TableHead className="hidden lg:table-cell">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            <History className="w-10 h-10 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No inventory history found</p>
                            <p className="text-xs text-muted-foreground/70">Stock adjustments will appear here</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => {
                        const typeBadge = getLogTypeBadge(log.type)
                        const TypeIcon = typeBadge.icon
                        return (
                          <TableRow key={log.id} className="table-row-hover">
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                  <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate max-w-[160px]">{log.product.name}</p>
                                  {log.product.sku && (
                                    <p className="text-xs text-muted-foreground font-mono">{log.product.sku}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`gap-1 text-xs ${typeBadge.color}`}
                              >
                                <TypeIcon className="w-3 h-3" />
                                {typeBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={`font-semibold tabular-nums ${
                                log.quantity > 0
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {log.quantity > 0 ? '+' : ''}{log.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="tabular-nums">{log.previousStock}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span className="font-medium tabular-nums">{log.newStock}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[150px] truncate">
                              {log.reason || '—'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                              {log.reference || '—'}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {logTotal > logLimit && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {((logPage - 1) * logLimit) + 1}–{Math.min(logPage * logLimit, logTotal)} of {logTotal}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={logPage === 1}
                      onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {logPage} / {Math.ceil(logTotal / logLimit)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={logPage >= Math.ceil(logTotal / logLimit)}
                      onClick={() => setLogPage((p) => p + 1)}
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Adjust Stock
            </DialogTitle>
            <DialogDescription>
              Update the stock level for a product
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Product</label>
              <Select
                value={adjustForm.productId}
                onValueChange={(value) =>
                  setAdjustForm((prev) => ({ ...prev, productId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="max-h-60">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <span>{product.name}</span>
                          <span className="text-muted-foreground text-xs">
                            (Stock: {product.stock})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* Current Stock Display */}
            {selectedAdjustProduct && (
              <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Stock</span>
                  <span className="font-semibold tabular-nums">{selectedAdjustProduct.stock}</span>
                </div>
              </div>
            )}

            {/* Adjustment Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select
                value={adjustForm.type}
                onValueChange={(value) =>
                  setAdjustForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Stock In
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                      Stock Out
                    </div>
                  </SelectItem>
                  <SelectItem value="adjustment">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                      Adjustment
                    </div>
                  </SelectItem>
                  <SelectItem value="return">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-orange-600" />
                      Return
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {adjustForm.type === 'adjustment' ? 'New Stock Level' : 'Quantity'}
              </label>
              <Input
                type="number"
                min={1}
                value={adjustForm.quantity || ''}
                onChange={(e) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder={adjustForm.type === 'adjustment' ? 'Enter new stock level' : 'Enter quantity'}
              />
            </div>

            {/* Preview */}
            {previewNewStock !== null && adjustForm.quantity > 0 && (
              <div className={`rounded-lg p-3 ${
                previewNewStock === 0
                  ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800'
                  : previewNewStock <= 10
                    ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Stock Level</span>
                  <span className={`font-bold tabular-nums text-lg ${
                    previewNewStock === 0
                      ? 'text-red-600 dark:text-red-400'
                      : previewNewStock <= 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {previewNewStock}
                  </span>
                </div>
                {previewNewStock === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    ⚠️ This product will be out of stock
                  </p>
                )}
                {previewNewStock > 0 && previewNewStock <= 10 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ This product will have low stock
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g., New shipment received, Damaged goods..."
                rows={2}
              />
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input
                value={adjustForm.reference}
                onChange={(e) =>
                  setAdjustForm((prev) => ({ ...prev, reference: e.target.value }))
                }
                placeholder="e.g., PO-1234, ORD-5678"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAdjustStock}
              disabled={!adjustForm.productId || !adjustForm.quantity}
            >
              Apply Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Adjustment Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Bulk Stock Adjustment
            </DialogTitle>
            <DialogDescription>
              Add stock to {selectedProducts.size} selected products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Product list with quantities */}
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-4">
                {products
                  .filter((p) => selectedProducts.has(p.id))
                  .map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 dark:bg-muted/10"
                    >
                      <div className="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: <span className="font-mono">{product.stock}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">+ Qty:</span>
                        <Input
                          type="number"
                          min={1}
                          value={bulkQuantities[product.id] || ''}
                          onChange={(e) =>
                            setBulkQuantities((prev) => ({
                              ...prev,
                              [product.id]: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-20 h-8 text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>

            <Separator />

            {/* Common reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="e.g., New shipment received..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleBulkAdjust}
            >
              Apply to {selectedProducts.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ArrowRight icon for stock change display
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  )
}
