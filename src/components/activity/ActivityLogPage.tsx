'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  Search,
  Download,
  Package,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'

interface ActivityLogEntry {
  id: string
  storeId: string
  userId: string | null
  userName: string | null
  action: string
  entity: string
  entityId: string | null
  entityName: string | null
  details: string | null
  createdAt: string
}

interface ActivitySummary {
  total: number
  products: number
  orders: number
  customers: number
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getActionVerb(action: string): string {
  if (action.includes('created')) return 'created'
  if (action.includes('updated')) return 'updated'
  if (action.includes('deleted')) return 'deleted'
  if (action.includes('status_updated')) return 'changed status of'
  if (action.includes('fulfillment_updated')) return 'updated fulfillment of'
  if (action.includes('activated')) return 'activated'
  if (action.includes('deactivated')) return 'deactivated'
  return action.split('.').pop() || action
}

function getActionIcon(action: string) {
  if (action.includes('created')) return Plus
  if (action.includes('updated') || action.includes('fulfillment')) return Pencil
  if (action.includes('deleted')) return Trash2
  if (action.includes('status') || action.includes('activated') || action.includes('deactivated')) return ArrowRight
  return Zap
}

function getEntityColor(entity: string): string {
  switch (entity) {
    case 'product': return 'emerald'
    case 'order': return 'blue'
    case 'customer': return 'violet'
    case 'discount': return 'amber'
    case 'inventory': return 'pink'
    case 'settings': return 'gray'
    default: return 'emerald'
  }
}

function getEntityIcon(entity: string) {
  switch (entity) {
    case 'product': return Package
    case 'order': return ShoppingCart
    case 'customer': return Users
    case 'discount': return Tag
    case 'settings': return Settings
    default: return Zap
  }
}

export default function ActivityLogPage() {
  const { currentStore, setView, setSelectedProductId, setSelectedOrderId, setSelectedCustomerId } = useAppStore()
  const storeId = currentStore?.id

  const [logs, setLogs] = useState<ActivityLogEntry[]>([])
  const [summary, setSummary] = useState<ActivitySummary>({ total: 0, products: 0, orders: 0, customers: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    if (!storeId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        storeId,
        page: String(page),
        limit: '20',
        dateRange,
      })
      if (search) params.set('search', search)
      if (entityFilter && entityFilter !== 'all') params.set('entity', entityFilter)

      const res = await fetch(`/api/activity-logs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setSummary(data.summary || { total: 0, products: 0, orders: 0, customers: 0 })
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
    } finally {
      setLoading(false)
    }
  }, [storeId, page, search, entityFilter, dateRange])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleExport = () => {
    if (!storeId) return
    const params = new URLSearchParams({ storeId, type: 'activity' })
    window.open(`/api/export?${params}`)
  }

  const handleLogClick = (log: ActivityLogEntry) => {
    if (log.entity === 'product' && log.entityId) {
      setSelectedProductId(log.entityId)
      setView('products')
    } else if (log.entity === 'order' && log.entityId) {
      setSelectedOrderId(log.entityId)
      setView('orders')
    } else if (log.entity === 'customer' && log.entityId) {
      setSelectedCustomerId(log.entityId)
      setView('customers')
    } else if (log.entity === 'discount') {
      setView('discounts')
    }
  }

  const summaryCards = [
    { label: 'Total Activities', value: summary.total, icon: Zap, color: 'emerald' },
    { label: 'Products', value: summary.products, icon: Package, color: 'emerald' },
    { label: 'Orders', value: summary.orders, icon: ShoppingCart, color: 'blue' },
    { label: 'Customers', value: summary.customers, icon: Users, color: 'violet' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
            <p className="text-sm text-muted-foreground">Track all actions across your store</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Card className={`border-t-2 card-premium hover-lift cursor-default ${
              card.color === 'emerald' ? 'border-t-gradient-emerald stat-glow' :
              card.color === 'blue' ? 'border-t-gradient-blue stat-glow-blue' :
              'border-t-gradient-violet stat-glow-violet'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{card.label} <span className="text-[10px]">(7d)</span></p>
                    <p className="text-2xl font-bold mt-1">{loading ? '—' : card.value}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    card.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                    card.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                  }`}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <Card className="card-premium">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[180px] h-9">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="discount">Discounts</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <div className="relative">
        {loading ? (
          // Loading skeletons
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border animate-pulse">
                <div className="w-3 h-3 rounded-full bg-muted mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          // Empty state
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-sm mx-auto rounded-xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/50 p-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-emerald-600 dark:text-emerald-400 empty-state-icon" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground">Actions like creating products, updating orders, and managing discounts will appear here.</p>
            </div>
          </motion.div>
        ) : (
          // Timeline list
          <div className="relative pl-6">
            {/* Vertical line with gradient */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 timeline-line-gradient" />

            <AnimatePresence mode="popLayout">
              {logs.map((log, idx) => {
                const color = getEntityColor(log.entity)
                const ActionIcon = getActionIcon(log.action)
                const EntityIcon = getEntityIcon(log.entity)
                const verb = getActionVerb(log.action)

                const dotColorClasses = {
                  emerald: 'bg-emerald-500',
                  blue: 'bg-blue-500',
                  violet: 'bg-violet-500',
                  amber: 'bg-amber-500',
                  pink: 'bg-pink-500',
                  gray: 'bg-gray-500',
                }[color] || 'bg-emerald-500'

                const iconBgClasses = {
                  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
                  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                  violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
                  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                  pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
                  gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
                }[color] || 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'

                const badgeClasses = {
                  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                  violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
                  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                  pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
                  gray: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
                }[color] || 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="relative flex items-start gap-4 pb-4 group animate-row-appear"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                  >
                    {/* Color-coded dot on the timeline */}
                    <div className={`absolute left-[-20px] top-2.5 w-3 h-3 rounded-full ${dotColorClasses} ring-2 ring-background z-10`} />

                    {/* Action icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClasses}`}>
                      <ActionIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Content */}
                    <button
                      className="flex-1 text-left timeline-item-hover hover-lift rounded-lg p-2 -m-2 cursor-pointer"
                      onClick={() => handleLogClick(log)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{log.userName || 'System'}</span>
                            {' '}
                            <span className="text-muted-foreground">{verb}</span>
                            {' '}
                            <span className="font-medium">{log.entityName || log.entity}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-medium ${badgeClasses}`}>
                              <EntityIcon className="w-2.5 h-2.5 mr-0.5" />
                              {log.entity}
                            </Badge>
                            {log.details && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {(() => {
                                  try {
                                    const d = JSON.parse(log.details)
                                    return Object.entries(d).map(([k, v]) => `${k}: ${String(v)}`).join(', ')
                                  } catch {
                                    return log.details
                                  }
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {getRelativeTime(log.createdAt)}
                        </span>
                      </div>
                    </button>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of {total} activities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 text-emerald-600 dark:text-emerald-400">
              {page} <span className="text-muted-foreground">/</span> {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
