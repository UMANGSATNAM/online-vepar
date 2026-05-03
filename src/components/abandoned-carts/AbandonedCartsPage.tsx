'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Search, Filter, MoreHorizontal, Trash2,
  Mail, CheckCircle2, Clock, AlertTriangle, Send,
  ChevronDown, ChevronUp, X, Package, StickyNote,
  RefreshCw, IndianRupee, Percent, MessageSquare
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface AbandonedCart {
  id: string
  storeId: string
  customerEmail: string
  customerName: string | null
  customerPhone: string | null
  items: string // JSON
  subtotal: number
  tax: number
  shipping: number
  total: number
  currency: string
  recoveryToken: string
  recoveryUrl: string | null
  status: string
  emailSentAt: string | null
  emailOpenedAt: string | null
  recoveredAt: string | null
  abandonedAt: string
  expiresAt: string | null
  reminderCount: number
  lastReminderAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface CartStats {
  totalAbandoned: number
  totalValue: number
  recoveryRate: number
  emailsSent: number
}

// Status badge helper
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
    abandoned: {
      className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 relative',
      icon: <><AlertTriangle className="w-3 h-3 mr-1" /><span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full"><span className="absolute inset-0 bg-amber-400 rounded-full animate-ping" /></span></>,
      label: 'Abandoned',
    },
    email_sent: {
      className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: <Mail className="w-3 h-3 mr-1" />,
      label: 'Email Sent',
    },
    recovered: {
      className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
      label: 'Recovered',
    },
    expired: {
      className: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
      icon: <Clock className="w-3 h-3 mr-1" />,
      label: 'Expired',
    },
  }

  const variant = variants[status] || variants.abandoned

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.icon}
      {variant.label}
    </Badge>
  )
}

