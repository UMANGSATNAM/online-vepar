'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import {
  CreditCard,
  Search,
  Plus,
  Copy,
  Pencil,
  Trash2,
  Ban,
  Gift,
  CheckCircle2,
  AlertTriangle,
  X,
  IndianRupee,
  Calendar,
  User,
  Mail,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface GiftCardData {
  id: string
  code: string
  name: string
  description?: string
  initialBalance: number
  currentBalance: number
  currency: string
  status: string
  recipientName?: string
  recipientEmail?: string
  senderName?: string
  message?: string
  purchasedBy?: string
  template: string
  expiresAt?: string
  redeemedAt?: string
  storeId: string
  createdAt: string
  updatedAt: string
}

const templateGradients: Record<string, string> = {
  classic: 'from-blue-500 via-blue-600 to-blue-800',
  birthday: 'from-rose-400 via-pink-500 to-rose-700',
  festive: 'from-amber-400 via-orange-500 to-amber-700',
  minimal: 'from-slate-400 via-slate-500 to-slate-700',
}

const templateDarkGradients: Record<string, string> = {
  classic: 'dark:from-blue-700 dark:via-blue-800 dark:to-blue-950',
  birthday: 'dark:from-rose-600 dark:via-pink-700 dark:to-rose-900',
  festive: 'dark:from-amber-600 dark:via-orange-700 dark:to-amber-900',
  minimal: 'dark:from-slate-600 dark:via-slate-700 dark:to-slate-900',
}

const templateLabels: Record<string, string> = {
  classic: 'Classic',
  birthday: 'Birthday',
  festive: 'Festive',
  minimal: 'Minimal',
}

const templateColors: Record<string, string> = {
  classic: 'emerald',
  birthday: 'rose',
  festive: 'amber',
  minimal: 'slate',
}

const statusColors: Record<string, string> = {
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  redeemed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  disabled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `GC-${segment()}-${segment()}`
}

function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// Animated counter hook for stat cards
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!isInView || hasStarted.current) return
    hasStarted.current = true
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [isInView, target, duration])

  return { count, ref }
}

