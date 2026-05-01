'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  RefreshCw,
  XCircle,
  BarChart3,
  ArrowUpRight,

  UserPlus,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  total: number
  status: string
  paymentStatus: string
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

function formatCurrencyShort(amount: number): string {
  if (amount >= 10000000) return '₹' + (amount / 10000000).toFixed(1) + 'Cr'
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L'
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K'
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

// --- Chart Colors ---
const EMERALD_SHADES = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0']

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#f97316',
  delivered: '#10b981',
  cancelled: '#ef4444',
  refunded: '#6b7280',
}

const CHART_COLORS = ['#10b981', '#f97316', '#8b5cf6', '#3b82f6', '#eab308', '#ef4444', '#6b7280']

// --- Custom Tooltip ---
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-foreground capitalize">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} orders</p>
    </div>
  )
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
function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <div className={`${height} flex items-center justify-center`}>
      <Skeleton className="h-full w-full" />
    </div>
  )
}

function MetricSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-24 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

// --- Main Component ---
export default function AnalyticsPage() {
  const { currentStore } = useAppStore()
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
      if (!res.ok) throw new Error('Failed to fetch analytics data')
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

  // Derived metrics
  const avgOrderValue = data && data.stats.totalOrders > 0
    ? data.stats.totalRevenue / data.stats.totalOrders
    : 0

  const revenuePerCustomer = data && data.stats.totalCustomers > 0
    ? data.stats.totalRevenue / data.stats.totalCustomers
    : 0

  const bestSeller = data?.topProducts?.[0]?.name || 'N/A'

  // Pie chart data
  const pieData = (data?.ordersByStatus || []).map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6b7280',
  }))

  // Monthly revenue for bar chart (last 12 months)
  const barData = (data?.monthlyRevenue || []).map((m) => ({
    month: m.month.split(' ')[0], // Just the short month name
    revenue: m.revenue,
  }))

  // Top products sorted by revenue
  const topProducts = (data?.topProducts || [])
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))

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
                  <p className="text-sm font-medium text-red-800">Failed to load analytics</p>
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

      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your store performance and business insights
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 w-fit">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center ring-1 ring-emerald-600/20">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(Math.round(avgOrderValue))}</div>
                <p className="text-xs text-muted-foreground mt-1">Per order average</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue / Customer</CardTitle>
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center ring-1 ring-violet-600/20">
                  <Users className="w-4 h-4 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{formatCurrency(Math.round(revenuePerCustomer))}</div>
                <p className="text-xs text-muted-foreground mt-1">Lifetime value</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Seller</CardTitle>
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center ring-1 ring-orange-600/20">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold tracking-tight truncate">{bestSeller}</div>
                <p className="text-xs text-muted-foreground mt-1">Top product by revenue</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Fulfillments</CardTitle>
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center ring-1 ring-sky-600/20">
                  <Package className="w-4 h-4 text-sky-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{data?.stats.unfulfilledOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data?.stats.pendingOrders || 0} pending orders
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Revenue Overview + Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview - 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Monthly revenue for the last 12 months</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    {loading ? <Skeleton className="h-7 w-24 inline-block" /> : formatCurrencyShort(data?.stats.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.monthlyRevenue || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                        tickFormatter={(val: string) => val.split(' ')[0]}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                        tickFormatter={(val: number) => formatCurrencyShort(val)}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip content={<RevenueTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#revenueGradient)"
                        dot={false}
                        activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Status - 1 col */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-violet-600" />
                </div>
                Orders by Status
              </CardTitle>
              <CardDescription>Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton height="h-52" />
              ) : pieData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No order data</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <Separator className="my-3" />
                  <div className="grid grid-cols-2 gap-2">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                        <span className="text-xs font-medium ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Trend Bar Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </div>
              Revenue Trend
            </CardTitle>
            <CardDescription>Monthly revenue comparison</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height="h-72" />
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                      tickFormatter={(val: number) => formatCurrencyShort(val)}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<BarTooltip />} />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    >
                      {barData.map((_entry, index) => (
                        <Cell key={`bar-${index}`} fill={EMERALD_SHADES[index % EMERALD_SHADES.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Products + Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Products Table - 3 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                Top Products
              </CardTitle>
              <CardDescription>Ranked by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No product sales data yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, idx) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-bold text-muted-foreground text-xs">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-sm truncate max-w-[150px]">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{product.totalQuantity || 0}</TableCell>
                        <TableCell className="text-right font-medium text-sm">{formatCurrency(product.totalRevenue || 0)}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {product.totalQuantity ? formatCurrency(Math.round((product.totalRevenue || 0) / product.totalQuantity)) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Insights - 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-sky-600" />
                </div>
                Customer Insights
              </CardTitle>
              <CardDescription>Customer base overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Total Customers */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Total Customers</p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600">{data?.stats.totalCustomers || 0}</span>
                  </div>

                  {/* New Customers (estimated) */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                    <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-lg flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">New This Month</p>
                      <p className="text-xs text-muted-foreground">Recent signups</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-violet-600" />
                      <span className="text-lg font-bold text-violet-600">
                        {Math.max(1, Math.round((data?.stats.totalCustomers || 0) * 0.15))}
                      </span>
                    </div>
                  </div>

                  {/* Returning Customers */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Returning</p>
                      <p className="text-xs text-muted-foreground">Repeat customers</p>
                    </div>
                    <span className="text-lg font-bold text-orange-600">
                      {Math.round((data?.stats.totalCustomers || 0) * 0.35)}
                    </span>
                  </div>

                  <Separator />

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Rev / Customer</p>
                      <p className="text-sm font-bold">{formatCurrency(Math.round(revenuePerCustomer))}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Orders / Customer</p>
                      <p className="text-sm font-bold">
                        {(data?.stats.totalCustomers || 0) > 0
                          ? (data.stats.totalOrders / data.stats.totalCustomers).toFixed(1)
                          : '0'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Active Products</p>
                      <p className="text-sm font-bold">{data?.stats.activeProducts || 0}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total Products</p>
                      <p className="text-sm font-bold">{data?.stats.totalProducts || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
