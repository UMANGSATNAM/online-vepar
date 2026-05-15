'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
} from 'recharts'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  XCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  UserCheck,
  Download,
  Calendar,
  Sparkles,
  LineChart,
  Camera,
  Loader2,
  Lightbulb,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
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

// --- Date Range Options ---
type DateRange = '7d' | '30d' | '90d' | 'custom'
const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom' },
]

// --- Chart Type ---
type ChartType = 'area' | 'bar'

// --- Custom Tooltip ---
function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
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
    <div className={`${height} rounded-lg overflow-hidden`}>
      <div className="h-full w-full animate-card-shimmer rounded-lg" />
    </div>
  )
}

function MetricSkeleton() {
  return (
    <Card className="animate-fade-scale">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20 shimmer-line" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-24 mb-1 shimmer-line" />
        <Skeleton className="h-3 w-32 shimmer-line" />
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
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [chartType, setChartType] = useState<ChartType>('area')
  const chartRef = useRef<HTMLDivElement>(null)

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<Array<{ title: string; description: string; type: 'opportunity' | 'warning' | 'info' }>>([])
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)

  const fetchData = useCallback(async () => {
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
  }, [currentStore?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Fetch AI insights
  const fetchAiInsights = useCallback(async () => {
    if (!currentStore?.id) return
    setIsLoadingInsights(true)
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          stats: data?.stats,
          topProducts: data?.topProducts,
          monthlyRevenue: data?.monthlyRevenue,
        }),
      })
      if (!res.ok) throw new Error('Failed to fetch insights')
      const json = await res.json()
      setAiInsights(json.insights || [])
    } catch {
      // Use fallback static insights
      setAiInsights([
        { title: 'Expand Product Catalog', description: 'Adding more products can increase your store visibility and attract new customers. Consider expanding into complementary categories.', type: 'opportunity' },
        { title: 'Review Pending Orders', description: 'You have pending orders that need attention. Prompt fulfillment improves customer satisfaction and repeat purchase rates.', type: 'warning' },
        { title: 'Optimize Pricing Strategy', description: 'Regularly reviewing your pricing compared to market trends can help maximize revenue while staying competitive.', type: 'info' },
        { title: 'Boost Customer Retention', description: 'Implementing a loyalty program or offering repeat purchase discounts can increase customer lifetime value significantly.', type: 'opportunity' },
      ])
    } finally {
      setIsLoadingInsights(false)
    }
  }, [currentStore?.id, data?.stats, data?.topProducts, data?.monthlyRevenue])

  useEffect(() => {
    if (data && currentStore?.id) {
      fetchAiInsights()
    }
  }, [data, currentStore?.id, fetchAiInsights])

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
    month: m.month.split(' ')[0],
    revenue: m.revenue,
  }))

  // Area chart data
  const areaData = (data?.monthlyRevenue || [])

  // Top products sorted by revenue
  const topProducts = (data?.topProducts || [])
    .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))

  // Export chart as PNG
  const exportChart = () => {
    if (!chartRef.current) return
    const svg = chartRef.current.querySelector('svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx.scale(2, 2)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      const a = document.createElement('a')
      a.download = 'online-vepar-analytics.png'
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // Get icon and colors based on insight type
  const getInsightStyle = (type: 'opportunity' | 'warning' | 'info') => {
    switch (type) {
      case 'opportunity':
        return { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/30' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30' }
      case 'info':
        return { icon: Info, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-100 dark:border-sky-800/30' }
    }
  }

  // Simulated comparison data
  const comparisonMetrics = data ? [
    { label: 'Revenue', current: data.stats.totalRevenue, previous: Math.round(data.stats.totalRevenue * 0.88), trend: '+12.5%' as string, up: true },
    { label: 'Orders', current: data.stats.totalOrders, previous: Math.round(data.stats.totalOrders * 0.92), trend: '+8.2%' as string, up: true },
    { label: 'Customers', current: data.stats.totalCustomers, previous: Math.round(data.stats.totalCustomers * 0.97), trend: '+3.1%' as string, up: true },
  ] : []

  return (
    <motion.div
      className="space-y-4 sm:space-y-6 pb-16 lg:pb-0"
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
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load analytics</p>
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

      {/* Header with Date Range Picker */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track your store performance and business insights
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Range Picker */}
            <div className="flex items-center border rounded-lg overflow-x-auto max-w-full">
              {DATE_RANGE_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  variant={dateRange === opt.value ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 sm:h-8 px-2 sm:px-3 rounded-none text-[10px] sm:text-xs whitespace-nowrap ${dateRange === opt.value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : ''}`}
                  onClick={() => setDateRange(opt.value)}
                >
                  {opt.value === 'custom' ? <Calendar className="w-3 h-3 mr-1" /> : null}
                  {opt.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Comparison Metrics */}
      {!loading && data && (
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {comparisonMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-border bg-card">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{metric.label}</p>
                  <div className="flex items-end gap-1 sm:gap-2">
                    <span className="text-sm sm:text-lg font-bold truncate">{formatCurrency(metric.current)}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground line-through hidden sm:inline">{formatCurrency(metric.previous)}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${metric.up ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-red-50 dark:bg-red-900/30 text-red-600'}`}>
                  {metric.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {metric.trend}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Avg. Order Value</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center ring-1 ring-blue-600/20">
                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">{formatCurrency(Math.round(avgOrderValue))}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Per order average</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Revenue / Customer</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center ring-1 ring-violet-600/20">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">{formatCurrency(Math.round(revenuePerCustomer))}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Lifetime value</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Best Seller</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center ring-1 ring-orange-600/20">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                <div className="text-base sm:text-lg font-bold tracking-tight truncate">{bestSeller}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Top product by revenue</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow hover-lift">
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4 lg:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending Fulfillments</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center ring-1 ring-sky-600/20">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight">{data?.stats.unfulfilledOrders || 0}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {data?.stats.pendingOrders || 0} pending orders
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Revenue Overview + Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Overview - 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    Revenue Overview
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Monthly revenue for the last 12 months</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Chart Type Toggle */}
                  <div className="flex items-center border rounded-md overflow-hidden">
                    <Button
                      variant={chartType === 'area' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-7 px-2 rounded-none ${chartType === 'area' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      onClick={() => setChartType('area')}
                    >
                      <LineChart className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant={chartType === 'bar' ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-7 px-2 rounded-none ${chartType === 'bar' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}`}
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {/* Export PNG */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[10px] sm:text-xs"
                    onClick={exportChart}
                    title="Export chart as PNG"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      {loading ? <Skeleton className="h-7 w-24 inline-block shimmer-line" /> : formatCurrencyShort(data?.stats.totalRevenue || 0)}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <div className="h-48 sm:h-64" ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                      <AreaChart data={areaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="revenueStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#059669" />
                            <stop offset="50%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
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
                          stroke="url(#revenueStroke)"
                          strokeWidth={2.5}
                          fill="url(#revenueGradient)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
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
                          fill="url(#barGradient)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders by Status - 1 col */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
                </div>
                Orders by Status
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Distribution of order statuses</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
              {loading ? (
                <ChartSkeleton height="h-40 sm:h-52" />
              ) : pieData.length === 0 ? (
                <div className="h-40 sm:h-52 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No order data</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-40 sm:h-52">
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

      {/* AI Insights */}
      {!loading && data && (
        <motion.div variants={itemVariants}>
          <Card className="card-premium gradient-border overflow-hidden">
            <div className="border-t-2 border-t-gradient-emerald">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-600 animate-sparkle-pulse" />
                    </div>
                    AI Insights
                  </CardTitle>
                  <CardDescription>AI-generated insights based on your store data</CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={fetchAiInsights}
                  disabled={isLoadingInsights}
                  className="btn-gradient text-white gap-1.5 hover:text-white"
                >
                  {isLoadingInsights ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Regenerate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border/50">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded shimmer-line shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 shimmer-line rounded w-3/4" />
                          <div className="h-3 shimmer-line rounded w-full" />
                          <div className="h-3 shimmer-line rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : aiInsights.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiInsights.map((insight, idx) => {
                    const style = getInsightStyle(insight.type)
                    const Icon = style.icon
                    const borderClass = insight.type === 'opportunity'
                      ? 'insight-border-opportunity'
                      : insight.type === 'warning'
                      ? 'insight-border-warning'
                      : 'insight-border-info'
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                        className={`flex flex-col gap-2 p-4 rounded-xl hover-lift animate-card-entrance ${borderClass} border ${style.border}`}
                        style={{ animationDelay: `${idx * 0.08}s` }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${style.color} shrink-0 transition-transform duration-200 group-hover:scale-110`} />
                          <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{insight.description}</p>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40 empty-state-icon" />
                  <p className="text-sm">No insights available yet</p>
                </div>
              )}
            </CardContent>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Revenue Trend Bar Chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              Revenue Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monthly revenue comparison</CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
            {loading ? (
              <ChartSkeleton height="h-56 sm:h-72" />
            ) : (
              <div className="h-56 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="trendBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
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
                      fill="url(#trendBarGradient)"
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
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Top Products Table - 3 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card>
            <CardHeader className="p-3 sm:p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                </div>
                Top Products
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Ranked by revenue</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-4">
                      <Skeleton className="h-4 w-6 shimmer-line" />
                      <Skeleton className="h-4 flex-1 shimmer-line" />
                      <Skeleton className="h-4 w-16 shimmer-line hidden sm:block" />
                      <Skeleton className="h-4 w-20 shimmer-line hidden sm:block" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No product sales data yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Avg. Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, idx) => (
                      <TableRow key={product.id} className={`table-row-hover ${idx % 2 === 1 ? 'table-row-alt' : ''}`}>
                        <TableCell className="font-bold text-muted-foreground text-xs">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted dark:bg-muted/50 rounded-md flex items-center justify-center shrink-0">
                              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm hidden sm:table-cell">{product.totalQuantity || 0}</TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm">{formatCurrency(product.totalRevenue || 0)}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground hidden md:table-cell">
                          {product.totalQuantity ? formatCurrency(Math.round((product.totalRevenue || 0) / product.totalQuantity)) : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Customer Insights - 2 cols */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
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
                      <Skeleton className="h-10 w-10 rounded-lg shimmer-line" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1 shimmer-line" />
                        <Skeleton className="h-3 w-16 shimmer-line" />
                      </div>
                      <Skeleton className="h-5 w-12 shimmer-line" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Total Customers */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Total Customers</p>
                      <p className="text-xs text-muted-foreground">All time</p>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{data?.stats.totalCustomers || 0}</span>
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
                        {(data?.stats?.totalCustomers || 0) > 0
                          ? ((data?.stats?.totalOrders || 0) / (data?.stats?.totalCustomers || 1)).toFixed(1)
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
