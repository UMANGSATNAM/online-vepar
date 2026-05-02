'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'framer-motion'
import {
  Users, Plus, Search, MoreHorizontal, Edit2, Trash2,
  UserPlus, Shield, ShieldCheck, Eye, UserCheck,
  Mail, Clock, CheckCircle2, XCircle, AlertTriangle,
  Info, UserCog
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface StaffMember {
  id: string
  email: string
  name: string
  role: string
  status: string
  avatar?: string | null
  permissions: string
  storeId: string
  invitedAt: string
  acceptedAt?: string | null
  lastActiveAt?: string | null
  createdAt: string
  updatedAt: string
}

interface Permissions {
  products: boolean
  orders: boolean
  customers: boolean
  analytics: boolean
  discounts: boolean
  settings: boolean
  reviews: boolean
  inventory: boolean
  shipping: boolean
  taxRates: boolean
  abandonedCarts: boolean
  pages: boolean
  collections: boolean
}

// Permission labels and groups
const permissionGroups = [
  { key: 'products', label: 'Products', description: 'Manage products and variants' },
  { key: 'orders', label: 'Orders', description: 'View and manage orders' },
  { key: 'customers', label: 'Customers', description: 'View and manage customers' },
  { key: 'analytics', label: 'Analytics', description: 'View store analytics and reports' },
  { key: 'discounts', label: 'Discounts', description: 'Create and manage discount codes' },
  { key: 'settings', label: 'Settings', description: 'Modify store settings' },
  { key: 'reviews', label: 'Reviews', description: 'Manage product reviews' },
  { key: 'inventory', label: 'Inventory', description: 'Track and manage inventory' },
  { key: 'shipping', label: 'Shipping', description: 'Configure shipping zones and rates' },
  { key: 'taxRates', label: 'Tax Rates', description: 'Manage tax rates' },
  { key: 'abandonedCarts', label: 'Abandoned Carts', description: 'View and recover abandoned carts' },
  { key: 'pages', label: 'Pages', description: 'Create and edit store pages' },
  { key: 'collections', label: 'Collections', description: 'Manage product collections' },
] as const

const roleDescriptions: Record<string, string> = {
  admin: 'Full access to all features and settings',
  manager: 'Access to most features, limited settings',
  staff: 'Day-to-day operations, no settings or discounts',
  viewer: 'Read-only access to view data',
}

const roleDefaults: Record<string, Permissions> = {
  admin: {
    products: true, orders: true, customers: true, analytics: true,
    discounts: true, settings: true, reviews: true, inventory: true,
    shipping: true, taxRates: true, abandonedCarts: true, pages: true, collections: true,
  },
  manager: {
    products: true, orders: true, customers: true, analytics: true,
    discounts: true, settings: false, reviews: true, inventory: true,
    shipping: true, taxRates: false, abandonedCarts: true, pages: true, collections: true,
  },
  staff: {
    products: true, orders: true, customers: true, analytics: true,
    discounts: false, settings: false, reviews: true, inventory: true,
    shipping: false, taxRates: false, abandonedCarts: false, pages: false, collections: true,
  },
  viewer: {
    products: true, orders: true, customers: true, analytics: true,
    discounts: false, settings: false, reviews: true, inventory: false,
    shipping: false, taxRates: false, abandonedCarts: false, pages: false, collections: false,
  },
}

const defaultPermissions: Permissions = {
  products: true, orders: true, customers: true, analytics: true,
  discounts: false, settings: false, reviews: true, inventory: true,
  shipping: false, taxRates: false, abandonedCarts: false, pages: false, collections: true,
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleBadgeClasses(role: string): string {
  const colors: Record<string, string> = {
    admin: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 shadow-[0_0_8px_oklch(0.55_0.16_155/0.2)]',
    manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-[0_0_8px_oklch(0.55_0.15_240/0.2)]',
    staff: 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800 shadow-[0_0_8px_oklch(0.6_0.2_300/0.2)]',
    viewer: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  }
  return colors[role] || colors.staff
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'admin': return <ShieldCheck className="w-3 h-3" />
    case 'manager': return <Shield className="w-3 h-3" />
    case 'staff': return <UserCog className="w-3 h-3" />
    case 'viewer': return <Eye className="w-3 h-3" />
    default: return <Users className="w-3 h-3" />
  }
}

function getStatusBadgeClasses(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    invited: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    disabled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-3 h-3" />
    case 'invited': return <Mail className="w-3 h-3" />
    case 'disabled': return <XCircle className="w-3 h-3" />
    default: return null
  }
}

function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parsePermissions(permStr: string): Permissions {
  try {
    return { ...defaultPermissions, ...JSON.parse(permStr) }
  } catch {
    return { ...defaultPermissions }
  }
}

function countTruePermissions(permStr: string): number {
  const perms = parsePermissions(permStr)
  return Object.values(perms).filter(Boolean).length
}

