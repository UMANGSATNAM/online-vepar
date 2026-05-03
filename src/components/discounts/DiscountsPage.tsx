'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Tag, Plus, Search, Filter, MoreHorizontal, Edit2, Trash2,
  Copy, CheckCircle2, XCircle, Clock, Percent, DollarSign,
  Calendar, ChevronDown, AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface Discount {
  id: string
  code: string
  name: string
  description?: string
  type: string
  value: number
  minOrderAmount?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usedCount: number
  perCustomerLimit?: number | null
  appliesTo: string
  applicableIds: string
  startsAt?: string | null
  endsAt?: string | null
  isActive: boolean
  storeId: string
  createdAt: string
  updatedAt: string
}

// Helper functions
function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function getDiscountStatus(discount: Discount): 'active' | 'inactive' | 'expired' | 'scheduled' {
  if (!discount.isActive) return 'inactive'
  const now = new Date()
  if (discount.endsAt && new Date(discount.endsAt) < now) return 'expired'
  if (discount.startsAt && new Date(discount.startsAt) > now) return 'scheduled'
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return 'expired'
  return 'active'
}

function getStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-3 h-3" />
    case 'inactive': return <XCircle className="w-3 h-3" />
    case 'expired': return <AlertTriangle className="w-3 h-3" />
    case 'scheduled': return <Clock className="w-3 h-3" />
    default: return null
  }
}

const emptyForm = {
  code: '',
  name: '',
  description: '',
  type: 'percentage' as 'percentage' | 'fixed_amount',
  value: 10,
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  perCustomerLimit: '',
  appliesTo: 'all' as 'all' | 'specific_categories' | 'specific_products',
  applicableIds: '[]',
  startsAt: '',
  endsAt: '',
  isActive: true,
}

