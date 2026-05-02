'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Plus, Search, LayoutGrid, List, MoreHorizontal, Pencil, Trash2,
  Eye, Filter, ChevronLeft, ChevronRight, X, ImageIcon, Upload, GripVertical,
  Tag, ArrowUpDown, CheckCircle2, Archive, CircleDot, Star, ArrowLeft,
  IndianRupee, Calculator, Barcode, Scale, FolderPlus, Download, Layers,
  GripVertical as DragHandle, Minus, Copy, Sparkles, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// ─── Types ────────────────────────────────────────────────────────

interface CategoryData {
  id: string
  name: string
  slug: string
  image?: string | null
  _count?: { products: number }
}

interface ProductData {
  id: string
  name: string
  slug: string
  description?: string | null
  price: number
  comparePrice?: number | null
  cost?: number | null
  images: string
  category?: string | null
  tags: string
  sku?: string | null
  barcode?: string | null
  stock: number
  trackInventory: boolean
  weight?: number | null
  weightUnit: string
  status: string
  featured: boolean
  storeId: string
  categoryId?: string | null
  categoryRef?: CategoryData | null
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface VariantData {
  id: string
  productId: string
  storeId: string
  name: string
  sku: string | null
  price: number | null
  comparePrice: number | null
  stock: number
  options: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface VariantFormData {
  name: string
  sku: string
  price: string
  comparePrice: string
  stock: string
  options: { key: string; value: string }[]
  position: number
  isActive: boolean
}

type ViewMode = 'list' | 'form' | 'detail'
type DisplayMode = 'grid' | 'table'

interface ProductFormData {
  name: string
  description: string
  price: string
  comparePrice: string
  cost: string
  images: string[]
  category: string
  tags: string[]
  sku: string
  barcode: string
  stock: string
  trackInventory: boolean
  continueOOS: boolean
  weight: string
  weightUnit: string
  status: string
  featured: boolean
  categoryId: string
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function parseJSONField(field: string | null | undefined): string[] {
  if (!field) return []
  try {
    const parsed = JSON.parse(field)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 hover:bg-emerald-100">Active</Badge>
    case 'draft':
      return <Badge variant="secondary" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 hover:bg-gray-100">Draft</Badge>
    case 'archived':
      return <Badge variant="outline" className="text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700">Archived</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getStockBadge(stock: number, trackInventory: boolean) {
  if (!trackInventory) return <Badge variant="outline" className="text-blue-600 border-blue-300">Not tracked</Badge>
  if (stock <= 0) return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0">Out of stock</Badge>
  if (stock <= 5) return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">Low stock ({stock})</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">In stock ({stock})</Badge>
}

const emptyFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  comparePrice: '',
  cost: '',
  images: [],
  category: '',
  tags: [],
  sku: '',
  barcode: '',
  stock: '0',
  trackInventory: true,
  continueOOS: false,
  weight: '',
  weightUnit: 'kg',
  status: 'draft',
  featured: false,
  categoryId: '',
}

// ─── Skeleton Loaders ─────────────────────────────────────────────

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ProductTableSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────

export default function ProductsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [detailProductId, setDetailProductId] = useState<string | null>(null)

  // List state
  const [products, setProducts] = useState<ProductData[]>([])
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Categories
  const [categories, setCategories] = useState<CategoryData[]>([])

  // Form state
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [imageInput, setImageInput] = useState('')
  const [tagInput, setTagInput] = useState('')

  // Detail state
  const [detailProduct, setDetailProduct] = useState<ProductData | null>(null)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)

  // Category modal
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryImage, setNewCategoryImage] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // AI Description state
  const [aiPopoverOpen, setAiPopoverOpen] = useState(false)
  const [aiTone, setAiTone] = useState<string>('professional')
  const [aiFeatures, setAiFeatures] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  // Variant state
  const [variants, setVariants] = useState<VariantData[]>([])
  const [isLoadingVariants, setIsLoadingVariants] = useState(false)
  const [variantDialogOpen, setVariantDialogOpen] = useState(false)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [variantFormData, setVariantFormData] = useState<VariantFormData>({
    name: '', sku: '', price: '', comparePrice: '', stock: '0',
    options: [], position: 0, isActive: true,
  })
  const [isSavingVariant, setIsSavingVariant] = useState(false)

  // ─── Fetch Products ───────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    if (!currentStore?.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        page: String(pagination.page),
        limit: String(pagination.limit),
        sortBy,
        sortOrder,
      })
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/products?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch products')
      const data = await res.json()
      setProducts(data.products || [])
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [currentStore?.id, pagination.page, pagination.limit, search, statusFilter, categoryFilter, sortBy, sortOrder, toast])

  // ─── Fetch Categories ────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    if (!currentStore?.id) return
    try {
      const res = await fetch(`/api/categories?storeId=${currentStore.id}`)
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' })
    }
  }, [currentStore?.id, toast])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // ─── Fetch Product Detail ────────────────────────────────────

  const fetchProductDetail = useCallback(async (id: string) => {
    setIsLoadingDetail(true)
    try {
      const res = await fetch(`/api/products/${id}`)
      if (!res.ok) throw new Error('Failed to fetch product')
      const data = await res.json()
      setDetailProduct(data.product)
    } catch {
      toast({ title: 'Error', description: 'Failed to load product details', variant: 'destructive' })
    } finally {
      setIsLoadingDetail(false)
    }
  }, [toast])

  useEffect(() => {
    if (detailProductId) {
      fetchProductDetail(detailProductId)
    }
  }, [detailProductId, fetchProductDetail])

  // ─── Fetch Variants ──────────────────────────────────────────

  const fetchVariants = useCallback(async (productId: string) => {
    setIsLoadingVariants(true)
    try {
      const res = await fetch(`/api/products/${productId}/variants`)
      if (!res.ok) throw new Error('Failed to fetch variants')
      const data = await res.json()
      setVariants(data.variants || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to load variants', variant: 'destructive' })
    } finally {
      setIsLoadingVariants(false)
    }
  }, [toast])

  useEffect(() => {
    if (detailProductId) {
      fetchVariants(detailProductId)
    }
  }, [detailProductId, fetchVariants])

  // ─── Variant Handlers ────────────────────────────────────────

  const openAddVariantDialog = () => {
    setEditingVariantId(null)
    setVariantFormData({
      name: '', sku: '', price: '', comparePrice: '', stock: '0',
      options: [{ key: '', value: '' }], position: variants.length, isActive: true,
    })
    setVariantDialogOpen(true)
  }

  const openEditVariantDialog = (variant: VariantData) => {
    setEditingVariantId(variant.id)
    let parsedOptions: { key: string; value: string }[] = []
    try {
      const opts = JSON.parse(variant.options)
      parsedOptions = Object.entries(opts).map(([key, value]) => ({ key, value: String(value) }))
    } catch { /* empty */ }
    if (parsedOptions.length === 0) parsedOptions = [{ key: '', value: '' }]
    setVariantFormData({
      name: variant.name,
      sku: variant.sku || '',
      price: variant.price !== null ? String(variant.price) : '',
      comparePrice: variant.comparePrice !== null ? String(variant.comparePrice) : '',
      stock: String(variant.stock),
      options: parsedOptions,
      position: variant.position,
      isActive: variant.isActive,
    })
    setVariantDialogOpen(true)
  }

  const handleSaveVariant = async () => {
    if (!variantFormData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Variant name is required', variant: 'destructive' })
      return
    }
    if (!detailProductId) return

    setIsSavingVariant(true)
    try {
      const optionsObj: Record<string, string> = {}
      variantFormData.options.forEach(opt => {
        if (opt.key.trim() && opt.value.trim()) {
          optionsObj[opt.key.trim()] = opt.value.trim()
        }
      })

      const payload = {
        name: variantFormData.name.trim(),
        sku: variantFormData.sku.trim() || null,
        price: variantFormData.price ? parseFloat(variantFormData.price) : null,
        comparePrice: variantFormData.comparePrice ? parseFloat(variantFormData.comparePrice) : null,
        stock: parseInt(variantFormData.stock) || 0,
        options: optionsObj,
        position: variantFormData.position,
        isActive: variantFormData.isActive,
      }

      let res: Response
      if (editingVariantId) {
        res = await fetch(`/api/products/variants/${editingVariantId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/products/${detailProductId}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save variant')
      }

      toast({
        title: 'Success',
        description: editingVariantId ? 'Variant updated' : 'Variant created',
      })
      setVariantDialogOpen(false)
      setEditingVariantId(null)
      fetchVariants(detailProductId)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save variant',
        variant: 'destructive',
      })
    } finally {
      setIsSavingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!detailProductId) return
    try {
      const res = await fetch(`/api/products/variants/${variantId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Variant deleted' })
      fetchVariants(detailProductId)
    } catch {
      toast({ title: 'Error', description: 'Failed to delete variant', variant: 'destructive' })
    }
  }

  const handleAddOptionField = () => {
    setVariantFormData(prev => ({
      ...prev,
      options: [...prev.options, { key: '', value: '' }],
    }))
  }

  const handleRemoveOptionField = (index: number) => {
    setVariantFormData(prev => ({
      ...prev,
      options: prev.options.length > 1 ? prev.options.filter((_, i) => i !== index) : prev.options,
    }))
  }

  const handleUpdateOptionField = (index: number, field: 'key' | 'value', val: string) => {
    setVariantFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? { ...opt, [field]: val } : opt),
    }))
  }

  // ─── AI Description Generator ──────────────────────────────────

  const handleAiGenerate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Product Name Required', description: 'Please enter a product name before generating a description.', variant: 'destructive' })
      return
    }
    setIsGeneratingAi(true)
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category || '',
          price: formData.price || '',
          features: aiFeatures.trim(),
          tone: aiTone,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to generate description')
      }
      const data = await res.json()
      setFormData(prev => ({ ...prev, description: data.description }))
      setAiPopoverOpen(false)
      toast({ title: 'Description Generated', description: 'AI has generated a product description for you.' })
    } catch (err) {
      toast({
        title: 'Generation Failed',
        description: err instanceof Error ? err.message : 'Failed to generate description. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // ─── Handlers ────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleSortChange = (value: string) => {
    switch (value) {
      case 'newest':
        setSortBy('createdAt'); setSortOrder('desc'); break
      case 'oldest':
        setSortBy('createdAt'); setSortOrder('asc'); break
      case 'price-high':
        setSortBy('price'); setSortOrder('desc'); break
      case 'price-low':
        setSortBy('price'); setSortOrder('asc'); break
      case 'name-az':
        setSortBy('name'); setSortOrder('asc'); break
    }
  }

  const getCurrentSortValue = () => {
    if (sortBy === 'createdAt' && sortOrder === 'desc') return 'newest'
    if (sortBy === 'createdAt' && sortOrder === 'asc') return 'oldest'
    if (sortBy === 'price' && sortOrder === 'desc') return 'price-high'
    if (sortBy === 'price' && sortOrder === 'asc') return 'price-low'
    if (sortBy === 'name' && sortOrder === 'asc') return 'name-az'
    return 'newest'
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => fetch(`/api/products/${id}`, { method: 'DELETE' }))
      )
      toast({ title: 'Success', description: `${selectedIds.size} product(s) deleted` })
      setSelectedIds(new Set())
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete some products', variant: 'destructive' })
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      )
      toast({ title: 'Success', description: `${selectedIds.size} product(s) updated to ${status}` })
      setSelectedIds(new Set())
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Failed to update some products', variant: 'destructive' })
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Success', description: 'Product deleted' })
      if (viewMode === 'detail') {
        setViewMode('list')
        setDetailProductId(null)
        setDetailProduct(null)
      }
      fetchProducts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' })
    }
  }

  // ─── Form Handlers ───────────────────────────────────────────

  const openAddForm = () => {
    setEditingProductId(null)
    setFormData(emptyFormData)
    setImageInput('')
    setTagInput('')
    setViewMode('form')
  }

  const openEditForm = (product: ProductData) => {
    setEditingProductId(product.id)
    const imgs = parseJSONField(product.images)
    const tags = parseJSONField(product.tags)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      comparePrice: product.comparePrice != null ? String(product.comparePrice) : '',
      cost: product.cost != null ? String(product.cost) : '',
      images: imgs,
      category: product.category || '',
      tags,
      sku: product.sku || '',
      barcode: product.barcode || '',
      stock: String(product.stock),
      trackInventory: product.trackInventory,
      continueOOS: false,
      weight: product.weight != null ? String(product.weight) : '',
      weightUnit: product.weightUnit || 'kg',
      status: product.status,
      featured: product.featured,
      categoryId: product.categoryId || '',
    })
    setImageInput('')
    setTagInput('')
    setViewMode('form')
  }

  const openDetail = (id: string) => {
    setDetailProductId(id)
    setViewMode('detail')
  }

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageInput.trim()] }))
      setImageInput('')
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const handleMoveImage = (from: number, to: number) => {
    setFormData(prev => {
      const newImages = [...prev.images]
      const [moved] = newImages.splice(from, 1)
      newImages.splice(to, 0, moved)
      return { ...prev, images: newImages }
    })
  }

  const handleAddTag = () => {
    const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    if (newTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...new Set([...prev.tags, ...newTags])],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const calculateProfitMargin = () => {
    const price = parseFloat(formData.price)
    const cost = parseFloat(formData.cost)
    if (isNaN(price) || isNaN(cost) || price === 0 || cost === 0) return null
    const margin = ((price - cost) / price) * 100
    return margin.toFixed(1)
  }

  const handleSave = async (saveStatus?: string) => {
    if (!formData.name.trim()) {
      toast({ title: 'Validation Error', description: 'Product name is required', variant: 'destructive' })
      return
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      toast({ title: 'Validation Error', description: 'Valid price is required', variant: 'destructive' })
      return
    }
    if (!currentStore?.id) return

    setIsSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description || null,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        images: formData.images,
        category: formData.category || null,
        tags: formData.tags,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        stock: parseInt(formData.stock) || 0,
        trackInventory: formData.trackInventory,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weightUnit: formData.weightUnit,
        status: saveStatus || formData.status,
        featured: formData.featured,
        storeId: currentStore.id,
        categoryId: formData.categoryId || null,
      }

      let res: Response
      if (editingProductId) {
        res = await fetch(`/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save product')
      }

      toast({
        title: 'Success',
        description: editingProductId ? 'Product updated' : 'Product created',
      })
      setViewMode('list')
      setEditingProductId(null)
      fetchProducts()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save product',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !currentStore?.id) return
    setIsCreatingCategory(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          image: newCategoryImage.trim() || null,
          storeId: currentStore.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to create category')
      toast({ title: 'Success', description: 'Category created' })
      setNewCategoryName('')
      setNewCategoryImage('')
      setCategoryDialogOpen(false)
      fetchCategories()
    } catch {
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' })
    } finally {
      setIsCreatingCategory(false)
    }
  }

  // ─── Render: Product List View ───────────────────────────────

  const renderListView = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 pb-16 lg:pb-0"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            Products
            {pagination.total > 0 && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                ({pagination.total})
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openAddForm}
            className="btn-gradient text-white h-9 sm:h-10"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            variant="outline"
            className="h-9 sm:h-10"
            onClick={() => window.open(`/api/export?storeId=${currentStore?.id}&type=products`)}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Export</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9 h-9 sm:h-10 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onValueChange={(val) => {
                setCategoryFilter(val)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={getCurrentSortValue()} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="name-az">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Display Mode Toggle */}
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button
                variant={displayMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('grid')}
                className={displayMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-9 sm:h-10' : 'rounded-none h-9 sm:h-10'}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={displayMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('table')}
                className={displayMode === 'table' ? 'bg-emerald-600 hover:bg-emerald-700 text-white rounded-none h-9 sm:h-10' : 'rounded-none h-9 sm:h-10'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex-wrap"
          >
            <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {selectedIds.size} selected
            </span>
            <Button size="sm" variant="outline" className="h-8 sm:h-9 text-xs" onClick={() => handleBulkStatusChange('active')}>
              <CheckCircle2 className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Set Active</span>
            </Button>
            <Button size="sm" variant="outline" className="h-8 sm:h-9 text-xs" onClick={() => handleBulkStatusChange('draft')}>
              <CircleDot className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Set Draft</span>
            </Button>
            <Button size="sm" variant="outline" className="h-8 sm:h-9 text-xs" onClick={() => handleBulkStatusChange('archived')}>
              <Archive className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Archive</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive" className="h-8 sm:h-9 text-xs">
                  <Trash2 className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedIds.size} product(s)?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected products.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" variant="ghost" className="h-8 sm:h-9 text-xs" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Clear</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Display */}
      {isLoading ? (
        displayMode === 'grid' ? <ProductGridSkeleton /> : <ProductTableSkeleton />
      ) : products.length === 0 ? (
        renderEmptyState()
      ) : displayMode === 'grid' ? (
        renderGridView()
      ) : (
        renderTableView()
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                return page === 1 || page === pagination.totalPages ||
                  Math.abs(page - pagination.page) <= 1
              })
              .reduce<(number | string)[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(page)
                return acc
              }, [])
              .map((page, idx) =>
                typeof page === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={pagination.page === page ? 'default' : 'outline'}
                    size="sm"
                    className={pagination.page === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )

  // ─── Render: Grid View ───────────────────────────────────────

  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
      {products.map((product, idx) => {
        const images = parseJSONField(product.images)
        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3) }}
          >
            <Card className="group overflow-hidden card-premium animate-card-entrance border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800">
              {/* Image */}
              <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Checkbox overlay */}
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                    className="bg-white/80 dark:bg-black/50 border-gray-300"
                  />
                </div>
                {/* Featured badge */}
                {product.featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-white border-0 text-[10px] px-1.5">
                      <Star className="w-3 h-3 mr-0.5" /> Featured
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-emerald-600 transition-colors"
                    onClick={() => openDetail(product.id)}
                  >
                    {product.name}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(product.id)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditForm(product)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{product.name}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {getStockBadge(product.stock, product.trackInventory)}
                  {getStatusBadge(product.status)}
                </div>

                {product.categoryRef && (
                  <Badge variant="outline" className="text-[10px]">
                    {product.categoryRef.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )

  // ─── Render: Table View ──────────────────────────────────────

  const renderTableView = () => (
    <Card>
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selectedIds.size === products.length && products.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Inventory</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const images = parseJSONField(product.images)
            return (
              <TableRow key={product.id} className={`group table-row-hover animate-row-appear ${products.indexOf(product) % 2 === 1 ? 'table-row-alt' : ''}`}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                      {images.length > 0 ? (
                        <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-medium text-sm truncate cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => openDetail(product.id)}
                      >
                        {product.name}
                      </p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(product.status)}</TableCell>
                <TableCell>{getStockBadge(product.stock, product.trackInventory)}</TableCell>
                <TableCell>
                  {product.categoryRef ? (
                    <Badge variant="outline" className="text-xs">{product.categoryRef.name}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-xs text-muted-foreground line-through ml-1">
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openDetail(product.id)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditForm(product)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &quot;{product.name}&quot;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </Card>
  )

  // ─── Render: Empty State ─────────────────────────────────────

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="py-16">
        <CardContent className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-emerald-600 empty-state-icon" />
          </div>
          <h3 className="text-xl font-semibold">No products yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {search || (statusFilter !== 'all') || (categoryFilter !== 'all')
              ? 'No products match your filters. Try adjusting your search or filters.'
              : 'Add your first product to start building your catalog. You can add products manually or import them.'
            }
          </p>
          {!search && statusFilter === 'all' && categoryFilter === 'all' && (
            <Button
              onClick={openAddForm}
              className="btn-gradient text-white mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  // ─── Render: Product Form View ───────────────────────────────

  const renderFormView = () => {
    const profitMargin = calculateProfitMargin()
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setViewMode('list')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            {editingProductId ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-title" className="text-sm font-medium">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="product-title"
                    placeholder="Short sleeve t-shirt"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="product-desc" className="text-sm font-medium">Description</Label>
                    <Popover open={aiPopoverOpen} onOpenChange={setAiPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="btn-gradient text-white h-7 px-2.5 text-xs gap-1.5 hover:text-white"
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-sparkle-pulse" />
                          AI Generate
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 glass-effect" align="end">
                        <div className="p-5 space-y-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-sparkle-pulse" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm">AI Description Generator</h4>
                              <p className="text-[10px] text-muted-foreground">Let AI write your product description</p>
                            </div>
                          </div>
                          <div className="space-y-2 p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50">
                            <Label className="text-xs font-medium">Tone</Label>
                            <Select value={aiTone} onValueChange={setAiTone}>
                              <SelectTrigger className="h-8 text-xs border-emerald-200 dark:border-emerald-800/50 focus:ring-emerald-500/20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual</SelectItem>
                                <SelectItem value="luxury">Luxury</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Key Features</Label>
                            <Input
                              placeholder="e.g. Cotton, Handmade, Eco-friendly"
                              value={aiFeatures}
                              onChange={(e) => setAiFeatures(e.target.value)}
                              className="h-8 text-xs border-emerald-200 dark:border-emerald-800/50 focus:ring-emerald-500/20"
                            />
                            <p className="text-[10px] text-muted-foreground">Comma-separated features to highlight</p>
                          </div>
                          <Button
                            type="button"
                            onClick={handleAiGenerate}
                            disabled={isGeneratingAi || !formData.name.trim()}
                            className="btn-gradient text-white w-full h-9 gap-2 hover:text-white"
                            size="sm"
                          >
                            {isGeneratingAi ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Description
                              </>
                            )}
                          </Button>
                          {!formData.name.trim() && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center">
                              Enter a product name first to generate
                            </p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Textarea
                    id="product-desc"
                    placeholder="Add a description for your product..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </Card>

            {/* Media */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Media
              </h3>
              <div className="space-y-4">
                {/* Image URL Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste image URL and press Add"
                    value={imageInput}
                    onChange={(e) => setImageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddImage()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImage}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Image Thumbnails */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img src={img} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-white hover:bg-white/20"
                              onClick={() => handleMoveImage(idx, idx - 1)}
                            >
                              ←
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-white hover:bg-white/20"
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          {idx < formData.images.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-white hover:bg-white/20"
                              onClick={() => handleMoveImage(idx, idx + 1)}
                            >
                              →
                            </Button>
                          )}
                        </div>
                        {idx === 0 && (
                          <Badge className="absolute bottom-1 left-1 text-[9px] bg-emerald-600 text-white border-0 px-1 py-0">
                            Cover
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop zone placeholder */}
                <div className="border-2 border-dashed rounded-lg p-8 text-center border-muted-foreground/25 hover:border-emerald-400 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Paste an image URL above to add product images
                  </p>
                </div>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium">
                    Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare-price" className="text-sm font-medium">Compare-at price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="compare-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.comparePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-sm font-medium">Cost per item</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="pl-7"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              {profitMargin !== null && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-md">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">
                    Profit margin: <strong>{profitMargin}%</strong>
                  </span>
                </div>
              )}
            </Card>

            {/* Inventory */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-600" />
                Inventory
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                    <Input
                      id="sku"
                      placeholder="SKU-123"
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-sm font-medium">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="Barcode (ISBN, UPC...)"
                      value={formData.barcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-medium">Stock quantity</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="track-inventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackInventory: checked }))}
                    />
                    <Label htmlFor="track-inventory" className="text-sm">Track inventory</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="continue-oos"
                      checked={formData.continueOOS}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, continueOOS: checked }))}
                    />
                    <Label htmlFor="continue-oos" className="text-sm">Continue selling when out of stock</Label>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Product Status */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Product Status</h3>
              <RadioGroup
                value={formData.status}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="status-draft" />
                  <Label htmlFor="status-draft" className="cursor-pointer flex items-center gap-2">
                    <CircleDot className="w-3 h-3 text-gray-400" />
                    Draft
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="status-active" />
                  <Label htmlFor="status-active" className="cursor-pointer flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Active
                  </Label>
                </div>
              </RadioGroup>
            </Card>

            {/* Product Organization */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" />
                Product Organization
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.categoryId}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, categoryId: val }))}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                          <FolderPlus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Category</DialogTitle>
                          <DialogDescription>Create a new product category</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label htmlFor="cat-name">Category Name</Label>
                            <Input
                              id="cat-name"
                              placeholder="e.g., Electronics"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cat-image">Image URL (optional)</Label>
                            <Input
                              id="cat-image"
                              placeholder="https://..."
                              value={newCategoryImage}
                              onChange={(e) => setNewCategoryImage(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setCategoryDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateCategory}
                            disabled={isCreatingCategory || !newCategoryName.trim()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white button-press"
                          >
                            {isCreatingCategory ? 'Creating...' : 'Create Category'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tags (comma-separated)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button variant="outline" size="icon" className="shrink-0" onClick={handleAddTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Shipping */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                Shipping
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">Weight</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.0"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  />
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-sm font-medium">Unit</Label>
                  <Select
                    value={formData.weightUnit}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, weightUnit: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Featured */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Featured Product
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Featured products appear prominently in your store
                  </p>
                </div>
                <Switch
                  checked={formData.featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                />
              </div>
            </Card>

            {/* Action Buttons */}
            <Card className="p-6 space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleSave(formData.status === 'active' ? undefined : 'active')}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : (editingProductId ? 'Update Product' : 'Save Product')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
              >
                Save as Draft
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setViewMode('list')}
              >
                Cancel
              </Button>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Render: Product Detail View ─────────────────────────────

  const renderDetailView = () => {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      )
    }

    if (!detailProduct) return null

    const images = parseJSONField(detailProduct.images)
    const tags = parseJSONField(detailProduct.tags)

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => {
              setViewMode('list')
              setDetailProductId(null)
              setDetailProduct(null)
            }}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{detailProduct.name}</h1>
              {detailProduct.sku && (
                <p className="text-sm text-muted-foreground">SKU: {detailProduct.sku}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => openEditForm(detailProduct)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete product?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{detailProduct.name}&quot;. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteProduct(detailProduct.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Product Images</h3>
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted border">
                      <img src={img} alt={`${detailProduct.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Description</h3>
              {detailProduct.description ? (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {detailProduct.description}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No description provided</p>
              )}
            </Card>

            {/* Variants */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Variants
                  {variants.length > 0 && (
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0 text-xs">
                      {variants.length}
                    </Badge>
                  )}
                </h3>
                <Button
                  size="sm"
                  onClick={openAddVariantDialog}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white button-press"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Variant
                </Button>
              </div>

              {isLoadingVariants ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : variants.length === 0 ? (
                <div className="text-center py-10 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="empty-state-icon mb-3">
                    <Layers className="w-14 h-14 mx-auto text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No variants yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Add variants like sizes, colors, or materials to offer product options to your customers
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openAddVariantDialog}
                    className="mt-4 border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add First Variant
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">Variant</TableHead>
                        <TableHead className="text-xs">SKU</TableHead>
                        <TableHead className="text-xs">Price</TableHead>
                        <TableHead className="text-xs">Stock</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant, idx) => {
                        let parsedOptions: Record<string, string> = {}
                        try { parsedOptions = JSON.parse(variant.options) } catch { /* empty */ }
                        const optionEntries = Object.entries(parsedOptions)
                        return (
                          <TableRow key={variant.id} className={`table-row-hover ${idx % 2 === 1 ? 'table-row-alt' : ''}`}>
                            <TableCell>
                              <div className="flex items-start gap-2">
                                <span className={`variant-dot mt-1.5 ${variant.isActive ? 'variant-dot-active' : 'variant-dot-inactive'}`} />
                                <div>
                                  <p className="font-medium text-sm">{variant.name}</p>
                                  {optionEntries.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {optionEntries.map(([key, value]) => (
                                        <span
                                          key={key}
                                          className="variant-option-pill"
                                        >
                                          {key}: {value}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground font-mono">
                                {variant.sku || '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {variant.price !== null ? (
                                <span className="font-medium text-sm text-emerald-600 dark:text-emerald-400">
                                  {formatPrice(variant.price)}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/60 italic">
                                  Same as product
                                </span>
                              )}
                              {variant.comparePrice && variant.price && variant.comparePrice > variant.price && (
                                <span className="text-xs text-muted-foreground line-through ml-1">
                                  {formatPrice(variant.comparePrice)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm ${
                                variant.stock <= 0 ? 'stock-out' :
                                variant.stock <= 10 ? 'stock-low' :
                                'stock-good'
                              }`}>
                                {variant.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              {variant.isActive ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px]">Active</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 hover:text-emerald-600"
                                  onClick={() => openEditVariantDialog(variant)}
                                  title="Edit variant"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:text-red-600"
                                      title="Delete variant"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete variant?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the &quot;{variant.name}&quot; variant. This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteVariant(variant.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Price & Status */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Pricing & Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatPrice(detailProduct.price)}
                  </span>
                </div>
                {detailProduct.comparePrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Compare-at price</span>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(detailProduct.comparePrice)}
                    </span>
                  </div>
                )}
                {detailProduct.cost && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost</span>
                    <span className="text-sm">{formatPrice(detailProduct.cost)}</span>
                  </div>
                )}
                {detailProduct.cost && detailProduct.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Margin</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {((detailProduct.price - detailProduct.cost) / detailProduct.price * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(detailProduct.status)}
                </div>
                {detailProduct.featured && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Featured</span>
                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-0">
                      <Star className="w-3 h-3 mr-1" /> Yes
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Inventory */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Inventory</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stock</span>
                  {getStockBadge(detailProduct.stock, detailProduct.trackInventory)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <span className="text-sm font-medium">{detailProduct.stock}</span>
                </div>
                {detailProduct.barcode && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Barcode</span>
                    <span className="text-sm">{detailProduct.barcode}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Organization */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Organization</h3>
              <div className="space-y-3">
                {detailProduct.categoryRef && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Category</span>
                    <Badge variant="outline">{detailProduct.categoryRef.name}</Badge>
                  </div>
                )}
                {tags.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {detailProduct.weight && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Weight</span>
                    <span className="text-sm">{detailProduct.weight} {detailProduct.weightUnit}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Dates */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">{new Date(detailProduct.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Updated</span>
                  <span className="text-sm">{new Date(detailProduct.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && <div key="list">{renderListView()}</div>}
        {viewMode === 'form' && <div key="form">{renderFormView()}</div>}
        {viewMode === 'detail' && <div key="detail">{renderDetailView()}</div>}
      </AnimatePresence>

      {/* Variant Create/Edit Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              {editingVariantId ? 'Edit Variant' : 'Add Variant'}
            </DialogTitle>
            <DialogDescription>
              {editingVariantId ? 'Update variant details for this product' : 'Create a new variant like a size, color, or material option'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2 max-h-[70vh] overflow-y-auto">
            {/* Variant Name */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Variant Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g., Red / Large, Size M"
                value={variantFormData.name}
                onChange={(e) => setVariantFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">A descriptive name for this variant</p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-600" /> Options
              </Label>
              <div className="space-y-2">
                {variantFormData.options.map((opt, idx) => (
                  <div key={idx} className="option-field-card flex items-center gap-2">
                    <Input
                      placeholder="Option name (e.g., Color)"
                      value={opt.key}
                      onChange={(e) => handleUpdateOptionField(idx, 'key', e.target.value)}
                      className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    />
                    <Input
                      placeholder="Value (e.g., Red)"
                      value={opt.value}
                      onChange={(e) => handleUpdateOptionField(idx, 'value', e.target.value)}
                      className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemoveOptionField(idx)}
                      disabled={variantFormData.options.length <= 1}
                      title="Remove option"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOptionField}
                className="w-full border-dashed border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                title="Add another option"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Option
              </Button>
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">SKU</Label>
              <Input
                placeholder="e.g., SAR-001-RED-L"
                value={variantFormData.sku}
                onChange={(e) => setVariantFormData(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>

            {/* Price fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Price Override</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Same as product"
                    className="pl-7"
                    value={variantFormData.price}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Leave empty to use product price</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Compare-at Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    className="pl-7"
                    value={variantFormData.comparePrice}
                    onChange={(e) => setVariantFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Stock with real-time total preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stock Quantity</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={variantFormData.stock}
                  onChange={(e) => setVariantFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-32"
                />
                <div className="text-xs text-muted-foreground">
                  Total across all variants: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {variants.reduce((sum, v) => sum + v.stock, 0) + (parseInt(variantFormData.stock) || 0) - (editingVariantId ? (variants.find(v => v.id === editingVariantId)?.stock || 0) : 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="variant-active"
                checked={variantFormData.isActive}
                onCheckedChange={(checked) => setVariantFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="variant-active" className="text-sm cursor-pointer">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVariantDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVariant}
              disabled={isSavingVariant}
              className="btn-gradient text-white"
            >
              {isSavingVariant ? 'Saving...' : (editingVariantId ? 'Update Variant' : 'Create Variant')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