const emptyForm = {
  email: '',
  name: '',
  role: 'staff' as string,
  status: 'invited' as string,
  permissions: { ...defaultPermissions } as Permissions,
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
function AnimatedStatCard({
  value,
  label,
  icon: Icon,
  gradientClass,
  iconBg,
  iconColor,
}: {
  value: number
  label: string
  icon: React.ElementType
  gradientClass: string
  iconBg: string
  iconColor: string
}) {
  const { count, ref } = useAnimatedCounter(value)
  return (
    <Card className={`border-t-2 ${gradientClass} hover:scale-[1.02] transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-4">
        <div ref={ref} className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1 animate-count-up">{count}</p>
          </div>
          <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function StaffPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // List state
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchStaff = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ storeId: currentStore.id })
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)

      const res = await fetch(`/api/staff?${params}`)
      if (!res.ok) throw new Error('Failed to fetch staff')
      const data = await res.json()
      setStaff(data.staff || [])
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch staff members', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, search, statusFilter, toast])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  // Summary stats
  const totalStaff = staff.length
  const activeMembers = staff.filter((s) => s.status === 'active').length
  const adminCount = staff.filter((s) => s.role === 'admin').length
  const pendingInvites = staff.filter((s) => s.status === 'invited').length

  const handleInvite = () => {
    setEditingStaff(null)
    setForm({ ...emptyForm, permissions: { ...roleDefaults.staff } })
    setShowFormDialog(true)
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setForm({
      email: member.email,
      name: member.name,
      role: member.role,
      status: member.status,
      permissions: parsePermissions(member.permissions),
    })
    setShowFormDialog(true)
  }

  const handleRoleChange = (role: string) => {
    setForm({
      ...form,
      role,
      permissions: { ...roleDefaults[role] },
    })
  }

  const handlePermissionChange = (key: keyof Permissions, checked: boolean) => {
    setForm({
      ...form,
      permissions: { ...form.permissions, [key]: checked },
    })
  }

  const handleSave = async () => {
    if (!currentStore?.id) return
    if (!form.email.trim() || !form.name.trim()) {
      toast({ title: 'Error', description: 'Email and name are required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingStaff) {
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            role: form.role,
            status: form.status,
            permissions: form.permissions,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to update staff member')
        }
        toast({ title: 'Success', description: 'Staff member updated successfully' })
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: currentStore.id,
            email: form.email,
            name: form.name,
            role: form.role,
            permissions: form.permissions,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to invite staff member')
        }
        toast({ title: 'Success', description: 'Invitation sent successfully' })
      }

      setShowFormDialog(false)
      fetchStaff()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (member: StaffMember, newStatus: string) => {
    try {
      const res = await fetch(`/api/staff/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast({
        title: 'Success',
        description: `${member.name} is now ${newStatus}`,
      })
      fetchStaff()
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/staff/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove staff member')
      }
      toast({ title: 'Success', description: 'Staff member removed successfully' })
      fetchStaff()
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to remove staff member', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // ========== LOADING STATE ==========
  if (loading && staff.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
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
              Staff
              {totalStaff > 0 && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  ({totalStaff})
                </span>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">Manage team members and their permissions</p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 hover:scale-[1.02]"
            onClick={handleInvite}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <AnimatedStatCard
            value={totalStaff}
            label="Total Staff"
            icon={Users}
            gradientClass="border-t-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <AnimatedStatCard
            value={activeMembers}
            label="Active Members"
            icon={UserCheck}
            gradientClass="border-t-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <AnimatedStatCard
            value={adminCount}
            label="Admins"
            icon={ShieldCheck}
            gradientClass="border-t-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-900/30"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <AnimatedStatCard
            value={pendingInvites}
            label="Pending Invites"
            icon={Mail}
            gradientClass="border-t-rose-500"
            iconBg="bg-rose-50 dark:bg-rose-900/30"
            iconColor="text-rose-600 dark:text-rose-400"
          />
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
                All <span className="text-xs text-muted-foreground ml-1">{totalStaff}</span>
              </TabsTrigger>
              <TabsTrigger value="active" className="gap-1">
                Active <span className="text-xs text-muted-foreground ml-1">{activeMembers}</span>
              </TabsTrigger>
              <TabsTrigger value="invited" className="gap-1">
                Invited <span className="text-xs text-muted-foreground ml-1">{pendingInvites}</span>
              </TabsTrigger>
              <TabsTrigger value="disabled" className="gap-1">
                Disabled <span className="text-xs text-muted-foreground ml-1">{staff.filter(s => s.status === 'disabled').length}</span>
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
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </motion.div>

      {/* Staff List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {staff.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium">No team members yet</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Invite your first team member to start collaborating'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleInvite}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {staff.map((member) => {
                const perms = parsePermissions(member.permissions)
                const truePermCount = Object.values(perms).filter(Boolean).length
                const totalPermCount = Object.keys(perms).length

                return (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="hover-lift transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          {/* Avatar & Info */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarFallback className={`text-sm font-medium ${
                                member.role === 'admin' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' :
                                member.role === 'manager' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                member.role === 'viewer' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                                'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                              }`}>
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground truncate">{member.name}</span>
                                <Badge className={`${getRoleBadgeClasses(member.role)} text-[10px] px-1.5 py-0 h-5 font-medium`} variant="outline">
                                  <span className="flex items-center gap-1">
                                    {getRoleIcon(member.role)}
                                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                  </span>
                                </Badge>
                                <Badge className={`${getStatusBadgeClasses(member.status)} text-[10px] px-1.5 py-0 h-5`} variant="outline">
                                  <span className="flex items-center gap-1">
                                    {getStatusIcon(member.status)}
                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                  </span>
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="truncate">{member.email}</span>
                              </div>
                            </div>
                          </div>

                          {/* Last Active & Permissions Summary */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                            <div className="hidden md:flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatRelativeDate(member.lastActiveAt)}</span>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1.5 cursor-help">
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>{truePermCount}/{totalPermCount}</span>
                                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${(truePermCount / totalPermCount) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-xs">
                                <div className="text-xs space-y-1.5">
                                  <p className="font-medium mb-1.5">Permissions</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {permissionGroups.map((pg) => {
                                      const permColors: Record<string, string> = {
                                        products: 'bg-emerald-400',
                                        orders: 'bg-blue-400',
                                        customers: 'bg-violet-400',
                                        analytics: 'bg-amber-400',
                                        discounts: 'bg-rose-400',
                                        settings: 'bg-slate-400',
                                        reviews: 'bg-teal-400',
                                        inventory: 'bg-orange-400',
                                        shipping: 'bg-cyan-400',
                                        taxRates: 'bg-pink-400',
                                        abandonedCarts: 'bg-yellow-400',
                                        pages: 'bg-indigo-400',
                                        collections: 'bg-lime-400',
                                      }
                                      return (
                                        <div
                                          key={pg.key}
                                          className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                                            perms[pg.key]
                                              ? permColors[pg.key] || 'bg-emerald-400'
                                              : 'bg-gray-200 dark:bg-gray-700'
                                          }`}
                                          title={`${pg.label}: ${perms[pg.key] ? 'Enabled' : 'Disabled'}`}
                                        />
                                      )
                                    })}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1">
                                    {Object.values(perms).filter(Boolean).length} of {Object.keys(perms).length} enabled
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(member)}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                {member.status === 'invited' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(member, 'active')}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {member.status === 'active' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(member, 'disabled')}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Disable
                                  </DropdownMenuItem>
                                )}
                                {member.status === 'disabled' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(member, 'active')}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Re-enable
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteId(member.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Invite / Edit Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Edit Staff Member' : 'Invite Team Member'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update role, permissions, and status' : 'Send an invitation to a new team member'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Email & Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Full Name *</Label>
                <Input
                  id="staff-name"
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="manager">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Manager
                    </span>
                  </SelectItem>
                  <SelectItem value="staff">
                    <span className="flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-violet-600" />
                      Staff
                    </span>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-600" />
                      Viewer
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mt-2">
                <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {roleDescriptions[form.role]}
                </p>
              </div>
            </div>

            {/* Status Toggle (only for edit) */}
            {editingStaff && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Account Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {form.status === 'active' ? 'This member can access the store' :
                       form.status === 'invited' ? 'Invitation has been sent but not yet accepted' :
                       'This member\'s access has been disabled'}
                    </p>
                  </div>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Separator />

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label className="text-base">Permissions</Label>
                  <p className="text-sm text-muted-foreground">Control what this team member can access</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Object.values(form.permissions).filter(Boolean).length} / {Object.keys(form.permissions).length} enabled
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionGroups.map((pg) => (
                  <div
                    key={pg.key}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      form.permissions[pg.key]
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    <Checkbox
                      id={`perm-${pg.key}`}
                      checked={form.permissions[pg.key]}
                      onCheckedChange={(checked) => handlePermissionChange(pg.key, !!checked)}
                      className={form.permissions[pg.key] ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' : ''}
                    />
                    <label htmlFor={`perm-${pg.key}`} className="flex-1 cursor-pointer">
                      <span className="text-sm font-medium">{pg.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{pg.description}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFormDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSave}
              disabled={saving || !form.email.trim() || !form.name.trim()}
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2 inline-block" />
                  {editingStaff ? 'Saving...' : 'Inviting...'}
                </>
              ) : (
                <>
                  {editingStaff ? 'Update Member' : 'Send Invitation'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove Team Member
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? They will lose access to the store immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
