'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Search, Filter, MoreHorizontal, Eye, Trash2,
  Package, Truck, CheckCircle2, XCircle, Clock, ArrowLeft,
  MapPin, Phone, Mail, FileText, ChevronLeft, ChevronRight,
  StickyNote, Calendar, Download, Send, MessageSquare, Lock, Globe, User as UserIcon, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface OrderNoteItem {
  id: string
  orderId: string
  authorId?: string
  authorName?: string
  content: string
  isInternal: boolean
  createdAt: string
}

interface OrderItem {
  id: string
  productId?: string
  name: string
  price: number
  quantity: number
  total: number
  product?: { id: string; name: string; images: string }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  fulfillmentStatus: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  billingAddress?: string
  notes?: string
  storeId: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Helper functions
function formatPrice(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-orange-100 text-orange-800 border-orange-200',
    delivered: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-pink-100 text-pink-800 border-pink-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-blue-100 text-blue-800 border-blue-200',
    unpaid: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    refunded: 'bg-pink-100 text-pink-800 border-pink-200',
    partially_refunded: 'bg-orange-100 text-orange-800 border-orange-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function getFulfillmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    fulfilled: 'bg-blue-100 text-blue-800 border-blue-200',
    unfulfilled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    partial: 'bg-orange-100 text-orange-800 border-orange-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function OrdersPage() {
  const { currentStore, selectedOrderId, setSelectedOrderId } = useAppStore()
  const { toast } = useToast()

  // List state
  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all')
  const [page, setPage] = useState(1)

  // Detail state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  // Order notes/comments
  const [orderNoteList, setOrderNoteList] = useState<OrderNoteItem[]>([])
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteIsInternal, setNewNoteIsInternal] = useState(true)
  const [addingNote, setAddingNote] = useState(false)

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    billingAddress: '',
    notes: '',
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
  })
  const [newItems, setNewItems] = useState<Array<{ name: string; price: number; quantity: number }>>([
    { name: '', price: 0, quantity: 1 },
  ])

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  const fetchOrders = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        storeId: currentStore.id,
        page: String(page),
        limit: '20',
      })
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (paymentFilter && paymentFilter !== 'all') params.set('paymentStatus', paymentFilter)
      if (fulfillmentFilter && fulfillmentFilter !== 'all') params.set('fulfillmentStatus', fulfillmentFilter)

      const res = await fetch(`/api/orders?${params}`)
      if (!res.ok) throw new Error('Failed to fetch orders')
      const data = await res.json()
      setOrders(data.orders || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch orders', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, page, search, statusFilter, paymentFilter, fulfillmentFilter, toast])

  // Fetch status counts
  const fetchStatusCounts = useCallback(async () => {
    if (!currentStore?.id) return
    try {
      const baseParams = `storeId=${currentStore.id}&limit=1`
      const allRes = await fetch(`/api/orders?${baseParams}`)
      const allData = await allRes.json()

      const counts: Record<string, number> = { all: allData.pagination?.total || 0 }
      for (const status of ORDER_STATUSES) {
        const res = await fetch(`/api/orders?${baseParams}&status=${status}`)
        const data = await res.json()
        counts[status] = data.pagination?.total || 0
      }
      setStatusCounts(counts)
    } catch {
      // Silently fail for counts
    }
  }, [currentStore?.id])

  // Fetch order detail
  const fetchOrderDetail = useCallback(async (orderId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) throw new Error('Failed to fetch order')
      const data = await res.json()
      setSelectedOrder(data.order)
      setOrderNotes(data.order.notes || '')
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch order details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }, [toast])

  // Fetch order notes/comments
  const fetchOrderNotes = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/notes?orderId=${orderId}`)
      if (res.ok) {
        const data = await res.json()
        setOrderNoteList(data.notes || [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchStatusCounts()
  }, [fetchStatusCounts])

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId)
      fetchOrderNotes(selectedOrderId)
    } else {
      setSelectedOrder(null)
      setOrderNoteList([])
    }
  }, [selectedOrderId, fetchOrderDetail, fetchOrderNotes])

  // Update order status
  const updateOrderStatus = async (orderId: string, updates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update order')
      toast({ title: 'Success', description: 'Order updated successfully' })
      if (selectedOrderId === orderId) {
        fetchOrderDetail(orderId)
      }
      fetchOrders()
      fetchStatusCounts()
    } catch {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' })
    }
  }

  // Delete order
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete order')
      toast({ title: 'Success', description: 'Order deleted successfully' })
      if (selectedOrderId === deleteId) {
        setSelectedOrderId(null)
      }
      fetchOrders()
      fetchStatusCounts()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete order', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // Create order
  const handleCreate = async () => {
    if (!currentStore?.id) return
    if (!newOrder.customerName.trim()) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' })
      return
    }
    const validItems = newItems.filter(i => i.name.trim() && i.price > 0 && i.quantity > 0)
    if (validItems.length === 0) {
      toast({ title: 'Error', description: 'Add at least one valid item', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const subtotal = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const total = subtotal + newOrder.tax + newOrder.shipping - newOrder.discount

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          customerName: newOrder.customerName,
          customerEmail: newOrder.customerEmail || undefined,
          customerPhone: newOrder.customerPhone || undefined,
          shippingAddress: newOrder.shippingAddress || undefined,
          billingAddress: newOrder.billingAddress || undefined,
          notes: newOrder.notes || undefined,
          subtotal,
          tax: newOrder.tax,
          shipping: newOrder.shipping,
          discount: newOrder.discount,
          total,
          items: validItems.map(i => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            total: i.price * i.quantity,
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to create order')
      toast({ title: 'Success', description: 'Order created successfully' })
      setShowCreateDialog(false)
      resetCreateForm()
      fetchOrders()
      fetchStatusCounts()
    } catch {
      toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const resetCreateForm = () => {
    setNewOrder({
      customerName: '', customerEmail: '', customerPhone: '',
      shippingAddress: '', billingAddress: '', notes: '',
      subtotal: 0, tax: 0, shipping: 0, discount: 0,
    })
    setNewItems([{ name: '', price: 0, quantity: 1 }])
  }

  // Save notes (legacy simple notes field)
  const saveNotes = async () => {
    if (!selectedOrder) return
    await updateOrderStatus(selectedOrder.id, { notes: orderNotes })
  }


  // Add order note
  const handleAddNote = async () => {
    if (!selectedOrder || !newNoteContent.trim()) return
    setAddingNote(true)
    try {
      const res = await fetch('/api/orders/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          content: newNoteContent.trim(),
          isInternal: newNoteIsInternal,
        }),
      })
      if (res.ok) {
        setNewNoteContent('')
        fetchOrderNotes(selectedOrder.id)
        toast({ title: 'Note added', description: 'Your note has been added to this order.' })
      } else {
        toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' })
    } finally {
      setAddingNote(false)
    }
  }

  // Delete order note
  const handleDeleteNote = async (noteId: string) => {
    if (!selectedOrder) return
    try {
      const res = await fetch(`/api/orders/notes/${noteId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchOrderNotes(selectedOrder.id)
        toast({ title: 'Note deleted', description: 'The note has been removed.' })
      }
    } catch {
      // silently fail
    }
  }

  // ========== DETAIL VIEW ==========
  if (selectedOrder) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="h-9 sm:h-10" onClick={() => setSelectedOrderId(null)}>
                <ArrowLeft className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
                  {selectedOrder.orderNumber}
                  <Badge className={`${getOrderStatusColor(selectedOrder.status)} text-[10px] sm:text-xs`}>
                    {capitalizeFirst(selectedOrder.status)}
                  </Badge>
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Created on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Status Update Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="card-premium">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status !== 'confirmed' && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { status: 'confirmed' })}
                  >
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Mark as Confirmed</span>
                    <span className="sm:hidden">Confirm</span>
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { status: 'processing' })}
                  >
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Mark as Processing</span>
                    <span className="sm:hidden">Process</span>
                  </Button>
                )}
                {(selectedOrder.status === 'confirmed' || selectedOrder.status === 'processing') && (
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { status: 'shipped' })}
                  >
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Mark as Shipped</span>
                    <span className="sm:hidden">Ship</span>
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { status: 'delivered' })}
                  >
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Mark as Delivered</span>
                    <span className="sm:hidden">Deliver</span>
                  </Button>
                )}
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { status: 'cancelled' })}
                  >
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Cancel Order</span>
                    <span className="sm:hidden">Cancel</span>
                  </Button>
                )}
                {selectedOrder.paymentStatus === 'unpaid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { paymentStatus: 'paid' })}
                  >
                    <span className="hidden sm:inline">Mark as Paid</span>
                    <span className="sm:hidden">Paid</span>
                  </Button>
                )}
                {selectedOrder.fulfillmentStatus === 'unfulfilled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 h-8 sm:h-9 text-xs sm:text-sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, { fulfillmentStatus: 'fulfilled' })}
                  >
                    <span className="hidden sm:inline">Mark as Fulfilled</span>
                    <span className="sm:hidden">Fulfill</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Items */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(selectedOrder.shipping)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-blue-600">-{formatPrice(selectedOrder.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes & Comments */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Notes & Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  {/* Add Note Form */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={newNoteIsInternal ? 'default' : 'outline'}
                        className={`h-7 text-xs gap-1 ${newNoteIsInternal ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
                        onClick={() => setNewNoteIsInternal(true)}
                      >
                        <Lock className="w-3 h-3" />
                        Internal
                      </Button>
                      <Button
                        size="sm"
                        variant={!newNoteIsInternal ? 'default' : 'outline'}
                        className={`h-7 text-xs gap-1 ${!newNoteIsInternal ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                        onClick={() => setNewNoteIsInternal(false)}
                      >
                        <Globe className="w-3 h-3" />
                        Customer-visible
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder={newNoteIsInternal ? 'Add an internal note (only visible to staff)...' : 'Add a note visible to the customer...'}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        rows={2}
                        className="text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            handleAddNote()
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleAddNote}
                        disabled={addingNote || !newNoteContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white h-fit self-end"
                      >
                        {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Press ⌘+Enter to send</p>
                  </div>

                  <Separator />

                  {/* Notes Timeline */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {orderNoteList.length === 0 ? (
                      <div className="text-center py-4">
                        <StickyNote className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">No notes yet. Add one above.</p>
                      </div>
                    ) : (
                      orderNoteList.map((note) => (
                        <div
                          key={note.id}
                          className={`relative pl-6 pb-3 border-l-2 ${
                            note.isInternal ? 'border-amber-300 dark:border-amber-700' : 'border-blue-300 dark:border-blue-700'
                          }`}
                        >
                          <div className={`absolute left-0 top-1 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-background ${
                            note.isInternal ? 'bg-amber-400' : 'bg-blue-400'
                          }`} />
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {note.authorName && (
                                  <span className="text-xs font-medium flex items-center gap-1">
                                    <UserIcon className="w-3 h-3" />
                                    {note.authorName}
                                  </span>
                                )}
                                <Badge
                                  variant="secondary"
                                  className={`text-[9px] h-4 px-1.5 ${
                                    note.isInternal
                                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}
                                >
                                  {note.isInternal ? 'Internal' : 'Customer'}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/90 whitespace-pre-line">{note.content}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Legacy Order Notes */}
                  {selectedOrder.notes && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Original Order Note</p>
                        <div className="p-2 rounded-md bg-muted/50 text-sm text-muted-foreground whitespace-pre-line">
                          {selectedOrder.notes}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Customer Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                      {selectedOrder.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {selectedOrder.customerEmail}
                    </div>
                  )}
                  {selectedOrder.customerPhone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {selectedOrder.customerPhone}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Shipping Address */}
            {selectedOrder.shippingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
              >
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedOrder.shippingAddress}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Billing Address */}
            {selectedOrder.billingAddress && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18 }}
              >
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {selectedOrder.billingAddress}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Status Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order</span>
                    <Badge className={getOrderStatusColor(selectedOrder.status)}>
                      {capitalizeFirst(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment</span>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {capitalizeFirst(selectedOrder.paymentStatus)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fulfillment</span>
                    <Badge className={getFulfillmentStatusColor(selectedOrder.fulfillmentStatus)}>
                      {capitalizeFirst(selectedOrder.fulfillmentStatus)}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created
                    </span>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated
                    </span>
                    <span>{formatDate(selectedOrder.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this order? This action cannot be undone.
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

  // ========== DETAIL LOADING ==========
  if (selectedOrderId && !selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrderId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  // ========== LIST VIEW ==========
  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
              Orders
              {pagination.total > 0 && (
                <span className="text-muted-foreground font-normal text-sm sm:text-lg ml-2">
                  ({pagination.total})
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Track and manage customer orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="btn-gradient text-white h-9 sm:h-10"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Order</span>
              <span className="sm:hidden">Create</span>
            </Button>
            <Button
              variant="outline"
              className="h-9 sm:h-10"
              onClick={() => window.open(`/api/export?storeId=${currentStore?.id}&type=orders`)}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Status Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="overflow-x-auto">
          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <TabsList className="h-auto flex-wrap">
              <TabsTrigger value="all" className="gap-1">
                All <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">{statusCounts.all || 0}</Badge>
              </TabsTrigger>
              {ORDER_STATUSES.map((s) => (
                <TabsTrigger key={s} value={s} className="gap-1">
                  {capitalizeFirst(s)} <Badge variant="secondary" className="ml-1.5 text-[10px] h-5 px-1.5">{statusCounts[s] || 0}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={fulfillmentFilter} onValueChange={(v) => { setFulfillmentFilter(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Fulfillment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fulfillment</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="unfulfilled">Unfulfilled</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Orders Table / Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="card-premium">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32 flex-1" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium">No orders found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {search || statusFilter !== 'all' || paymentFilter !== 'all' || fulfillmentFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first order to get started'}
                </p>
                {!search && statusFilter === 'all' && paymentFilter === 'all' && fulfillmentFilter === 'all' && (
                  <Button
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Order
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Fulfillment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {orders.map((order) => (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: orders.indexOf(order) * 0.03 }}
                            className={`table-row-hover animate-row-appear border-b transition-colors cursor-pointer ${orders.indexOf(order) % 2 === 1 ? 'table-row-alt' : ''}`}
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            <TableCell className="font-medium text-blue-700">
                              {order.orderNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm">{order.customerName}</p>
                                {order.customerEmail && (
                                  <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                            <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                            <TableCell>
                              <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                                {capitalizeFirst(order.paymentStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getFulfillmentStatusColor(order.fulfillmentStatus)} variant="outline">
                                {capitalizeFirst(order.fulfillmentStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getOrderStatusColor(order.status)} variant="outline">
                                {capitalizeFirst(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id) }}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const newStatus = order.status === 'pending' ? 'confirmed' : 'processing'
                                      updateOrderStatus(order.id, { status: newStatus })
                                    }}
                                  >
                                    <Package className="w-4 h-4 mr-2" />
                                    Update Status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(order.id) }}
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

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedOrderId(order.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-blue-700">{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{order.customerName}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id) }}>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(order.id) }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getOrderStatusColor(order.status)} variant="outline">
                            {capitalizeFirst(order.status)}
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                            {capitalizeFirst(order.paymentStatus)}
                          </Badge>
                        </div>
                        <p className="font-semibold">{formatPrice(order.total)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(order.createdAt)} · {order.items?.length || 0} items
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, pagination.total)} of {pagination.total}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum: number
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'outline'}
                            size="sm"
                            className={pageNum === page ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Order Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>Add customer details and items for the new order.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-6 py-2">
              {/* Customer Details */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      placeholder="Customer name"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      placeholder="email@example.com"
                      value={newOrder.customerEmail}
                      onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={newOrder.customerPhone}
                      onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Addresses */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Addresses</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Shipping Address</label>
                    <Textarea
                      placeholder="Shipping address"
                      value={newOrder.shippingAddress}
                      onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Billing Address</label>
                    <Textarea
                      placeholder="Billing address"
                      value={newOrder.billingAddress}
                      onChange={(e) => setNewOrder({ ...newOrder, billingAddress: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">Order Items</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewItems([...newItems, { name: '', price: 0, quantity: 1 }])}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Item
                  </Button>
                </div>
                {newItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      {idx === 0 && <label className="text-sm font-medium">Product Name</label>}
                      <Input
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...newItems]
                          updated[idx] = { ...updated[idx], name: e.target.value }
                          setNewItems(updated)
                        }}
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      {idx === 0 && <label className="text-sm font-medium">Price (₹)</label>}
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.price || ''}
                        onChange={(e) => {
                          const updated = [...newItems]
                          updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 }
                          setNewItems(updated)
                        }}
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      {idx === 0 && <label className="text-sm font-medium">Qty</label>}
                      <Input
                        type="number"
                        placeholder="1"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const updated = [...newItems]
                          updated[idx] = { ...updated[idx], quantity: parseInt(e.target.value) || 0 }
                          setNewItems(updated)
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      {idx > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                          onClick={() => setNewItems(newItems.filter((_, i) => i !== idx))}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Totals</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Tax (₹)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newOrder.tax || ''}
                      onChange={(e) => setNewOrder({ ...newOrder, tax: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Shipping (₹)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newOrder.shipping || ''}
                      onChange={(e) => setNewOrder({ ...newOrder, shipping: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Discount (₹)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newOrder.discount || ''}
                      onChange={(e) => setNewOrder({ ...newOrder, discount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Total</label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-muted/50 font-semibold">
                      {formatPrice(
                        newItems.reduce((s, i) => s + i.price * i.quantity, 0) +
                        newOrder.tax + newOrder.shipping - newOrder.discount
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Order notes..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white button-press"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone and all order data will be permanently removed.
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
