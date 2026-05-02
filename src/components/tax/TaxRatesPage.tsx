'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Plus, Search, Filter, MoreHorizontal, Edit2, Trash2,
  CheckCircle2, XCircle, Globe, MapPin, Layers, ToggleLeft,
  ChevronUp, ChevronDown, AlertCircle, Percent, ArrowUpDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface TaxRate {
  id: string
  name: string
  rate: number
  country?: string | null
  state?: string | null
  city?: string | null
  zipCode?: string | null
  isCompound: boolean
  priority: number
  isActive: boolean
  storeId: string
  createdAt: string
  updatedAt: string
}

// Country list for dropdown
const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'SG', label: 'Singapore' },
  { value: 'AE', label: 'UAE' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'ZA', label: 'South Africa' },
]

function getCountryName(code: string | null | undefined): string {
  if (!code) return '—'
  const country = COUNTRIES.find(c => c.value === code)
  return country ? country.label : code
}

const emptyForm = {
  name: '',
  rate: 18,
  country: '',
  state: '',
  city: '',
  zipCode: '',
  isCompound: false,
  priority: 0,
  isActive: true,
}

export default function TaxRatesPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // List state
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState<'priority' | 'rate' | 'name' | 'createdAt'>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchTaxRates = useCallback(async () => {
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

      const res = await fetch(`/api/tax-rates?${params}`)
      if (!res.ok) throw new Error('Failed to fetch tax rates')
      const data = await res.json()
      setTaxRates(data.taxRates || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch tax rates', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, search, statusFilter, toast])

  useEffect(() => {
    fetchTaxRates()
  }, [fetchTaxRates])

  // Client-side sort
  const sortedTaxRates = [...taxRates].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'priority':
        comparison = (a.priority || 0) - (b.priority || 0)
        break
      case 'rate':
        comparison = a.rate - b.rate
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Summary stats
  const totalRates = taxRates.length
  const activeRates = taxRates.filter(t => t.isActive).length
  const defaultRate = taxRates.find(t => t.isActive && !t.country && !t.state)
  const countriesCovered = new Set(taxRates.filter(t => t.country).map(t => t.country)).size

  const statusCounts = {
    all: taxRates.length,
    active: taxRates.filter(t => t.isActive).length,
    inactive: taxRates.filter(t => !t.isActive).length,
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3 h-3 ml-1 text-emerald-600" />
      : <ChevronDown className="w-3 h-3 ml-1 text-emerald-600" />
  }

  const handleCreate = () => {
    setEditingTaxRate(null)
    setForm({ ...emptyForm })
    setShowFormDialog(true)
  }

  const handleEdit = (taxRate: TaxRate) => {
    setEditingTaxRate(taxRate)
    setForm({
      name: taxRate.name,
      rate: taxRate.rate,
      country: taxRate.country || '',
      state: taxRate.state || '',
      city: taxRate.city || '',
      zipCode: taxRate.zipCode || '',
      isCompound: taxRate.isCompound,
      priority: taxRate.priority,
      isActive: taxRate.isActive,
    })
    setShowFormDialog(true)
  }

  const handleSave = async () => {
    if (!currentStore?.id) return
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' })
      return
    }
    if (form.rate <= 0) {
      toast({ title: 'Error', description: 'Rate must be positive', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        storeId: currentStore.id,
        name: form.name,
        rate: form.rate,
        country: form.country || null,
        state: form.state || null,
        city: form.city || null,
        zipCode: form.zipCode || null,
        isCompound: form.isCompound,
        priority: form.priority,
        isActive: form.isActive,
      }

      if (editingTaxRate) {
        const res = await fetch(`/api/tax-rates/${editingTaxRate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update tax rate')
        }
        toast({ title: 'Success', description: 'Tax rate updated successfully' })
      } else {
        const res = await fetch('/api/tax-rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create tax rate')
        }
        toast({ title: 'Success', description: 'Tax rate created successfully' })
      }

      setShowFormDialog(false)
      fetchTaxRates()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (taxRate: TaxRate) => {
    try {
      const res = await fetch(`/api/tax-rates/${taxRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !taxRate.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update tax rate')
      toast({ title: 'Success', description: `Tax rate ${taxRate.isActive ? 'deactivated' : 'activated'}` })
      fetchTaxRates()
    } catch {
      toast({ title: 'Error', description: 'Failed to update tax rate', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tax-rates/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete tax rate')
      toast({ title: 'Success', description: 'Tax rate deleted successfully' })
      fetchTaxRates()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete tax rate', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // ========== LOADING STATE ==========
  if (loading && taxRates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  // ========== MAIN VIEW ==========
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
              Tax Rates
              {taxRates.length > 0 && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  ({taxRates.length})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Configure tax rates for your store based on regions</p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
            onClick={handleCreate}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tax Rate
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-t-2 border-t-emerald-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalRates}</p>
                  <p className="text-xs text-muted-foreground">Total Tax Rates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-green-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeRates}</p>
                  <p className="text-xs text-muted-foreground">Active Rates</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-amber-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {defaultRate ? `${defaultRate.rate}%` : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">Default Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-sky-500 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{countriesCovered}</p>
                  <p className="text-xs text-muted-foreground">Countries Covered</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
                All <span className="text-xs text-muted-foreground ml-1">{statusCounts.all}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1">
                Active <span className="text-xs text-muted-foreground ml-1">{statusCounts.active}</span>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="gap-1">
                Inactive <span className="text-xs text-muted-foreground ml-1">{statusCounts.inactive}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, country..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{sortedTaxRates.length} tax rate{sortedTaxRates.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </motion.div>

      {/* Tax Rates Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {sortedTaxRates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium">No tax rates found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first tax rate to start collecting taxes on orders'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tax Rate
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                      <div className="flex items-center">
                        Name
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('rate')}>
                      <div className="flex items-center">
                        Rate
                        <SortIcon field="rate" />
                      </div>
                    </TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => handleSort('priority')}>
                      <div className="flex items-center">
                        Priority
                        <SortIcon field="priority" />
                      </div>
                    </TableHead>
                    <TableHead>Compound</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {sortedTaxRates.map((taxRate) => (
                      <motion.tr
                        key={taxRate.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="border-b border-border hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="truncate max-w-[200px]">{taxRate.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                              {taxRate.rate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            {taxRate.country || taxRate.state || taxRate.city ? (
                              <span className="truncate max-w-[180px]">
                                {[
                                  taxRate.city,
                                  taxRate.state,
                                  getCountryName(taxRate.country),
                                ].filter(Boolean).join(', ')}
                                {taxRate.zipCode && ` (${taxRate.zipCode})`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Global</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {taxRate.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {taxRate.isCompound ? (
                            <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" variant="outline">
                              <Layers className="w-3 h-3 mr-1" />
                              Compound
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Simple
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {taxRate.isActive ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" variant="outline">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700" variant="outline">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(taxRate)}>
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(taxRate)}>
                                {taxRate.isActive ? (
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
                              <DropdownMenuItem
                                onClick={() => setDeleteId(taxRate.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Create/Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTaxRate ? 'Edit Tax Rate' : 'Add Tax Rate'}
            </DialogTitle>
            <DialogDescription>
              {editingTaxRate ? 'Update tax rate details' : 'Create a new tax rate for your store'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name & Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tax Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. GST 18%, VAT 5%"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate (%) *</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.rate}
                    onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
                    className="pr-10"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {form.rate <= 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Rate must be positive
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Region / Location */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Region (Optional)
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Leave empty to apply this tax rate globally to all regions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v === '_none' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">All countries</SelectItem>
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / Province</Label>
                  <Input
                    id="state"
                    placeholder="e.g. Maharashtra, California"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip / Postal Code</Label>
                  <Input
                    id="zipCode"
                    placeholder="e.g. 400001"
                    value={form.zipCode}
                    onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Advanced Settings */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <ToggleLeft className="w-4 h-4 text-emerald-600" />
                Advanced Settings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="0"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">Higher priority rates are applied first</p>
                </div>
                <div className="flex items-center justify-between sm:col-span-1 pt-6">
                  <div>
                    <Label className="text-sm">Compound Tax</Label>
                    <p className="text-xs text-muted-foreground">Tax applied on top of other taxes</p>
                  </div>
                  <Switch
                    checked={form.isCompound}
                    onCheckedChange={(checked) => setForm({ ...form, isCompound: checked })}
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
                  {form.isActive ? 'Tax rate is active and will be applied' : 'Tax rate is inactive and will not be applied'}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
              onClick={handleSave}
              disabled={saving || !form.name.trim() || form.rate <= 0}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Saving...
                </>
              ) : (
                editingTaxRate ? 'Update Tax Rate' : 'Create Tax Rate'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tax Rate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tax rate? This action cannot be undone and the tax rate will be permanently removed.
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
