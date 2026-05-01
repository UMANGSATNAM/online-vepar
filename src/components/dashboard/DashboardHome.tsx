'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'text-emerald-600',
    unpaid: 'text-yellow-600',
    partially_refunded: 'text-orange-600',
    refunded: 'text-red-600',
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

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

// --- Skeletons ---
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-28 mb-2" />
            <Skeleton className="h-3 w-36" />
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

  useEffect(() => {
    fetchData()
  }, [currentStore?.id])

  const firstName = currentUser?.name?.split(' ')[0] || 'Merchant'
  const storeName = currentStore?.name || 'your store'

  // Stats card config
  const statsCards = data
    ? [
        {
          title: 'Total Revenue',
          value: formatCurrency(data.stats.totalRevenue),
          sub: data.stats.pendingOrders > 0 ? `${data.stats.pendingOrders} pending orders` : 'All caught up',
          icon: DollarSign,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          iconRing: 'ring-emerald-600/20',
        },
        {
          title: 'Total Orders',
          value: data.stats.totalOrders.toLocaleString('en-IN'),
          sub: data.stats.unfulfilledOrders > 0 ? `${data.stats.unfulfilledOrders} unfulfilled` : 'All fulfilled',
          icon: ShoppingCart,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          iconRing: 'ring-orange-600/20',
        },
        {
          title: 'Total Customers',
          value: data.stats.totalCustomers.toLocaleString('en-IN'),
          sub: 'Customer base',
          icon: Users,
          color: 'text-violet-600',
          bg: 'bg-violet-50',
          iconRing: 'ring-violet-600/20',
        },
        {
          title: 'Active Products',
          value: data.stats.activeProducts.toLocaleString('en-IN'),
          sub: `${data.stats.totalProducts - data.stats.activeProducts} inactive`,
          icon: Package,
          color: 'text-sky-600',
          bg: 'bg-sky-50',
          iconRing: 'ring-sky-600/20',
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

  // Activity timeline (derived from recent data)
  const activities = data
    ? [
        ...(data.stats.pendingOrders > 0
          ? [{ icon: Clock, text: `${data.stats.pendingOrders} pending order(s) awaiting confirmation`, color: 'text-yellow-600 bg-yellow-50', time: 'Action needed' }]
          : []),
        ...(data.stats.unfulfilledOrders > 0
          ? [{ icon: AlertCircle, text: `${data.stats.unfulfilledOrders} order(s) need fulfillment`, color: 'text-orange-600 bg-orange-50', time: 'Action needed' }]
          : []),
        ...(data.recentOrders.length > 0
          ? [{ icon: CheckCircle2, text: `Latest order: ${data.recentOrders[0].orderNumber} from ${data.recentOrders[0].customerName}`, color: 'text-emerald-600 bg-emerald-50', time: formatDate(data.recentOrders[0].createdAt) }]
          : []),
        ...(data.topProducts.length > 0
          ? [{ icon: TrendingUp, text: `Top seller: ${data.topProducts[0].name}`, color: 'text-violet-600 bg-violet-50', time: 'This period' }]
          : []),
        ...(data.stats.totalRevenue > 0
          ? [{ icon: DollarSign, text: `Revenue: ${formatCurrency(data.stats.totalRevenue)} total`, color: 'text-emerald-600 bg-emerald-50', time: 'Lifetime' }]
          : []),
      ].slice(0, 5)
    : []

  // Top products sorted by revenue, max 5
  const topProducts = (data?.topProducts || [])
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
    .slice(0, 5)
  const maxRevenue = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.totalRevenue || 0)) : 1

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants}>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">Failed to load dashboard</p>
                  <p className="text-xs text-red-600">{error}</p>
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Here&apos;s what&apos;s happening with <span className="font-medium text-foreground">{storeName}</span> today.
            </p>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">{getTodayDate()}</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <motion.div key={stat.title} variants={itemVariants}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center ring-1 ${stat.iconRing}`}>
                    <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {stat.sub}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks to manage your store</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left group"
                  onClick={() => setView(action.view)}
                >
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                    <action.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block">{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.desc}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders - 3 columns */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-orange-600" />
                    </div>
                    Recent Orders
                  </CardTitle>
                  <CardDescription>Latest orders from your store</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                  onClick={() => setView('orders')}
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton />
              ) : !data?.recentOrders.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentOrders.slice(0, 5).map((order) => (
                      <TableRow key={order.id} className="cursor-pointer" onClick={() => setView('orders')}>
                        <TableCell className="font-medium text-xs">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                            {order.customerEmail && (
                              <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus.replace('_', ' ')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {data && data.recentOrders.length > 5 && (
              <CardFooter className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setView('orders')}
                >
                  View All Orders <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>

        {/* Right column: Top Products + Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Products */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-violet-600" />
                  </div>
                  Top Products
                </CardTitle>
                <CardDescription>By revenue this period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : topProducts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No product sales yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, idx) => (
                      <div key={product.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                            <span className="text-sm font-medium truncate">{product.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground shrink-0 ml-2">
                            {formatCurrency(product.totalRevenue || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <Progress
                            value={maxRevenue > 0 ? ((product.totalRevenue || 0) / maxRevenue) * 100 : 0}
                            className="h-1.5"
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-sky-600" />
                  </div>
                  Activity
                </CardTitle>
                <CardDescription>Recent activity & alerts</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3 w-20 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activities.map((activity, idx) => (
                      <div key={idx}>
                        <div className="flex items-start gap-3 py-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${activity.color}`}>
                            <activity.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-foreground leading-snug">{activity.text}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{activity.time}</p>
                          </div>
                        </div>
                        {idx < activities.length - 1 && <Separator />}
                      </div>
                    ))}
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