// Relative time helper
function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AbandonedCartsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // List state
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [stats, setStats] = useState<CartStats>({ totalAbandoned: 0, totalValue: 0, recoveryRate: 0, emailsSent: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30d')

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Selected carts for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dialogs
  const [showReminderDialog, setShowReminderDialog] = useState(false)
  const [reminderCart, setReminderCart] = useState<AbandonedCart | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteCartId, setNoteCartId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)

  const fetchCarts = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ storeId: currentStore.id })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (dateRange) params.set('dateRange', dateRange)
      if (search) params.set('search', search)

      const res = await fetch(`/api/abandoned-carts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch abandoned carts')
      const data = await res.json()
      setCarts(data.carts || [])
      if (data.stats) setStats(data.stats)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch abandoned carts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, search, statusFilter, dateRange, toast])

  useEffect(() => {
    fetchCarts()
  }, [fetchCarts])

  // Status counts for tabs - fetch all counts from a separate unfiltered request
  const [allCarts, setAllCarts] = useState<AbandonedCart[]>([])

  // Fetch all carts (unfiltered) for status counts
  useEffect(() => {
    if (!currentStore?.id) return
    fetch(`/api/abandoned-carts?storeId=${currentStore.id}&limit=1000`)
      .then(r => r.json())
      .then(data => setAllCarts(data.carts || []))
      .catch(() => {})
  }, [currentStore?.id])

  const statusCounts = {
    all: allCarts.length,
    abandoned: allCarts.filter(c => c.status === 'abandoned').length,
    email_sent: allCarts.filter(c => c.status === 'email_sent').length,
    recovered: allCarts.filter(c => c.status === 'recovered').length,
    expired: allCarts.filter(c => c.status === 'expired').length,
  }

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Parse items JSON
  const parseItems = (itemsJson: string): CartItem[] => {
    try {
      return JSON.parse(itemsJson || '[]')
    } catch {
      return []
    }
  }

  // Send reminder
  const handleSendReminder = async () => {
    if (!reminderCart) return
    setSendingReminder(true)
    try {
      const res = await fetch(`/api/abandoned-carts/${reminderCart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendReminder: true }),
      })
      if (!res.ok) throw new Error('Failed to send reminder')
      toast({ title: 'Reminder Sent', description: `Recovery email sent to ${reminderCart.customerEmail}` })
      setShowReminderDialog(false)
      setReminderCart(null)
      fetchCarts()
    } catch {
      toast({ title: 'Error', description: 'Failed to send reminder', variant: 'destructive' })
    } finally {
      setSendingReminder(false)
    }
  }

  // Mark as recovered
  const handleMarkRecovered = async (cart: AbandonedCart) => {
    try {
      const res = await fetch(`/api/abandoned-carts/${cart.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'recovered' }),
      })
      if (!res.ok) throw new Error('Failed to update cart')
      toast({ title: 'Cart Recovered', description: `Cart for ${cart.customerEmail} marked as recovered` })
      fetchCarts()
    } catch {
      toast({ title: 'Error', description: 'Failed to update cart', variant: 'destructive' })
    }
  }

  // Add note
  const handleSaveNote = async () => {
    if (!noteCartId) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/abandoned-carts/${noteCartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: noteText }),
      })
      if (!res.ok) throw new Error('Failed to save note')
      toast({ title: 'Note Saved', description: 'Note has been saved successfully' })
      setShowNoteDialog(false)
      fetchCarts()
    } catch {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' })
    } finally {
      setSavingNote(false)
    }
  }

  // Delete cart
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/abandoned-carts/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete cart')
      toast({ title: 'Success', description: 'Abandoned cart deleted successfully' })
      fetchCarts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete cart', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // Bulk send reminders
  const handleBulkSendReminders = async () => {
    if (selectedIds.size === 0) return
    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id =>
          fetch(`/api/abandoned-carts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sendReminder: true }),
          })
        )
      )
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      toast({ title: 'Bulk Reminders Sent', description: `${succeeded} of ${selectedIds.size} reminders sent successfully` })
      setSelectedIds(new Set())
      fetchCarts()
    } catch {
      toast({ title: 'Error', description: 'Failed to send bulk reminders', variant: 'destructive' })
    }
  }

  // Toggle select
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === carts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(carts.map(c => c.id)))
    }
  }

  // ========== LOADING STATE ==========
  if (loading && carts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-96" />
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
              Abandoned Carts
              {stats.totalAbandoned > 0 && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  ({stats.totalAbandoned})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Track and recover abandoned shopping carts</p>
          </div>
          <Button
            variant="outline"
            className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all duration-200"
            onClick={fetchCarts}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
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
          <Card className="border-t-2 border-t-amber-500 card-gradient-orange hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalAbandoned}</p>
                  <p className="text-xs text-muted-foreground">Total Abandoned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-emerald-500 card-gradient-emerald hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-xs text-muted-foreground">Abandoned Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-green-500 card-gradient-emerald hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Percent className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.recoveryRate}%</p>
                  <p className="text-xs text-muted-foreground">Recovery Rate</p>
                </div>
              </div>
              {/* Recovery rate progress bar */}
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-progress"
                  style={{ width: `${stats.recoveryRate}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.recoveryRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-2 border-t-sky-500 card-gradient-sky hover-lift transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.emailsSent}</p>
                  <p className="text-xs text-muted-foreground">Reminders Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Recovery Rate Visual */}
      {stats.totalAbandoned > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground">Cart Recovery Overview</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Recovered</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">Email Sent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">Abandoned</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-muted-foreground">Expired</span>
                  </div>
                </div>
              </div>
              <div className="flex h-6 rounded-full overflow-hidden bg-muted">
                {(() => {
                  const total = stats.totalAbandoned || 1
                  const recovered = carts.filter(c => c.status === 'recovered').length
                  const emailSent = carts.filter(c => c.status === 'email_sent').length
                  const abandoned = carts.filter(c => c.status === 'abandoned').length
                  const expired = carts.filter(c => c.status === 'expired').length

                  return (
                    <>
                      {recovered > 0 && (
                        <motion.div
                          className="bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(recovered / total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      )}
                      {emailSent > 0 && (
                        <motion.div
                          className="bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(emailSent / total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        />
                      )}
                      {abandoned > 0 && (
                        <motion.div
                          className="bg-amber-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(abandoned / total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        />
                      )}
                      {expired > 0 && (
                        <motion.div
                          className="bg-gray-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${(expired / total) * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                        />
                      )}
                    </>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
              <TabsTrigger value="abandoned" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                Abandoned <span className="text-xs text-muted-foreground ml-1">{statusCounts.abandoned}</span>
              </TabsTrigger>
              <TabsTrigger value="email_sent" className="gap-1">
                <Mail className="w-3 h-3" />
                Email Sent <span className="text-xs text-muted-foreground ml-1">{statusCounts.email_sent}</span>
              </TabsTrigger>
              <TabsTrigger value="recovered" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Recovered <span className="text-xs text-muted-foreground ml-1">{statusCounts.recovered}</span>
              </TabsTrigger>
              <TabsTrigger value="expired" className="gap-1">
                <Clock className="w-3 h-3" />
                Expired <span className="text-xs text-muted-foreground ml-1">{statusCounts.expired}</span>
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
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>{carts.length} cart{carts.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </motion.div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {selectedIds.size} cart{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    onClick={handleBulkSendReminders}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Send Reminders
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Carts Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {carts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium">No abandoned carts found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'When customers leave items in their cart, they will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === carts.length && carts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Abandoned</TableHead>
                    <TableHead>Last Reminder</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {carts.map((cart) => {
                      const items = parseItems(cart.items)
                      const isExpanded = expandedRows.has(cart.id)
                      const isSelected = selectedIds.has(cart.id)

                      return (
                        <motion.tr
                          key={cart.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className={`border-b border-border table-row-hover cursor-pointer ${
                            cart.status === 'recovered' ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : ''
                          }`}
                          onClick={() => toggleExpand(cart.id)}
                        >
                          {/* Select */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(cart.id)}
                            />
                          </TableCell>

                          {/* Customer */}
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {cart.customerName || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cart.customerEmail}
                              </p>
                              {cart.customerPhone && (
                                <p className="text-xs text-muted-foreground">
                                  {cart.customerPhone}
                                </p>
                              )}
                            </div>
                          </TableCell>

                          {/* Items Count */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>

                          {/* Total Value */}
                          <TableCell>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(cart.total)}
                            </span>
                          </TableCell>

                          {/* Status */}
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                              <StatusBadge status={cart.status} />
                            </div>
                          </TableCell>

                          {/* Abandoned Date */}
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {timeAgo(cart.abandonedAt)}
                            </span>
                          </TableCell>

                          {/* Last Reminder */}
                          <TableCell>
                            {cart.lastReminderAt ? (
                              <div className="text-sm text-muted-foreground">
                                <span>{timeAgo(cart.lastReminderAt)}</span>
                                <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 h-4">
                                  #{cart.reminderCount}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">None</span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(cart.status === 'abandoned' || cart.status === 'email_sent') && (
                                  <DropdownMenuItem onClick={() => {
                                    setReminderCart(cart)
                                    setShowReminderDialog(true)
                                  }}>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Reminder
                                  </DropdownMenuItem>
                                )}
                                {cart.status !== 'recovered' && (
                                  <DropdownMenuItem onClick={() => handleMarkRecovered(cart)}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Recovered
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => {
                                  setNoteCartId(cart.id)
                                  setNoteText(cart.notes || '')
                                  setShowNoteDialog(true)
                                }}>
                                  <StickyNote className="w-4 h-4 mr-2" />
                                  Add Note
                                </DropdownMenuItem>
                                {cart.recoveryUrl && (
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(cart.recoveryUrl!)
                                    toast({ title: 'Copied', description: 'Recovery URL copied to clipboard' })
                                  }}>
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Copy Recovery URL
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(cart.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Expanded cart items */}
            <AnimatePresence>
              {Array.from(expandedRows).map(cartId => {
                const cart = carts.find(c => c.id === cartId)
                if (!cart) return null
                const items = parseItems(cart.items)

                return (
                  <motion.div
                    key={`expanded-${cartId}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border bg-muted/30"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-600" />
                          Cart Items
                        </h4>
                        <div className="text-xs text-muted-foreground">
                          Subtotal: {formatCurrency(cart.subtotal)} | Tax: {formatCurrency(cart.tax)} | Shipping: {formatCurrency(cart.shipping)}
                        </div>
                      </div>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No items in cart</p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border">
                              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                {item.image ? (
                                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-emerald-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(item.price)} × {item.quantity}
                                </p>
                              </div>
                              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {cart.notes && (
                        <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Note:</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400">{cart.notes}</p>
                        </div>
                      )}
                      {cart.recoveryUrl && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Recovery URL:</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono truncate max-w-[300px] block">
                            {cart.recoveryUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => {
                              navigator.clipboard.writeText(cart.recoveryUrl!)
                              toast({ title: 'Copied', description: 'Recovery URL copied to clipboard' })
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </Card>
        )}
      </motion.div>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Send Recovery Reminder
            </DialogTitle>
            <DialogDescription>
              Preview and send a recovery email to the customer
            </DialogDescription>
          </DialogHeader>

          {reminderCart && (
            <div className="space-y-4">
              {/* Email preview */}
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Email header */}
                <div className="bg-emerald-600 text-white p-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span className="font-semibold">{currentStore?.name || 'Online Vepar Store'}</span>
                  </div>
                </div>
                {/* Email body */}
                <div className="p-4 bg-white dark:bg-gray-900 space-y-3">
                  <p className="text-sm">
                    Hi <strong>{reminderCart.customerName || 'there'}</strong>,
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You left some items in your cart at {currentStore?.name || 'our store'}. We saved them for you!
                  </p>
                  {/* Mini cart items */}
                  <div className="space-y-2">
                    {parseItems(reminderCart.items).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/50">
                        <Package className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate flex-1">{item.name}</span>
                        <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right text-sm font-bold pt-1 border-t border-border">
                    Total: {formatCurrency(reminderCart.total)}
                  </div>
                  <div className="text-center pt-2">
                    <div className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium">
                      Complete Your Purchase
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Click the button above to return to your cart and complete your purchase.
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Sending to: <strong>{reminderCart.customerEmail}</strong></p>
                {reminderCart.reminderCount > 0 && (
                  <p className="mt-1">Previous reminders sent: {reminderCart.reminderCount}</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
              onClick={handleSendReminder}
              disabled={sendingReminder}
            >
              {sendingReminder ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reminder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-emerald-600" />
              Add Note
            </DialogTitle>
            <DialogDescription>
              Add an internal note for this abandoned cart
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Add a note about this cart..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
              onClick={handleSaveNote}
              disabled={savingNote}
            >
              {savingNote ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Abandoned Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this abandoned cart record? This action cannot be undone and all data will be permanently removed.
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