// Animated stat card component
function AnimatedGiftStatCard({
  value,
  label,
  icon: Icon,
  gradientClass,
  iconBg,
  iconColor,
  isCurrency = false,
  currency = 'INR',
}: {
  value: number
  label: string
  icon: React.ElementType
  gradientClass: string
  iconBg: string
  iconColor: string
  isCurrency?: boolean
  currency?: string
}) {
  const { count, ref } = useAnimatedCounter(value)
  return (
    <Card className={`border-t-2 ${gradientClass} hover:scale-[1.02] transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div ref={ref} className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 animate-count-up">
              {isCurrency ? formatCurrency(count, currency) : count}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function GiftCardsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  const [giftCards, setGiftCards] = useState<GiftCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [total, setTotal] = useState(0)

  // Dialogs
  const [createDialog, setCreateDialog] = useState(false)
  const [editDialog, setEditDialog] = useState(false)
  const [adjustDialog, setAdjustDialog] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    initialBalance: '',
    currency: 'INR',
    recipientName: '',
    recipientEmail: '',
    senderName: '',
    message: '',
    template: 'classic',
    expiresAt: '',
  })

  const [adjustData, setAdjustData] = useState({
    id: '',
    amount: '',
    type: 'add' as 'add' | 'subtract',
    reason: '',
  })

  const [selectedCard, setSelectedCard] = useState<GiftCardData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchGiftCards = useCallback(async () => {
    if (!currentStore) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        storeId: currentStore.id,
        search,
        status: statusTab === 'all' ? '' : statusTab,
      })
      const res = await fetch(`/api/gift-cards?${params}`)
      if (res.ok) {
        const data = await res.json()
        setGiftCards(data.giftCards || [])
        setTotal(data.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch gift cards:', err)
    } finally {
      setLoading(false)
    }
  }, [currentStore, search, statusTab])

  useEffect(() => {
    fetchGiftCards()
  }, [fetchGiftCards])

  // Summary stats
  const activeCards = giftCards.filter((gc) => gc.status === 'active')
  const activeValue = activeCards.reduce((sum, gc) => sum + gc.currentBalance, 0)
  const redeemedCount = giftCards.filter((gc) => gc.status === 'redeemed').length
  const avgValue = giftCards.length > 0
    ? giftCards.reduce((sum, gc) => sum + gc.initialBalance, 0) / giftCards.length
    : 0

  const handleCreate = async () => {
    if (!currentStore || !formData.name || !formData.initialBalance) return

    try {
      setSubmitting(true)
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          ...formData,
          initialBalance: parseFloat(formData.initialBalance),
          code: formData.code || undefined,
        }),
      })

      if (res.ok) {
        toast({ title: 'Gift card created', description: `${formData.name} has been created successfully` })
        setCreateDialog(false)
        resetForm()
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create gift card', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedCard || !currentStore) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/gift-cards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          name: formData.name,
          description: formData.description,
          recipientName: formData.recipientName,
          recipientEmail: formData.recipientEmail,
          senderName: formData.senderName,
          message: formData.message,
          template: formData.template,
          expiresAt: formData.expiresAt || null,
          code: formData.code,
        }),
      })

      if (res.ok) {
        toast({ title: 'Gift card updated', description: `${formData.name} has been updated` })
        setEditDialog(false)
        resetForm()
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update gift card', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustBalance = async () => {
    if (!selectedCard || !currentStore) return

    try {
      setSubmitting(true)
      const amount = parseFloat(adjustData.amount)
      const adjustment = adjustData.type === 'add' ? amount : -amount

      const res = await fetch(`/api/gift-cards/${selectedCard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          balanceAdjustment: adjustment,
          balanceReason: adjustData.reason,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Balance adjusted',
          description: `${adjustData.type === 'add' ? 'Added' : 'Subtracted'} ${formatCurrency(amount)} ${adjustData.reason ? `(${adjustData.reason})` : ''}`,
        })
        setAdjustDialog(false)
        setAdjustData({ id: '', amount: '', type: 'add', reason: '' })
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to adjust balance', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (gc: GiftCardData, newStatus: string) => {
    if (!currentStore) return

    try {
      const res = await fetch(`/api/gift-cards/${gc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: currentStore.id, status: newStatus }),
      })

      if (res.ok) {
        toast({
          title: `Gift card ${newStatus}`,
          description: `${gc.name} has been ${newStatus}`,
        })
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!selectedCard || !currentStore) return

    try {
      setSubmitting(true)
      const res = await fetch(`/api/gift-cards/${selectedCard.id}?storeId=${currentStore.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Gift card deleted', description: `${selectedCard.name} has been deleted` })
        setDeleteDialog(false)
        setSelectedCard(null)
        fetchGiftCards()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete gift card', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({ title: 'Code copied', description: `${code} copied to clipboard` })
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      initialBalance: '',
      currency: 'INR',
      recipientName: '',
      recipientEmail: '',
      senderName: '',
      message: '',
      template: 'classic',
      expiresAt: '',
    })
    setSelectedCard(null)
  }

  const openEditDialog = (gc: GiftCardData) => {
    setSelectedCard(gc)
    setFormData({
      code: gc.code,
      name: gc.name,
      description: gc.description || '',
      initialBalance: String(gc.initialBalance),
      currency: gc.currency,
      recipientName: gc.recipientName || '',
      recipientEmail: gc.recipientEmail || '',
      senderName: gc.senderName || '',
      message: gc.message || '',
      template: gc.template,
      expiresAt: gc.expiresAt ? new Date(gc.expiresAt).toISOString().split('T')[0] : '',
    })
    setEditDialog(true)
  }

  const openAdjustDialog = (gc: GiftCardData) => {
    setSelectedCard(gc)
    setAdjustData({ id: gc.id, amount: '', type: 'add', reason: '' })
    setAdjustDialog(true)
  }

  // Loading skeletons
  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-3 space-y-2 bg-card">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-blue-600" />
            Gift Cards
          </h1>
          <p className="text-muted-foreground mt-1">Create, sell, and manage gift cards for your store</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setFormData((prev) => ({ ...prev, code: generateCode() }))
            setCreateDialog(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Gift Card
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <AnimatedGiftStatCard
            value={total}
            label="Total Gift Cards"
            icon={CreditCard}
            gradientClass="border-t-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <AnimatedGiftStatCard
            value={activeValue}
            label="Active Value"
            icon={IndianRupee}
            gradientClass="border-t-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
            isCurrency
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AnimatedGiftStatCard
            value={redeemedCount}
            label="Redeemed"
            icon={CheckCircle2}
            gradientClass="border-t-rose-500"
            iconBg="bg-rose-50 dark:bg-rose-900/30"
            iconColor="text-rose-600 dark:text-rose-400"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AnimatedGiftStatCard
            value={Math.round(avgValue)}
            label="Avg. Value"
            icon={ArrowUpRight}
            gradientClass="border-t-sky-500"
            iconBg="bg-sky-50 dark:bg-sky-900/30"
            iconColor="text-sky-600 dark:text-sky-400"
            isCurrency
          />
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by code, name, recipient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList className="h-9">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-3">Active</TabsTrigger>
            <TabsTrigger value="redeemed" className="text-xs px-3">Redeemed</TabsTrigger>
            <TabsTrigger value="expired" className="text-xs px-3">Expired</TabsTrigger>
            <TabsTrigger value="disabled" className="text-xs px-3">Disabled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Gift Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : giftCards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Gift className="w-10 h-10 text-blue-300 dark:text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-muted-foreground">No gift cards found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {search || statusTab !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first gift card to get started'}
          </p>
          {!search && statusTab === 'all' && (
            <Button
              onClick={() => {
                resetForm()
                setFormData((prev) => ({ ...prev, code: generateCode() }))
                setCreateDialog(true)
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2 transition-all duration-200 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Create Gift Card
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {giftCards.map((gc, idx) => (
              <motion.div
                key={gc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                layout
              >
                {/* Visual Gift Card */}
                <div className="group rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 border border-border hover-lift">
                  {/* Gift card visual */}
                  <div className={`relative h-48 bg-gradient-to-br ${templateGradients[gc.template] || templateGradients.classic} ${templateDarkGradients[gc.template] || ''} p-4 flex flex-col justify-between overflow-hidden`}>
                    {/* Decorative pattern overlay */}
                    <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    {/* Gift Card watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/[0.06] text-5xl font-bold tracking-widest rotate-[-15deg] select-none">GIFT CARD</span>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5" />

                    {/* Status badge */}
                    <div className="relative flex justify-between items-start">
                      <Badge className={`${statusColors[gc.status]} text-[10px] font-semibold uppercase tracking-wider`}>
                        {gc.status}
                      </Badge>
                      <span className="text-white/50 text-[10px] font-mono">
                        {templateLabels[gc.template] || 'Classic'}
                      </span>
                    </div>

                    {/* Balance & Code */}
                    <div className="relative">
                      <p className="text-white/80 text-xs font-medium mb-0.5">Balance</p>
                      <p className="text-white text-3xl font-bold tracking-tight">
                        {formatCurrency(gc.currentBalance, gc.currency)}
                      </p>
                    </div>

                    {/* Code & Info */}
                    <div className="relative">
                      {/* Dashed separator */}
                      <div className="border-t border-dashed border-white/20 mb-2" />
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-white font-mono text-sm tracking-widest">{gc.code}</p>
                          <p className="text-white/70 text-xs mt-0.5">{gc.name}</p>
                        </div>
                        {gc.recipientName && (
                          <div className="text-right">
                            <p className="text-white/60 text-[10px]">To:</p>
                            <p className="text-white/80 text-xs">{gc.recipientName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expiry indicator */}
                    {gc.expiresAt && (
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center gap-1 bg-black/20 rounded px-1.5 py-0.5">
                          <Calendar className="w-2.5 h-2.5 text-white/70" />
                          <span className="text-white/70 text-[9px]">
                            {new Date(gc.expiresAt) < new Date() ? 'Expired' : formatDate(gc.expiresAt)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-3 bg-card flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Initial: {formatCurrency(gc.initialBalance, gc.currency)}</span>
                      {gc.currentBalance !== gc.initialBalance && gc.status === 'active' && (
                        <span className="text-blue-600 dark:text-blue-400 ml-1">
                          ({formatCurrency(gc.currentBalance - gc.initialBalance, gc.currency)} adj.)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyCode(gc.code)}
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openEditDialog(gc)}
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {gc.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openAdjustDialog(gc)}
                          title="Adjust balance"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {gc.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-orange-600 hover:text-orange-700"
                          onClick={() => handleStatusChange(gc, 'disabled')}
                          title="Disable"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {gc.status === 'disabled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:text-blue-700"
                          onClick={() => handleStatusChange(gc, 'active')}
                          title="Enable"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedCard(gc)
                          setDeleteDialog(true)
                        }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Gift Card Dialog */}
      <Dialog open={createDialog} onOpenChange={(open) => { if (!open) { setCreateDialog(false); resetForm() } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-600" />
              Create Gift Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Template</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(templateLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, template: key }))}
                    className={`relative rounded-lg overflow-hidden h-16 transition-all ${
                      formData.template === key
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background'
                        : 'ring-1 ring-border hover:ring-blue-300'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${templateGradients[key]}`} />
                    <span className="relative text-white text-[10px] font-medium mt-1 block">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Code */}
            <div>
              <Label htmlFor="gc-code">Code</Label>
              <div className="flex gap-2">
                <Input
                  id="gc-code"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="GC-XXXX-XXXX"
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, code: generateCode() }))}
                  className="whitespace-nowrap"
                >
                  Generate
                </Button>
              </div>
            </div>

            {/* Name & Balance */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="gc-name">Name *</Label>
                <Input
                  id="gc-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Birthday Gift Card"
                />
              </div>
              <div>
                <Label htmlFor="gc-balance">Initial Balance *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="gc-balance"
                    type="number"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData((prev) => ({ ...prev, initialBalance: e.target.value }))}
                    placeholder="2000"
                    className="pl-9"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="gc-desc">Description</Label>
              <Input
                id="gc-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="A special gift for someone"
              />
            </div>

            {/* Recipient info */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Recipient Info (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gc-recipient-name">Recipient Name</Label>
                  <Input
                    id="gc-recipient-name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="gc-recipient-email">Recipient Email</Label>
                  <Input
                    id="gc-recipient-email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="gc-sender">Sender Name</Label>
                <Input
                  id="gc-sender"
                  value={formData.senderName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                  placeholder="From: Store Name"
                />
              </div>
              <div>
                <Label htmlFor="gc-message">Gift Message</Label>
                <Textarea
                  id="gc-message"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="Happy Birthday! Enjoy your gift!"
                  rows={2}
                />
              </div>
            </div>

            {/* Expiry */}
            <div>
              <Label htmlFor="gc-expiry">Expiry Date (Optional)</Label>
              <Input
                id="gc-expiry"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialog(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={submitting || !formData.name || !formData.initialBalance}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:scale-[1.02]"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Gift Card Dialog */}
      <Dialog open={editDialog} onOpenChange={(open) => { if (!open) { setEditDialog(false); resetForm() } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-blue-600" />
              Edit Gift Card
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Template</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(templateLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, template: key }))}
                    className={`relative rounded-lg overflow-hidden h-16 transition-all ${
                      formData.template === key
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-background'
                        : 'ring-1 ring-border hover:ring-blue-300'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${templateGradients[key]}`} />
                    <span className="relative text-white text-[10px] font-medium mt-1 block">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-gc-code">Code</Label>
              <Input
                id="edit-gc-code"
                value={formData.code}
                onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="font-mono"
              />
            </div>

            <div>
              <Label htmlFor="edit-gc-name">Name</Label>
              <Input
                id="edit-gc-name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="edit-gc-desc">Description</Label>
              <Input
                id="edit-gc-desc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Status Change */}
            {selectedCard && (
              <div>
                <Label>Current Status</Label>
                <div className="flex gap-2 mt-1">
                  {(['active', 'disabled', 'expired'] as const).map((s) => (
                    <Button
                      key={s}
                      variant={selectedCard.status === s ? 'default' : 'outline'}
                      size="sm"
                      className={selectedCard.status === s ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                      onClick={() => {
                        handleStatusChange(selectedCard, s)
                        setSelectedCard({ ...selectedCard, status: s })
                      }}
                      disabled={selectedCard.status === 'redeemed'}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Recipient info */}
            <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Recipient Info
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit-gc-recipient-name">Recipient Name</Label>
                  <Input
                    id="edit-gc-recipient-name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gc-recipient-email">Recipient Email</Label>
                  <Input
                    id="edit-gc-recipient-email"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, recipientEmail: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-gc-sender">Sender Name</Label>
                <Input
                  id="edit-gc-sender"
                  value={formData.senderName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, senderName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-gc-message">Gift Message</Label>
                <Textarea
                  id="edit-gc-message"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-gc-expiry">Expiry Date</Label>
              <Input
                id="edit-gc-expiry"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog(false); resetForm() }}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {adjustData.type === 'add' ? (
                <ArrowUpRight className="w-5 h-5 text-blue-600" />
              ) : (
                <ArrowDownRight className="w-5 h-5 text-red-600" />
              )}
              Adjust Balance
            </DialogTitle>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-xl font-bold">{formatCurrency(selectedCard.currentBalance, selectedCard.currency)}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">{selectedCard.code}</p>
              </div>

              <div>
                <Label>Adjustment Type</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={adjustData.type === 'add' ? 'default' : 'outline'}
                    size="sm"
                    className={adjustData.type === 'add' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                    onClick={() => setAdjustData((prev) => ({ ...prev, type: 'add' }))}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant={adjustData.type === 'subtract' ? 'default' : 'outline'}
                    size="sm"
                    className={adjustData.type === 'subtract' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    onClick={() => setAdjustData((prev) => ({ ...prev, type: 'subtract' }))}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
                    Subtract
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="adj-amount">Amount</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="adj-amount"
                    type="number"
                    value={adjustData.amount}
                    onChange={(e) => setAdjustData((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="500"
                    className="pl-9"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adj-reason">Reason (Optional)</Label>
                <Input
                  id="adj-reason"
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Customer complaint, promotion, etc."
                />
              </div>

              {adjustData.amount && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">New Balance</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      adjustData.type === 'add'
                        ? selectedCard.currentBalance + parseFloat(adjustData.amount || '0')
                        : selectedCard.currentBalance - parseFloat(adjustData.amount || '0'),
                      selectedCard.currency
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={submitting || !adjustData.amount}
              className={adjustData.type === 'add' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {adjustData.type === 'add' ? 'Add Balance' : 'Subtract Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Gift Card
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCard?.name}</strong> ({selectedCard?.code})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
