'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Search, MoreHorizontal, Trash2, Pencil,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, ArrowLeft,
  FileText, ShoppingCart, Calendar, Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Types
interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  notes?: string
  totalOrders: number
  totalSpent: number
  storeId: string
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
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
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-pink-100 text-pink-800 border-pink-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

export default function CustomersPage() {
  const { currentStore, selectedCustomerId, setSelectedCustomerId } = useAppStore()
  const { toast } = useToast()

  // List state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Detail state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = useCallback(async () => {
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

      const res = await fetch(`/api/customers?${params}`)
      if (!res.ok) throw new Error('Failed to fetch customers')
      const data = await res.json()
      setCustomers(data.customers || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, page, search, toast])

  // Fetch customer detail with orders
  const fetchCustomerDetail = useCallback(async (customerId: string) => {
    setDetailLoading(true)
    try {
      // Fetch customer details from the list (the API doesn't have a GET /api/customers/[id])
      // We'll use the customer data from the list
      const customer = customers.find(c => c.id === customerId)
      if (customer) {
        setSelectedCustomer(customer)
      }

      // Fetch orders for this customer
      if (currentStore?.id) {
        const res = await fetch(`/api/orders?storeId=${currentStore.id}&limit=100&search=${encodeURIComponent(customer?.name || '')}`)
        if (res.ok) {
          const data = await res.json()
          const filteredOrders = (data.orders || []).filter(
            (o: Order & { customerName: string; customerEmail?: string }) =>
              o.customerName === customer?.name || o.customerEmail === customer?.email
          )
          setCustomerOrders(filteredOrders)
        }
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customer details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }, [customers, currentStore?.id, toast])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetail(selectedCustomerId)
    } else {
      setSelectedCustomer(null)
      setCustomerOrders([])
    }
  }, [selectedCustomerId, fetchCustomerDetail])

  // Open create dialog
  const openCreateDialog = () => {
    setEditingCustomer(null)
    setFormData({ name: '', email: '', phone: '', address: '', city: '', state: '', zip: '', notes: '' })
    setShowDialog(true)
  }

  // Open edit dialog
  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zip: customer.zip || '',
      notes: customer.notes || '',
    })
    setShowDialog(true)
  }

  // Save customer (create or update)
  const handleSave = async () => {
    if (!currentStore?.id) return
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      if (editingCustomer) {
        // Update
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error('Failed to update customer')
        toast({ title: 'Success', description: 'Customer updated successfully' })
      } else {
        // Create
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, storeId: currentStore.id }),
        })
        if (!res.ok) throw new Error('Failed to create customer')
        toast({ title: 'Success', description: 'Customer created successfully' })
      }
      setShowDialog(false)
      fetchCustomers()
      if (selectedCustomerId && editingCustomer?.id === selectedCustomerId) {
        fetchCustomerDetail(selectedCustomerId)
      }
    } catch {
      toast({ title: 'Error', description: editingCustomer ? 'Failed to update customer' : 'Failed to create customer', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  // Delete customer
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete customer')
      toast({ title: 'Success', description: 'Customer deleted successfully' })
      if (selectedCustomerId === deleteId) {
        setSelectedCustomerId(null)
      }
      fetchCustomers()
    } catch {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  // ========== DETAIL VIEW ==========
  if (selectedCustomer) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" className="h-9 sm:h-10" onClick={() => setSelectedCustomerId(null)}>
                <ArrowLeft className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full avatar-gradient-border">
                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-base sm:text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{selectedCustomer.name}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Customer since {formatDate(selectedCustomer.createdAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-9 sm:h-10"
                onClick={() => openEditDialog(selectedCustomer)}
              >
                <Pencil className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="destructive"
                className="h-9 sm:h-10"
                onClick={() => setDeleteId(selectedCustomer.id)}
              >
                <Trash2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Order History */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Order History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  {customerOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-muted-foreground">No orders yet for this customer</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerOrders.map((order) => (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedCustomerId(null)
                              // Use store to navigate to orders and select this order
                              const { setSelectedOrderId, setView } = useAppStore.getState()
                              setSelectedOrderId(order.id)
                              setView('orders')
                            }}
                          >
                            <TableCell className="font-medium text-emerald-700">{order.orderNumber}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>
                              <Badge className={getOrderStatusColor(order.status)} variant="outline">
                                {capitalizeFirst(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right column */}
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                  {(selectedCustomer.address || selectedCustomer.city) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        {selectedCustomer.address && <p>{selectedCustomer.address}</p>}
                        {(selectedCustomer.city || selectedCustomer.state) && (
                          <p>
                            {[selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ')}
                            {selectedCustomer.zip ? ` - ${selectedCustomer.zip}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {!selectedCustomer.email && !selectedCustomer.phone && !selectedCustomer.address && (
                    <p className="text-sm text-muted-foreground">No contact info added</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="card-premium">
                <CardHeader className="pb-3 p-3 sm:p-4 lg:p-6">
                  <CardTitle className="text-base sm:text-lg">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-3 sm:p-4 lg:p-6 pt-0 sm:pt-0 lg:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Orders</span>
                    <span className="font-semibold">{selectedCustomer.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                    <span className="font-semibold">{formatPrice(selectedCustomer.totalSpent)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined
                    </span>
                    <span>{formatDate(selectedCustomer.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="card-premium">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedCustomer.notes}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Edit Customer Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer information.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 py-2 pr-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    placeholder="Customer name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    placeholder="Street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">State</label>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">ZIP</label>
                    <Input
                      placeholder="ZIP"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Notes about this customer..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button
                className="btn-gradient text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this customer? This action cannot be undone.
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
  if (selectedCustomerId && !selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
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
              Customers
              {pagination.total > 0 && (
                <span className="text-muted-foreground font-normal text-sm sm:text-lg ml-2">
                  ({pagination.total})
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">View and manage your customer base</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="btn-gradient text-white h-9 sm:h-10"
              onClick={openCreateDialog}
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Customer</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button
              variant="outline"
              className="h-9 sm:h-10"
              onClick={() => window.open(`/api/export?storeId=${currentStore?.id}&type=customers`)}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Export</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone..."
              className="pl-9 h-9 sm:h-10 text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
      </motion.div>

      {/* Customers Table / Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="card-premium">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-emerald-600 empty-state-icon" />
                </div>
                <h3 className="text-lg font-medium">No customers found</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {search
                    ? 'Try adjusting your search'
                    : 'Add your first customer to get started'}
                </p>
                {!search && (
                  <Button
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={openCreateDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Phone</TableHead>
                        <TableHead className="hidden md:table-cell">City/State</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Orders</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">Total Spent</TableHead>
                        <TableHead className="hidden lg:table-cell">Joined</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {customers.map((customer) => (
                          <motion.tr
                            key={customer.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`table-row-hover animate-row-appear border-b transition-colors cursor-pointer ${customers.indexOf(customer) % 2 === 1 ? 'table-row-alt' : ''}`}
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="avatar-gradient-border w-8 h-8">
                                  <div className="w-full h-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs">
                                    {customer.name.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <span className="font-medium">{customer.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">
                              {customer.email || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                              {customer.phone || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                              {[customer.city, customer.state].filter(Boolean).join(', ') || '—'}
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              <Badge variant="secondary">{customer.totalOrders}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium hidden sm:table-cell">
                              {formatPrice(customer.totalSpent)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                              {formatDate(customer.createdAt)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(customer.id) }}>
                                    <Search className="w-4 h-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(customer) }}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => { e.stopPropagation(); setDeleteId(customer.id) }}
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
                </div>
                <div className="md:hidden divide-y">
                  {customers.map((customer) => (
                    <motion.div
                      key={customer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 table-row-hover cursor-pointer"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.email && (
                              <p className="text-xs text-muted-foreground">{customer.email}</p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(customer.id) }}>
                              <Search className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(customer) }}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => { e.stopPropagation(); setDeleteId(customer.id) }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{customer.totalOrders} orders</span>
                          <span>·</span>
                          <span className="font-medium text-foreground">{formatPrice(customer.totalSpent)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(customer.createdAt)}</span>
                      </div>
                      {(customer.phone || customer.city) && (
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {customer.phone && <span>{customer.phone}</span>}
                          {customer.phone && customer.city && <span>·</span>}
                          {customer.city && <span>{[customer.city, customer.state].filter(Boolean).join(', ')}</span>}
                        </div>
                      )}
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
                            className={pageNum === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
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

      {/* Add/Edit Customer Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information.' : 'Add a new customer to your store.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-2 pr-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  placeholder="Customer name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Address</label>
                <Input
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">State</label>
                  <Input
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">ZIP</label>
                  <Input
                    placeholder="ZIP"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="h-9 sm:h-10"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Notes about this customer..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              className="btn-gradient text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone and all customer data will be permanently removed.
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
