'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  StarOff,
  Send,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface ProductInfo {
  id: string
  name: string
  slug: string
  images: string
}

interface Review {
  id: string
  productId: string
  storeId: string
  customerName: string
  customerEmail: string | null
  rating: number
  title: string | null
  content: string | null
  isVerified: boolean
  isApproved: boolean
  response: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  product: ProductInfo
}

interface ReviewStats {
  totalReviews: number
  avgRating: number
  pendingCount: number
  verifiedCount: number
  distribution: { star: number; count: number; percentage: number }[]
}

export default function ReviewsPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [productFilter, setProductFilter] = useState('all')
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Respond state
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!currentStore) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        page: page.toString(),
        limit: '10',
      })
      if (search) params.set('search', search)
      if (statusFilter === 'pending') params.set('isApproved', 'false')
      else if (statusFilter === 'approved') params.set('isApproved', 'true')
      else if (statusFilter === 'rejected') params.set('isApproved', 'false')
      if (ratingFilter !== 'all') params.set('rating', ratingFilter)
      if (productFilter !== 'all') params.set('productId', productFilter)

      const res = await fetch(`/api/reviews?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
        setTotalPages(data.totalPages || 1)
        if (data.stats) setStats(data.stats)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch reviews', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore, page, search, statusFilter, ratingFilter, productFilter, toast])

  const fetchProducts = useCallback(async () => {
    if (!currentStore) return
    try {
      const res = await fetch(`/api/products?storeId=${currentStore.id}&limit=100`)
      if (res.ok) {
        const data = await res.json()
        setProducts((data.products || []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
      }
    } catch {
      // ignore
    }
  }, [currentStore])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, ratingFilter, productFilter])

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: approve }),
      })
      if (res.ok) {
        toast({
          title: approve ? 'Review Approved' : 'Review Rejected',
          description: approve ? 'The review is now visible on your store' : 'The review has been rejected',
        })
        fetchReviews()
      } else {
        toast({ title: 'Error', description: 'Failed to update review', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update review', variant: 'destructive' })
    }
  }

  const handleRespond = async (id: string) => {
    if (!responseText.trim()) return
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
      })
      if (res.ok) {
        toast({ title: 'Response Sent', description: 'Your response has been published' })
        setRespondingTo(null)
        setResponseText('')
        fetchReviews()
      } else {
        toast({ title: 'Error', description: 'Failed to send response', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send response', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/reviews/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Review Deleted', description: 'The review has been removed' })
        setDeleteId(null)
        fetchReviews()
      } else {
        toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete review', variant: 'destructive' })
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    return (
      <div className="rating-star">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'star-filled'
                : 'star-empty'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  // Summary cards data
  const summaryCards = stats ? [
    {
      label: 'Total Reviews',
      value: stats.totalReviews,
      icon: Star,
      color: 'emerald',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      textClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-t-gradient-emerald',
      glowClass: 'stat-glow',
      gradientClass: 'card-gradient-emerald',
    },
    {
      label: 'Average Rating',
      value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
      icon: Star,
      color: 'amber',
      bgClass: 'bg-amber-50 dark:bg-amber-900/20',
      textClass: 'text-amber-600 dark:text-amber-400',
      borderClass: 'border-t-gradient-amber',
      glowClass: 'stat-glow-amber',
      gradientClass: 'card-gradient-orange',
      extra: stats.avgRating > 0 ? renderStars(Math.round(stats.avgRating), 'md') : null,
    },
    {
      label: 'Pending Approval',
      value: stats.pendingCount,
      icon: Clock,
      color: 'orange',
      bgClass: 'bg-orange-50 dark:bg-orange-900/20',
      textClass: 'text-orange-600 dark:text-orange-400',
      borderClass: 'border-t-gradient-orange',
      glowClass: 'stat-glow-orange',
      gradientClass: 'card-gradient-orange',
    },
    {
      label: 'Verified Reviews',
      value: stats.verifiedCount,
      icon: ShieldCheck,
      color: 'green',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-600 dark:text-green-400',
      borderClass: 'border-t-gradient-green',
      glowClass: 'stat-glow-green',
      gradientClass: 'card-gradient-emerald',
    },
  ] : []

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No store selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-emerald-600" />
            Reviews
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage product reviews and customer feedback
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !stats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-t-2">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          summaryCards.map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Card className={`${card.borderClass} ${card.glowClass} hover-lift transition-all duration-200 ${card.gradientClass}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <div className={`p-1.5 rounded-lg ${card.bgClass}`}>
                      <card.icon className={`w-4 h-4 ${card.textClass}`} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-end gap-2">
                    <p className="text-2xl font-bold animate-count-up">{card.value}</p>
                    {card.extra && <div className="mb-1">{card.extra}</div>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Star Distribution */}
      {stats && stats.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="card-premium">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-emerald-600" />
                Rating Distribution
              </h3>
              <div className="space-y-2.5">
                {stats.distribution.map((item) => (
                  <div key={item.star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 text-sm">
                      <span className="font-medium">{item.star}</span>
                      <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                    </div>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="rating-bar-gradient h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-20 text-right">
                      {item.count} <span className="text-emerald-600 dark:text-emerald-400">({item.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, title, or content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-3">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs px-3">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs px-3">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Rating Filter */}
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>

            {/* Product Filter */}
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Review List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : reviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardContent className="p-16 text-center">
                <div className="empty-state-icon mb-4">
                  <StarOff className="w-16 h-16 mx-auto text-emerald-300 dark:text-emerald-700" />
                </div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No reviews found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {search || statusFilter !== 'all' || ratingFilter !== 'all' || productFilter !== 'all'
                    ? 'Try adjusting your filters to find reviews'
                    : 'Your products haven\'t received any reviews yet. Share your store link with customers to start collecting feedback!'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
                className="animate-card-entrance"
                style={{ animationDelay: `${idx * 0.06}s` }}
              >
                <Card className={`overflow-hidden card-premium review-card border-l-4 hover:ring-1 hover:ring-inset hover:ring-emerald-200 dark:hover:ring-emerald-800 transition-all duration-200 ${
                  review.rating >= 4
                    ? 'border-l-emerald-500'
                    : review.rating === 3
                      ? 'border-l-amber-400'
                      : 'border-l-red-400'
                }`}>
                  <CardContent className="p-4 sm:p-5">
                    {/* Header: Customer + Rating + Date */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            {review.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{review.customerName}</span>
                            {review.isVerified && (
                              <Badge className="verified-glow bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0 h-5 gap-0.5">
                                <ShieldCheck className="w-3 h-3" />
                                Verified Purchase
                              </Badge>
                            )}
                            {!review.isApproved && (
                              <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-[10px] px-1.5 py-0 h-5 gap-0.5 animate-subtle-pulse">
                                <Clock className="w-3 h-3" />
                                Pending
                              </Badge>
                            )}
                            {review.isApproved && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] px-1.5 py-0 h-5 gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                Approved
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating, 'sm')}
                            <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!review.isApproved && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 btn-approve"
                              onClick={() => handleApprove(review.id, true)}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1 btn-reject"
                              onClick={() => handleApprove(review.id, false)}
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1 btn-gradient text-white"
                          onClick={() => {
                            setRespondingTo(respondingTo === review.id ? null : review.id)
                            setResponseText(review.response || '')
                          }}
                        >
                          <MessageSquare className="w-3 h-3" />
                          {review.response ? 'Edit Response' : 'Respond'}
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 w-7 p-0 btn-delete-outlined"
                          onClick={() => setDeleteId(review.id)}
                          title="Delete review"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="mt-3">
                      {review.title && (
                        <h4 className="font-medium text-sm mb-1">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.content}
                        </p>
                      )}
                    </div>

                    {/* Product reference */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Product:</span>
                      <Badge variant="outline" className="text-[10px] gap-1 border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
                        {review.product?.name || 'Unknown Product'}
                      </Badge>
                    </div>

                    {/* Merchant Response */}
                    {review.response && !respondingTo && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 ml-2"
                      >
                        <div className="merchant-response p-3 bg-emerald-50/60 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              Merchant Response
                            </span>
                            {review.respondedAt && (
                              <span className="text-[10px] text-muted-foreground">
                                • {formatDate(review.respondedAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.response}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Respond Form */}
                    <AnimatePresence>
                      {respondingTo === review.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="merchant-response p-4 space-y-2 bg-emerald-50/60 dark:bg-emerald-900/20">
                            <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              Your Response
                            </label>
                            <Textarea
                              placeholder="Write your response to this review..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="resize-none text-sm"
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setRespondingTo(null)
                                  setResponseText('')
                                }}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 btn-gradient text-white"
                                disabled={!responseText.trim()}
                                onClick={() => handleRespond(review.id)}
                              >
                                <Send className="w-3 h-3" />
                                Submit Response
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Review
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone and the review will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
