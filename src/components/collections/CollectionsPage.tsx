'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Plus, Search, MoreHorizontal, Edit2, Trash2,
  Star, StarOff, Copy, CheckCircle2, XCircle, Package,
  Eye, EyeOff, GripVertical, Zap, Sliders, Image as ImageIcon,
  ArrowUpDown, Tag, ChevronRight, Trophy
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface CollectionProduct {
  id: string
  productId: string
  position: number
  product?: {
    id: string
    name: string
    slug: string
    price: number
    images: string
    status: string
    featured: boolean
    category: string | null
  }
}

interface Collection {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  type: string
  conditions: string
  sortOrder: string
  status: string
  featured: boolean
  storeId: string
  createdAt: string
  updatedAt: string
  productCount: number
  collectionProducts?: CollectionProduct[]
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string
  status: string
  featured: boolean
  category: string | null
}

// Helper functions
function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  type: 'manual' as 'manual' | 'auto',
  conditions: '{}',
  sortOrder: 'best-selling' as string,
  status: 'active' as 'active' | 'draft',
  featured: false,
}

// Conditions editor state
interface AutoConditions {
  category: string
  tags: string
  minPrice: string
  maxPrice: string
  featured: boolean
}

const emptyConditions: AutoConditions = {
  category: '',
  tags: '',
  minPrice: '',
  maxPrice: '',
  featured: false,
}

// Animated count-up hook
function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const rafId = useRef<number>(0)
  useEffect(() => {
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) {
        rafId.current = requestAnimationFrame(step)
      }
    }
    rafId.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId.current)
  }, [target, duration])
  return count
}