export default function DiscountsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // List state
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDiscounts = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ storeId: currentStore.id })
      if (search) params.set('search', search)
      if (statusFilter === 'active') params.set('isActive', 'true')
      else if (statusFilter === 'inactive') params.set('isActive', 'false')

      const res = await fetch(`/api/discounts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch discounts')
      const data = await res.json()
      setDiscounts(data.discounts || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch discounts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, search, statusFilter, toast])

  useEffect(() => {
    fetchDiscounts()
  }, [fetchDiscounts])

  // Filter by computed status on client side (expired, scheduled)
  const filteredDiscounts = discounts.filter((d) => {
    if (statusFilter === 'all') return true
    const status = getDiscountStatus(d)
    return status === statusFilter
  })

  const statusCounts = {
    all: discounts.length,
    active: discounts.filter((d) => getDiscountStatus(d) === 'active').length,
    inactive: discounts.filter((d) => getDiscountStatus(d) === 'inactive').length,
    expired: discounts.filter((d) => getDiscountStatus(d) === 'expired').length,
    scheduled: discounts.filter((d) => getDiscountStatus(d) === 'scheduled').length,
  }

  const handleCreate = () => {
    setEditingDiscount(null)
    setForm({ ...emptyForm })
    setShowFormDialog(true)
  }

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount)
    setForm({
      code: discount.code,
      name: discount.name,
      description: discount.description || '',
      type: discount.type as 'percentage' | 'fixed_amount',
      value: discount.value,
      minOrderAmount: discount.minOrderAmount?.toString() || '',
      maxDiscount: discount.maxDiscount?.toString() || '',
      usageLimit: discount.usageLimit?.toString() || '',
      perCustomerLimit: discount.perCustomerLimit?.toString() || '',
      appliesTo: discount.appliesTo as 'all' | 'specific_categories' | 'specific_products',
      applicableIds: discount.applicableIds,
      startsAt: discount.startsAt ? new Date(discount.startsAt).toISOString().slice(0, 16) : '',
      endsAt: discount.endsAt ? new Date(discount.endsAt).toISOString().slice(0, 16) : '',
      isActive: discount.isActive,
    })
    setShowFormDialog(true)
  }

  const handleSave = async () => {
    if (!currentStore?.id) return
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: 'Error', description: 'Code and name are required', variant: 'destructive' })
      return
    }
    if (form.value <= 0) {
      toast({ title: 'Error', description: 'Value must be positive', variant: 'destructive' })
      return
    }
    if (form.type === 'percentage' && form.value > 100) {
      toast({ title: 'Error', description: 'Percentage cannot exceed 100', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        storeId: currentStore.id,
        code: form.code.toUpperCase(),
        name: form.name,
        description: form.description || null,
        type: form.type,
        value: form.value,
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        perCustomerLimit: form.perCustomerLimit ? parseInt(form.perCustomerLimit) : null,
        appliesTo: form.appliesTo,
        applicableIds: form.applicableIds,
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
        isActive: form.isActive,
      }

      if (editingDiscount) {
        const res = await fetch(`/api/discounts/${editingDiscount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update discount')
        }
        toast({ title: 'Success', description: 'Discount updated successfully' })
      } else {
        const res = await fetch('/api/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create discount')
        }
        toast({ title: 'Success', description: 'Discount created successfully' })
      }

      setShowFormDialog(false)
      fetchDiscounts()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update discount')
      toast({ title: 'Success', description: `Discount ${discount.isActive ? 'deactivated' : 'activated'}` })
      fetchDiscounts()
    } catch {
      toast({ title: 'Error', description: 'Failed to update discount', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/discounts/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete discount')
      toast({ title: 'Success', description: 'Discount deleted successfully' })
      fetchDiscounts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete discount', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` })
  }

  // ========== LOADING STATE ==========
  if (loading && discounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // ========== LIST VIEW ==========
  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Discounts
              {discounts.length > 0 && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  ({discounts.length})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Create and manage discount codes for your store</p>
          </div>
          <Button
            className="btn-gradient text-white"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Discount
          </Button>
        </div>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="overflow-x-auto">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all" className="gap-1">
                All <span className="text-xs text-muted-foreground ml-1">{statusCounts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1">
                Active <span className="text-xs text-muted-foreground ml-1">{statusCounts.active}</span>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="gap-1">
                Inactive <span className="text-xs text-muted-foreground ml-1">{statusCounts.inactive}</span>
              </TabsTrigger>
              <TabsTrigger value="expired" className="gap-1">
                Expired <span className="text-xs text-muted-foreground ml-1">{statusCounts.expired}</span>
              </TabsTrigger>
              <TabsTrigger value="scheduled" className="gap-1">
                Scheduled <span className="text-xs text-muted-foreground ml-1">{statusCounts.scheduled}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search discounts by code, name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{filteredDiscounts.length} discount{filteredDiscounts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </motion.div>

      {/* Discount Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {filteredDiscounts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium">No discounts found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first discount code to attract customers'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  className="mt-4 btn-gradient text-white"
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Discount
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredDiscounts.map((discount) => {
                const status = getDiscountStatus(discount)
                const usagePercent = discount.usageLimit
                  ? Math.round((discount.usedCount / discount.usageLimit) * 100)
                  : 0

                return (
                  <motion.div
                    key={discount.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="h-full card-premium animate-card-entrance border-l-4"
                      style={{ borderLeftColor: status === 'active' ? '#10b981' : status === 'expired' ? '#ef4444' : status === 'scheduled' ? '#3b82f6' : '#9ca3af' }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`${getStatusBadge(status)} ${status === 'active' ? 'badge-glow' : ''}`} variant="outline">
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(status)}
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                              </Badge>
                              {discount.type === 'percentage' ? (
                                <Percent className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <DollarSign className="w-4 h-4 text-emerald-600" />
                              )}
                            </div>
                            <CardTitle className="text-lg leading-tight">{discount.name}</CardTitle>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(discount)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(discount)}>
                                {discount.isActive ? (
                                  <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyCode(discount.code)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteId(discount.id)}
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
                        {/* Discount Code */}
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded font-mono text-sm font-bold tracking-wider">
                            {discount.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 copy-flash"
                            onClick={() => copyCode(discount.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Value Display */}
                        <div className="text-2xl font-bold text-emerald-600">
                          {discount.type === 'percentage'
                            ? `${discount.value}% OFF`
                            : `${formatPrice(discount.value)} OFF`}
                        </div>

                        {/* Description */}
                        {discount.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{discount.description}</p>
                        )}

                        {/* Usage Stats */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Usage</span>
                            <span className="font-medium">
                              {discount.usedCount}{discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
                            </span>
                          </div>
                          {discount.usageLimit && (
                            <div
                              className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden"
                            >
                              <div
                                className="progress-gradient h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Constraints */}
                        <div className="flex flex-wrap gap-1.5 text-xs">
                          {discount.minOrderAmount && (
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full">
                              Min: {formatPrice(discount.minOrderAmount)}
                            </span>
                          )}
                          {discount.maxDiscount && discount.type === 'percentage' && (
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                              Max: {formatPrice(discount.maxDiscount)}
                            </span>
                          )}
                          {discount.perCustomerLimit && (
                            <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full">
                              {discount.perCustomerLimit}x / customer
                            </span>
                          )}
                          {discount.appliesTo !== 'all' && (
                            <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                              {discount.appliesTo === 'specific_categories' ? 'Specific categories' : 'Specific products'}
                            </span>
                          )}
                        </div>

                        {/* Dates */}
                        {(discount.startsAt || discount.endsAt) && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {discount.startsAt && formatDate(discount.startsAt)}
                            {discount.startsAt && discount.endsAt && ' → '}
                            {discount.endsAt && formatDate(discount.endsAt)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount ? 'Edit Discount' : 'Create Discount'}
            </DialogTitle>
            <DialogDescription>
              {editingDiscount ? 'Update discount code details' : 'Create a new discount code for your store'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Code & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g. SUMMER2025"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Summer Sale 20% Off"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this discount..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Type & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as 'percentage' | 'fixed_amount', value: v === 'percentage' ? 10 : 100 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <span className="flex items-center gap-2">
                        <Percent className="w-4 h-4" />
                        Percentage
                      </span>
                    </SelectItem>
                    <SelectItem value="fixed_amount">
                      <span className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Fixed Amount
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">
                  {form.type === 'percentage' ? 'Discount Percentage *' : 'Discount Amount *'}
                </Label>
                <div className="relative">
                  {form.type === 'percentage' ? (
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  ) : (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  )}
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={form.type === 'percentage' ? 100 : undefined}
                    step={form.type === 'percentage' ? 1 : 10}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                    className={form.type === 'fixed_amount' ? 'pl-8' : 'pr-10'}
                  />
                </div>
                {form.type === 'percentage' && form.value > 100 && (
                  <p className="text-xs text-destructive">Percentage cannot exceed 100</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Constraints */}
            <div>
              <h4 className="text-sm font-medium mb-3">Constraints</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      min="0"
                      placeholder="No minimum"
                      value={form.minOrderAmount}
                      onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Maximum Discount Cap</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      placeholder={form.type === 'percentage' ? 'No cap' : 'N/A'}
                      disabled={form.type !== 'percentage'}
                      value={form.maxDiscount}
                      onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                      className="pl-8"
                    />
                  </div>
                  {form.type !== 'percentage' && (
                    <p className="text-xs text-muted-foreground">Only applicable for percentage discounts</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perCustomerLimit">Per Customer Limit</Label>
                  <Input
                    id="perCustomerLimit"
                    type="number"
                    min="0"
                    placeholder="Unlimited"
                    value={form.perCustomerLimit}
                    onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Applies To */}
            <div className="space-y-2">
              <Label>Applies To</Label>
              <Select
                value={form.appliesTo}
                onValueChange={(v) => setForm({ ...form, appliesTo: v as 'all' | 'specific_categories' | 'specific_products' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="specific_categories">Specific Categories</SelectItem>
                  <SelectItem value="specific_products">Specific Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Dates */}
            <div>
              <h4 className="text-sm font-medium mb-3">Schedule</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Start Date</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">End Date</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  {form.isActive ? 'Discount is currently active and can be used' : 'Discount is inactive and cannot be used'}
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancel
            </Button>
            <Button
              className="btn-gradient text-white"
              onClick={handleSave}
              disabled={saving || !form.code.trim() || !form.name.trim() || form.value <= 0 || (form.type === 'percentage' && form.value > 100)}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Saving...
                </>
              ) : (
                editingDiscount ? 'Update Discount' : 'Create Discount'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this discount? This action cannot be undone and the discount code will be permanently removed.
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
