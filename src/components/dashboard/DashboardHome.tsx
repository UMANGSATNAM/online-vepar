'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sun,
  Moon,
  Coffee,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'

// --- Types ---
interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  activeProducts: number
  totalCustomers: number
  pendingOrders: number
  unfulfilledOrders: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string | null
  total: number
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  createdAt: string
}

interface TopProduct {
  id: string
  name: string
  images: string
  price: number
  totalQuantity: number | null
  totalRevenue: number | null
}

interface DashboardData {
  stats: DashboardStats
  recentOrders: RecentOrder[]
  ordersByStatus: { status: string; count: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
  topProducts: TopProduct[]
}

// --- Helpers ---
function formatCurrency(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    processing: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    shipped: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    cancelled: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    refunded: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'text-emerald-600 dark:text-emerald-400',
    unpaid: 'text-yellow-600 dark:text-yellow-400',
    partially_refunded: 'text-orange-600 dark:text-orange-400',
    refunded: 'text-red-600 dark:text-red-400',
  }
  return colors[status] || 'text-muted-foreground'
}

function getTodayDate(): string {
  const d = new Date()
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTimeGreeting(): { greeting: string; icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { greeting: 'Good Morning', icon: Sun }
  if (hour < 17) return { greeting: 'Good Afternoon', icon: Coffee }
  return { greeting: 'Good Evening', icon: Moon }
}

// --- Animated counter hook ---
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (isInView && !hasStarted.current) {
      hasStarted.current = true
      const startTime = Date.now()
      const step = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * target))
        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    }
  }, [isInView, target, duration])

  return { count, ref }
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// --- Skeletons ---
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <Skeleton className="h-7 w-24 mb-1.5" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// --- Main Component ---
export default function DashboardHome() {
  const { currentStore, currentUser, setView } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard?storeId=${currentStore.id}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const [mounted, setMounted] = useState(false)
  const [greetingInfo, setGreetingInfo] = useState<{greeting: string, icon: typeof Sun}>({ greeting: 'Welcome', icon: Sun })
  const [todayDate, setTodayDate] = useState('')

  useEffect(() => {
    setMounted(true)
    setGreetingInfo(getTimeGreeting())
    setTodayDate(getTodayDate())
    fetchData()
  }, [currentStore?.id])

  const firstName = currentUser?.name?.split(' ')[0] || 'Merchant'
  const storeName = currentStore?.name || 'your store'
  const { greeting, icon: GreetingIcon } = greetingInfo

  // Stats card config
  const statsCards = data
    ? [
        {
          title: 'Total Revenue',
          value: data.stats.totalRevenue,
          formatted: formatCurrency(data.stats.totalRevenue),
          sub: data.stats.pendingOrders > 0 ? `${data.stats.pendingOrders} pending orders` : 'All caught up',
          icon: DollarSign,
          color: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-900/30',
          borderColor: 'border-t-emerald-500',
        },
        {
          title: 'Total Orders',
          value: data.stats.totalOrders,
          formatted: data.stats.totalOrders.toLocaleString('en-IN'),
          sub: data.stats.unfulfilledOrders > 0 ? `${data.stats.unfulfilledOrders} unfulfilled` : 'All fulfilled',
          icon: ShoppingCart,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/30',
          borderColor: 'border-t-orange-500',
        },
        {
          title: 'Total Customers',
          value: data.stats.totalCustomers,
          formatted: data.stats.totalCustomers.toLocaleString('en-IN'),
          sub: 'Customer base',
          icon: Users,
          color: 'text-violet-600 dark:text-violet-400',
          bg: 'bg-violet-50 dark:bg-violet-900/30',
          borderColor: 'border-t-violet-500',
        },
        {
          title: 'Active Products',
          value: data.stats.activeProducts,
          formatted: data.stats.activeProducts.toLocaleString('en-IN'),
          sub: `${data.stats.totalProducts - data.stats.activeProducts} inactive`,
          icon: Package,
          color: 'text-sky-600 dark:text-sky-400',
          bg: 'bg-sky-50 dark:bg-sky-900/30',
          borderColor: 'border-t-sky-500',
        },
      ]
    : []

  // Quick actions
  const quickActions = [
    { label: 'Add Product', icon: Plus, view: 'products' as const, desc: 'Create a new product listing' },
    { label: 'View Orders', icon: ShoppingCart, view: 'orders' as const, desc: 'Manage customer orders' },
    { label: 'Manage Store', icon: Settings, view: 'store-settings' as const, desc: 'Update store settings' },
    { label: 'View Analytics', icon: BarChart3, view: 'analytics' as const, desc: 'Track performance' },
  ]

  // Activity timeline (derived from real data)
  const activities = data
    ? [
        ...(data.stats.pendingOrders > 0
          ? [{ icon: Clock, text: `${data.stats.pendingOrders} pending order(s) awaiting confirmation`, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30', dotColor: 'bg-yellow-500', time: 'Action needed', view: 'orders' as const }]
          : []),
        ...(data.stats.unfulfilledOrders > 0
          ? [{ icon: AlertCircle, text: `${data.stats.unfulfilledOrders} order(s) need fulfillment`, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30', dotColor: 'bg-orange-500', time: 'Action needed', view: 'orders' as const }]
          : []),
        ...(data.recentOrders.length > 0
          ? [{ icon: CheckCircle2, text: `Latest order: ${data.recentOrders[0].orderNumber} from ${data.recentOrders[0].customerName}`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', dotColor: 'bg-emerald-500', time: formatDate(data.recentOrders[0].createdAt), view: 'orders' as const }]
          : []),
        ...(data.topProducts.length > 0
          ? [{ icon: TrendingUp, text: `Top seller: ${data.topProducts[0].name}`, color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30', dotColor: 'bg-violet-500', time: 'This period', view: 'products' as const }]
          : []),
        ...(data.stats.totalRevenue > 0
          ? [{ icon: DollarSign, text: `Revenue: ${formatCurrency(data.stats.totalRevenue)} total`, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30', dotColor: 'bg-emerald-500', time: 'Lifetime', view: 'analytics' as const }]
          : []),
      ].slice(0, 5)
    : []

  // Top products sorted by revenue, max 5
  const topProducts = (data?.topProducts || [])
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 5)
  const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.totalRevenue || 0)) : 1

  // Rank badge colors
  const rankBadgeColors = [
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800',
  ]

  // Today's highlights - real data from API
  const highlights = data ? [
    { icon: ShoppingCart, label: 'Pending Orders', value: data.stats.pendingOrders, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', view: 'orders' as const },
    { icon: Truck, label: 'Unfulfilled', value: data.stats.unfulfilledOrders, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', view: 'orders' as const },
    { icon: AlertTriangle, label: 'Inactive Products', value: Math.max(0, data.stats.totalProducts - data.stats.activeProducts), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', view: 'products' as const },
  ] : []

  return (
    <motion.div
      className="space-y-5 pb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/30">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load dashboard</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
              <GreetingIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                {greeting}, {firstName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with <span className="font-medium text-foreground/80">{storeName}</span>
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {mounted ? todayDate : ''}
          </p>
        </div>
      </motion.div>

      {/* Today's Highlights */}
      {!loading && data && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {highlights.map((h) => (
              <button
                key={h.label}
                className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border border-border/60 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 hover:shadow-sm group text-left"
                onClick={() => setView(h.view)}
              >
                <div className={`w-8 h-8 sm:w-9 sm:h-9 ${h.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <h.icon className={`w-4 h-4 ${h.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{h.label}</p>
                  <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{h.value}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statsCards.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-4 sm:p-5 pb-0">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-3">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((action, idx) => {
                const borderColors = ['border-l-emerald-500', 'border-l-orange-500', 'border-l-violet-500', 'border-l-sky-500']
                return (
                  <button
                    key={action.label}
                    className={`flex items-center gap-2.5 p-3 sm:p-3.5 rounded-lg border border-border/60 border-l-[3px] ${borderColors[idx] || 'border-l-emerald-500'} hover:bg-accent/50 transition-all text-left group`}
                    onClick={() => setView(action.view)}
                  >
                    <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center shrink-0">
                      <action.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-foreground block">{action.label}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{action.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Orders + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
        {/* Recent Orders - 3 columns */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card>
            <CardHeader className="p-4 sm:p-5 pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-7 h-7 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Recent Orders
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-1 h-7"
                  onClick={() => setView('orders')}
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-3">
              {loading ? (
                <TableSkeleton />
              ) : !data?.recentOrders.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">No orders yet</p>
                  <p className="text-xs mt-1 text-muted-foreground/70">Orders will appear here when customers place them</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Order</TableHead>
                      <TableHead className="text-xs">Customer</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                      <TableHead className="text-xs text-right">Total</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.slice(0, 5).map((order, idx) => (
                      <TableRow
                        key={order.id}
                        className={`cursor-pointer hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}
                        onClick={() => setView('orders')}
                      >
                        <TableCell className="font-medium text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap py-2.5">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div>
                            <p className="text-xs font-medium">{order.customerName}</p>
                            {order.customerEmail && (
                              <p className="text-[10px] text-muted-foreground hidden sm:block">{order.customerEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell py-2.5">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right font-medium text-xs whitespace-nowrap py-2.5">{formatCurrency(order.total)}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2.5">
                          <span className={`text-xs font-medium capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus.replace('_', ' ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
            {data && data.recentOrders.length > 0 && (
              <CardFooter className="border-t border-border/40 p-3 sm:p-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 gap-1.5 h-8"
                  onClick={() => setView('orders')}
                >
                  View All Orders <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>

        {/* Right column: Top Products + Activity */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Top Products */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="p-4 sm:p-5 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-7 h-7 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Top Products
                </CardTitle>
                <CardDescription className="text-xs">By revenue this period</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))}
                  </div>
                ) : topProducts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No product sales yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, idx) => (
                      <div key={product.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge
                              variant="outline"
                              className={`text-[10px] w-5 h-5 p-0 flex items-center justify-center rounded-full font-bold shrink-0 ${idx < 3 ? rankBadgeColors[idx] : 'bg-muted text-muted-foreground border-muted'}`}
                            >
                              {idx + 1}
                            </Badge>
                            <span className="text-xs sm:text-sm font-medium truncate">{product.name}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-foreground shrink-0">
                            {formatCurrency(product.totalRevenue || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-7">
                          <Progress
                            value={maxRevenue > 0 ? ((product.totalRevenue || 0) / maxRevenue) * 100 : 0}
                            className="h-1"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {product.totalQuantity || 0} sold
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="p-4 sm:p-5 pb-0">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="w-7 h-7 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-3">
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-2.5 w-16 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="relative pl-5">
                    {/* Vertical timeline line */}
                    <div className="absolute left-[9px] top-1.5 bottom-1.5 w-px bg-border" />
                    <div className="space-y-0.5">
                      {activities.map((activity, idx) => (
                        <div key={idx} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-5 top-3 w-2 h-2 rounded-full ${activity.dotColor} ring-2 ring-background z-10`} />
                          <button
                            className="flex items-start gap-3 py-1.5 pl-1 w-full text-left rounded-md hover:bg-accent/50 transition-colors group"
                            onClick={() => setView(activity.view)}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-foreground leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{activity.text}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/40 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// --- Stat Card with animated counter ---
function StatCard({ stat }: { stat: {
  title: string
  value: number
  formatted: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bg: string
  borderColor: string
} }) {
  const { count, ref } = useAnimatedCounter(stat.value)
  const isRevenue = stat.title === 'Total Revenue'

  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-t-2 ${stat.borderColor} relative overflow-hidden`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-5 pb-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            {stat.title}
          </CardTitle>
          <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
        </CardHeader>
        <CardContent ref={ref} className="p-4 sm:p-5 pt-1.5">
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isRevenue ? formatCurrency(count) : count.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            {stat.sub}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}