function AnimatedStat({ value, label, icon: Icon, gradientClass, borderClass }: {
  value: number; label: string; icon: React.ElementType; gradientClass: string; borderClass: string
}) {
  const animatedValue = useCountUp(value)
  return (
    <Card className={`${borderClass} ${gradientClass} hover-lift transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 animate-count-up">{animatedValue}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function CollectionsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // List state
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [autoConditions, setAutoConditions] = useState<AutoConditions>({ ...emptyConditions })

  // Product selector state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [addingProducts, setAddingProducts] = useState(false)

  // Detail view state
  const [detailCollection, setDetailCollection] = useState<Collection | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCollections = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ storeId: currentStore.id })
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/collections?${params}`)
      if (!res.ok) throw new Error('Failed to fetch collections')
      const data = await res.json()
      setCollections(data.collections || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch collections', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, search, statusFilter, toast])

  const fetchProducts = useCallback(async () => {
    if (!currentStore?.id) return
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        status: 'active',
      })
      if (productSearch) params.set('search', productSearch)
      const res = await fetch(`/api/products?${params}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch products', variant: 'destructive' })
    }
  }, [currentStore?.id, productSearch, toast])

  useEffect(() => {
    fetchCollections()
  }, [fetchCollections])

  useEffect(() => {
    if (showProductDialog) {
      fetchProducts()
    }
  }, [showProductDialog, fetchProducts])

  // Summary stats
  const totalCollections = collections.length
  const activeCollections = collections.filter(c => c.status === 'active').length
  const featuredCollections = collections.filter(c => c.featured).length
  const totalProducts = collections.reduce((sum, c) => sum + (c.productCount || 0), 0)

  const filteredCollections = collections.filter((c) => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  const handleCreate = () => {
    setEditingCollection(null)
    setForm({ ...emptyForm })
    setAutoConditions({ ...emptyConditions })
    setShowFormDialog(true)
  }

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection)
    setForm({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      image: collection.image || '',
      type: collection.type as 'manual' | 'auto',
      conditions: collection.conditions,
      sortOrder: collection.sortOrder,
      status: collection.status as 'active' | 'draft',
      featured: collection.featured,
    })
    // Parse conditions
    try {
      const parsed = JSON.parse(collection.conditions || '{}') as Partial<AutoConditions>
      setAutoConditions({
        category: parsed.category || '',
        tags: parsed.tags || '',
        minPrice: parsed.minPrice?.toString() || '',
        maxPrice: parsed.maxPrice?.toString() || '',
        featured: parsed.featured || false,
      })
    } catch {
      setAutoConditions({ ...emptyConditions })
    }
    setShowFormDialog(true)
  }

  const handleSave = async () => {
    if (!currentStore?.id) return
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Collection name is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      // Build conditions JSON for auto type
      const conditionsJson = form.type === 'auto'
        ? JSON.stringify({
            category: autoConditions.category || undefined,
            tags: autoConditions.tags || undefined,
            minPrice: autoConditions.minPrice ? parseFloat(autoConditions.minPrice) : undefined,
            maxPrice: autoConditions.maxPrice ? parseFloat(autoConditions.maxPrice) : undefined,
            featured: autoConditions.featured || undefined,
          })
        : '{}'

      const payload: Record<string, unknown> = {
        storeId: currentStore.id,
        name: form.name,
        slug: form.slug || generateSlugFromName(form.name),
        description: form.description || null,
        image: form.image || null,
        type: form.type,
        conditions: conditionsJson,
        sortOrder: form.sortOrder,
        status: form.status,
        featured: form.featured,
      }

      if (editingCollection) {
        const res = await fetch(`/api/collections/${editingCollection.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update collection')
        }
        toast({ title: 'Success', description: 'Collection updated successfully' })
      } else {
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create collection')
        }
        toast({ title: 'Success', description: 'Collection created successfully' })
      }

      setShowFormDialog(false)
      fetchCollections()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleFeatured = async (collection: Collection) => {
    try {
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !collection.featured }),
      })
      if (!res.ok) throw new Error('Failed to update collection')
      toast({ title: 'Success', description: `Collection ${collection.featured ? 'unfeatured' : 'featured'}` })
      fetchCollections()
    } catch {
      toast({ title: 'Error', description: 'Failed to update collection', variant: 'destructive' })
    }
  }

  const handleDuplicate = async (collection: Collection) => {
    if (!currentStore?.id) return
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          name: `${collection.name} (Copy)`,
          slug: `${collection.slug}-copy`,
          description: collection.description,
          image: collection.image,
          type: collection.type,
          conditions: collection.conditions,
          sortOrder: collection.sortOrder,
          status: 'draft',
          featured: false,
        }),
      })
      if (!res.ok) throw new Error('Failed to duplicate collection')
      toast({ title: 'Success', description: 'Collection duplicated successfully' })
      fetchCollections()
    } catch {
      toast({ title: 'Error', description: 'Failed to duplicate collection', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/collections/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete collection')
      toast({ title: 'Success', description: 'Collection deleted successfully' })
      fetchCollections()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete collection', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const handleOpenProductSelector = (collectionId: string) => {
    setSelectedCollectionId(collectionId)
    setSelectedProductIds([])
    setProductSearch('')
    setShowProductDialog(true)
  }

  const handleAddProducts = async () => {
    if (!selectedCollectionId || selectedProductIds.length === 0) return
    setAddingProducts(true)
    try {
      const res = await fetch(`/api/collections/${selectedCollectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addProductIds: selectedProductIds }),
      })
      if (!res.ok) throw new Error('Failed to add products')
      toast({ title: 'Success', description: `${selectedProductIds.length} product(s) added to collection` })
      setShowProductDialog(false)
      fetchCollections()
    } catch {
      toast({ title: 'Error', description: 'Failed to add products to collection', variant: 'destructive' })
    } finally {
      setAddingProducts(false)
    }
  }

  const handleRemoveProduct = async (collectionId: string, productId: string) => {
    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeProductIds: [productId] }),
      })
      if (!res.ok) throw new Error('Failed to remove product')
      toast({ title: 'Success', description: 'Product removed from collection' })
      // Refresh detail view if open
      if (detailCollection?.id === collectionId) {
        fetchCollectionDetail(collectionId)
      }
      fetchCollections()
    } catch {
      toast({ title: 'Error', description: 'Failed to remove product', variant: 'destructive' })
    }
  }

  const fetchCollectionDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/collections/${id}`)
      if (!res.ok) throw new Error('Failed to fetch collection')
      const data = await res.json()
      setDetailCollection(data.collection)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch collection details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleViewDetail = (collection: Collection) => {
    setDetailCollection(collection)
    fetchCollectionDetail(collection.id)
  }

  const getStatusBadge = (status: string): string => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
      draft: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    }
    return colors[status] || colors.draft
  }

  const getTypeBadge = (type: string): string => {
    if (type === 'auto') {
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'
    }
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
  }

  const getSortOrderLabel = (sortOrder: string): string => {
    const labels: Record<string, string> = {
      'best-selling': 'Best Selling',
      'alpha': 'Alphabetical',
      'price-asc': 'Price: Low to High',
      'price-desc': 'Price: High to Low',
      'newest': 'Newest',
    }
    return labels[sortOrder] || sortOrder
  }

  const getProductImage = (imagesStr: string): string | null => {
    try {
      const imgs = JSON.parse(imagesStr || '[]') as string[]
      return imgs[0] || null
    } catch {
      return null
    }
  }

  // ========== LOADING STATE ==========
  if (loading && collections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ========== DETAIL VIEW ==========
  if (detailCollection) {
    const collectionProducts = detailCollection.collectionProducts || []
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailCollection(null)}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
            Back to Collections
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {detailCollection.image ? (
                <img
                  src={detailCollection.image}
                  alt={detailCollection.name}
                  className="w-16 h-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border">
                  <Layers className="w-8 h-8 text-emerald-600" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">{detailCollection.name}</h1>
                  {detailCollection.featured && (
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getTypeBadge(detailCollection.type)} variant="outline">
                    {detailCollection.type === 'auto' ? <Zap className="w-3 h-3 mr-1" /> : <Sliders className="w-3 h-3 mr-1" />}
                    {detailCollection.type === 'auto' ? 'Auto' : 'Manual'}
                  </Badge>
                  <Badge className={getStatusBadge(detailCollection.status)} variant="outline">
                    {detailCollection.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {detailCollection.status.charAt(0).toUpperCase() + detailCollection.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {collectionProducts.length} product{collectionProducts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {detailCollection.description && (
                  <p className="text-sm text-muted-foreground mt-1">{detailCollection.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenProductSelector(detailCollection.id)}
                disabled={detailCollection.type === 'auto'}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Products
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(detailCollection)}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Auto collection conditions display */}
        {detailCollection.type === 'auto' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Auto-Collection Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    try {
                      const conditions = JSON.parse(detailCollection.conditions || '{}') as Record<string, unknown>
                      const rules: string[] = []
                      if (conditions.category) rules.push(`Category: ${conditions.category}`)
                      if (conditions.tags) rules.push(`Tags: ${conditions.tags}`)
                      if (conditions.minPrice) rules.push(`Min Price: ${formatPrice(Number(conditions.minPrice))}`)
                      if (conditions.maxPrice) rules.push(`Max Price: ${formatPrice(Number(conditions.maxPrice))}`)
                      if (conditions.featured) rules.push('Featured Only')
                      if (rules.length === 0) rules.push('No conditions defined')
                      return rules.map((rule, i) => (
                        <Badge key={i} variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                          {rule}
                        </Badge>
                      ))
                    } catch {
                      return <span className="text-sm text-muted-foreground">No conditions defined</span>
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Products list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Products in Collection</CardTitle>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : collectionProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {detailCollection.type === 'auto'
                      ? 'No products match the auto-collection rules'
                      : 'No products added yet'}
                  </p>
                  {detailCollection.type === 'manual' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => handleOpenProductSelector(detailCollection.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Products
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {collectionProducts.map((cp) => {
                    const product = cp.product
                    if (!product) return null
                    const productImage = getProductImage(product.images)
                    return (
                      <div
                        key={cp.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GripVertical className="w-4 h-4" />
                          <span className="text-xs w-6 text-center">{cp.position + 1}</span>
                        </div>
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={product.name}
                            className="w-10 h-10 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border">
                            <Package className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                            {product.category && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {product.featured && (
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          <Badge
                            variant="outline"
                            className={product.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px]'
                              : 'bg-gray-50 dark:bg-gray-800 text-gray-500 text-[10px]'
                            }
                          >
                            {product.status}
                          </Badge>
                          {detailCollection.type === 'manual' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={() => handleRemoveProduct(detailCollection.id, product.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ========== LIST VIEW ==========
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Collections
              {collections.length > 0 && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  ({collections.length})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Group products into collections for your store</p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Collection
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatedStat value={totalCollections} label="Total Collections" icon={Layers} gradientClass="card-gradient-emerald" borderClass="border-t-2 border-t-emerald-500" />
          <AnimatedStat value={activeCollections} label="Active" icon={CheckCircle2} gradientClass="card-gradient-sky" borderClass="border-t-2 border-t-sky-500" />
          <AnimatedStat value={featuredCollections} label="Featured" icon={Star} gradientClass="card-gradient-violet" borderClass="border-t-2 border-t-violet-500" />
          <AnimatedStat value={totalProducts} label="Products in Collections" icon={Package} gradientClass="card-gradient-orange" borderClass="border-t-2 border-t-orange-500" />
        </div>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="overflow-x-auto">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all" className="gap-1">
                All <span className="text-xs text-muted-foreground ml-1">{totalCollections}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1">
                Active <span className="text-xs text-muted-foreground ml-1">{activeCollections}</span>
              </TabsTrigger>
              <TabsTrigger value="draft" className="gap-1">
                Draft <span className="text-xs text-muted-foreground ml-1">{totalCollections - activeCollections}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </motion.div>

      {/* Collection Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {filteredCollections.length === 0 ? (
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 empty-state-icon">
                <Layers className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium">No collections found</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm mx-auto">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters to find what you\'re looking for'
                  : 'Create your first collection to group and organize your products'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCollections.map((collection, idx) => (
                <motion.div
                  key={collection.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover-lift transition-all duration-200 border-l-4 cursor-pointer group"
                    style={{ borderLeftColor: collection.status === 'active' ? '#10b981' : '#9ca3af' }}
                    onClick={() => handleViewDetail(collection)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge className={getTypeBadge(collection.type)} variant="outline">
                              {collection.type === 'auto' ? <Zap className="w-3 h-3 mr-1" /> : <Sliders className="w-3 h-3 mr-1" />}
                              {collection.type === 'auto' ? 'Auto' : 'Manual'}
                            </Badge>
                            <Badge className={getStatusBadge(collection.status)} variant="outline">
                              {collection.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                              {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {idx < 3 && (
                              <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${
                                idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : 'bg-amber-700'
                              }`}>
                                {idx + 1}
                              </span>
                            )}
                            <CardTitle className="text-lg leading-tight truncate">{collection.name}</CardTitle>
                            {collection.featured && (
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetail(collection) }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(collection) }}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {collection.type === 'manual' && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenProductSelector(collection.id) }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Products
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleToggleFeatured(collection) }}>
                              {collection.featured ? (
                                <><StarOff className="w-4 h-4 mr-2" />Unfeature</>
                              ) : (
                                <><Star className="w-4 h-4 mr-2" />Feature</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(collection) }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); setDeleteId(collection.id) }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Collection Image */}
                      {collection.image && (
                        <div className="w-full h-32 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Description */}
                      {collection.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{collection.description}</p>
                      )}

                      {/* Auto conditions preview */}
                      {collection.type === 'auto' && (() => {
                        try {
                          const conditions = JSON.parse(collection.conditions || '{}') as Record<string, unknown>
                          const rules: string[] = []
                          if (conditions.category) rules.push(String(conditions.category))
                          if (conditions.tags) rules.push(`Tags: ${conditions.tags}`)
                          if (conditions.minPrice || conditions.maxPrice) {
                            const min = conditions.minPrice ? formatPrice(Number(conditions.minPrice)) : '₹0'
                            const max = conditions.maxPrice ? formatPrice(Number(conditions.maxPrice)) : '∞'
                            rules.push(`${min} - ${max}`)
                          }
                          if (conditions.featured) rules.push('Featured')
                          return rules.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rules.map((rule, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-1.5 py-0 h-5">
                                  {rule}
                                </Badge>
                              ))}
                            </div>
                          ) : null
                        } catch {
                          return null
                        }
                      })()}

                      {/* Product count & sort */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Package className="w-4 h-4" />
                          <span>{collection.productCount || 0} product{(collection.productCount || 0) !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ArrowUpDown className="w-3 h-3" />
                          {getSortOrderLabel(collection.sortOrder)}
                        </div>
                      </div>

                      {/* Slug */}
                      <div className="text-xs text-muted-foreground font-mono truncate">
                        /{collection.slug}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? 'Edit Collection' : 'Create Collection'}
            </DialogTitle>
            <DialogDescription>
              {editingCollection ? 'Update collection details' : 'Create a new product collection for your store'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coll-name">Collection Name *</Label>
                <Input
                  id="coll-name"
                  placeholder="e.g. Summer Collection"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm({
                      ...form,
                      name,
                      slug: generateSlugFromName(name),
                    })
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coll-slug">Slug</Label>
                <Input
                  id="coll-slug"
                  placeholder="auto-generated"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="coll-desc">Description</Label>
              <Textarea
                id="coll-desc"
                placeholder="Describe this collection..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="coll-image">Image URL</Label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="coll-image"
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <Separator />

            {/* Type Toggle */}
            <div className="space-y-3">
              <Label>Collection Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'manual' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    form.type === 'manual'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders className={`w-4 h-4 ${form.type === 'manual' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">Manual</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Manually select which products to include</p>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'auto' })}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    form.type === 'auto'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${form.type === 'auto' ? 'text-amber-600' : 'text-muted-foreground'}`} />
                    <span className="font-medium text-sm">Automated</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Auto-include products matching conditions</p>
                </button>
              </div>
            </div>

            {/* Auto Collection Conditions */}
            {form.type === 'auto' && (
              <div className="space-y-4 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Auto-Collection Rules
                </h4>
                <p className="text-xs text-muted-foreground">Products matching these conditions will be automatically included</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cond-category">Category</Label>
                    <Input
                      id="cond-category"
                      placeholder="e.g. Sarees"
                      value={autoConditions.category}
                      onChange={(e) => setAutoConditions({ ...autoConditions, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cond-tags">Tags (comma separated)</Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="cond-tags"
                        placeholder="e.g. silk, wedding"
                        value={autoConditions.tags}
                        onChange={(e) => setAutoConditions({ ...autoConditions, tags: e.target.value })}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cond-min-price">Min Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="cond-min-price"
                        type="number"
                        min="0"
                        placeholder="No minimum"
                        value={autoConditions.minPrice}
                        onChange={(e) => setAutoConditions({ ...autoConditions, minPrice: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cond-max-price">Max Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        id="cond-max-price"
                        type="number"
                        min="0"
                        placeholder="No maximum"
                        value={autoConditions.maxPrice}
                        onChange={(e) => setAutoConditions({ ...autoConditions, maxPrice: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="cond-featured"
                    checked={autoConditions.featured}
                    onCheckedChange={(checked) => setAutoConditions({ ...autoConditions, featured: checked === true })}
                  />
                  <Label htmlFor="cond-featured" className="text-sm font-normal">
                    Only include featured products
                  </Label>
                </div>
              </div>
            )}

            <Separator />

            {/* Sort Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={form.sortOrder}
                  onValueChange={(v) => setForm({ ...form, sortOrder: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-selling">Best Selling</SelectItem>
                    <SelectItem value="alpha">Alphabetical (A-Z)</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as 'active' | 'draft' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Featured Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Featured Collection</Label>
                <p className="text-sm text-muted-foreground">
                  {form.featured ? 'This collection is featured on your store' : 'This collection is not featured'}
                </p>
              </div>
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => setForm({ ...form, featured: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Saving...
                </>
              ) : (
                editingCollection ? 'Update Collection' : 'Create Collection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Selector Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Products to Collection</DialogTitle>
            <DialogDescription>
              Select products to add to this collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {products
                .filter(p => p.status === 'active')
                .filter(p => {
                  if (!productSearch) return true
                  return p.name.toLowerCase().includes(productSearch.toLowerCase())
                })
                .map(product => {
                  const isSelected = selectedProductIds.includes(product.id)
                  const productImage = getProductImage(product.images)
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-border hover:bg-muted/30'
                      }`}
                      onClick={() => {
                        setSelectedProductIds(prev =>
                          isSelected
                            ? prev.filter(id => id !== product.id)
                            : [...prev, product.id]
                        )
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-10 h-10 rounded-md object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center border">
                          <Package className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{formatPrice(product.price)}</span>
                          {product.category && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {product.featured && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                  )
                })}
            </div>

            {selectedProductIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddProducts}
              disabled={addingProducts || selectedProductIds.length === 0}
            >
              {addingProducts ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Adding...
                </>
              ) : (
                `Add ${selectedProductIds.length} Product${selectedProductIds.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? Products in the collection will not be deleted, only the collection grouping will be removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
