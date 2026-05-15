'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Truck,
  Plus,
  Search,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  ExternalLink,
  AlertCircle,
  RotateCcw,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

// Indian states for zone creation
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const CARRIERS = ['Delhivery', 'BlueDart', 'DTDC', 'India Post', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Professional Couriers', 'Other']

const SHIPMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ComponentType<{ className?: string }> }> = {
  label_created: { label: 'Label Created', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800', icon: Package },
  picked_up: { label: 'Picked Up', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/40', icon: Package },
  in_transit: { label: 'In Transit', color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/40', icon: Truck },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/40', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/40', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/40', icon: AlertCircle },
  returned: { label: 'Returned', color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/40', icon: RotateCcw },
}

const STATUS_FLOW = ['label_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered']

interface ShippingZone {
  id: string
  name: string
  regions: string
  storeId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  rates: ShippingRate[]
}

interface ShippingRate {
  id: string
  name: string
  zoneId: string
  priceType: string
  minWeight: number | null
  maxWeight: number | null
  minOrderValue: number | null
  maxOrderValue: number | null
  rate: number
  freeAbove: number | null
  estimatedDays: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Shipment {
  id: string
  orderId: string
  storeId: string
  trackingNumber: string | null
  carrier: string | null
  shippingMethod: string | null
  status: string
  shippedAt: string | null
  deliveredAt: string | null
  weight: number | null
  dimensions: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  order: {
    id: string
    orderNumber: string
    customerName: string
    customerEmail: string | null
    total: number
    status: string
    fulfillmentStatus: string
    customerPhone?: string | null
    shippingAddress?: string | null
    items?: Array<{ id: string; name: string; quantity: number; price: number; total: number }>
  }
}

interface TimelineStep {
  key: string
  label: string
  description: string
  completed: boolean
  current: boolean
  timestamp: string | null
}

export default function ShippingPage() {
  const { currentStore } = useAppStore()
  const { toast } = useToast()

  // Data state
  const [zones, setZones] = useState<ShippingZone[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('zones')

  // Zone UI state
  const [expandedZone, setExpandedZone] = useState<string | null>(null)
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<ShippingZone | null>(null)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [rateZoneId, setRateZoneId] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null)

  // Shipment UI state
  const [shipmentSearch, setShipmentSearch] = useState('')
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState('all')
  const [shipmentDetailOpen, setShipmentDetailOpen] = useState(false)
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [shipmentTimeline, setShipmentTimeline] = useState<TimelineStep[]>([])
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false)

  // Zone form state
  const [zoneForm, setZoneForm] = useState({
    name: '',
    regions: [] as string[],
    isActive: true,
  })
  const [zoneRates, setZoneRates] = useState<Array<{
    name: string
    priceType: string
    rate: number
    estimatedDays: string
    freeAbove: number | null
    minWeight: number | null
    maxWeight: number | null
    minOrderValue: number | null
    maxOrderValue: number | null
    isActive: boolean
  }>>([])

  // Rate form state
  const [rateForm, setRateForm] = useState({
    name: '',
    priceType: 'flat',
    rate: 0,
    estimatedDays: '3-5',
    freeAbove: null as number | null,
    minWeight: null as number | null,
    maxWeight: null as number | null,
    minOrderValue: null as number | null,
    maxOrderValue: null as number | null,
    isActive: true,
  })

  // Shipment form state
  const [shipmentForm, setShipmentForm] = useState({
    orderId: '',
    carrier: '',
    shippingMethod: '',
    weight: null as number | null,
    length: null as number | null,
    width: null as number | null,
    height: null as number | null,
    notes: '',
  })
  const [availableOrders, setAvailableOrders] = useState<Array<{ id: string; orderNumber: string; customerName: string; total: number }>>([])
  const [orderSearch, setOrderSearch] = useState('')

  // Summary stats
  const [stats, setStats] = useState({
    activeZones: 0,
    totalRates: 0,
    inTransit: 0,
    deliveredThisMonth: 0,
  })

  const fetchZones = useCallback(async () => {
    if (!currentStore) return
    try {
      const res = await fetch(`/api/shipping/zones?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setZones(data.zones || [])
        const totalRates = (data.zones || []).reduce((acc: number, z: ShippingZone) => acc + (z.rates?.length || 0), 0)
        setStats(prev => ({ ...prev, activeZones: (data.zones || []).filter((z: ShippingZone) => z.isActive).length, totalRates }))
      }
    } catch {
      // ignore
    }
  }, [currentStore])

  const fetchShipments = useCallback(async () => {
    if (!currentStore) return
    try {
      const params = new URLSearchParams({ storeId: currentStore.id })
      if (shipmentStatusFilter !== 'all') params.set('status', shipmentStatusFilter)
      if (shipmentSearch) params.set('search', shipmentSearch)
      const res = await fetch(`/api/shipments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setShipments(data.shipments || [])
        const inTransit = (data.shipments || []).filter((s: Shipment) => ['in_transit', 'picked_up', 'out_for_delivery'].includes(s.status)).length
        const now = new Date()
        const deliveredThisMonth = (data.shipments || []).filter((s: Shipment) => {
          if (s.status !== 'delivered' || !s.deliveredAt) return false
          const d = new Date(s.deliveredAt)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length
        setStats(prev => ({ ...prev, inTransit, deliveredThisMonth }))
      }
    } catch {
      // ignore
    }
  }, [currentStore, shipmentStatusFilter, shipmentSearch])

  const fetchAvailableOrders = useCallback(async () => {
    if (!currentStore) return
    try {
      const res = await fetch(`/api/orders?storeId=${currentStore.id}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setAvailableOrders((data.orders || []).map((o: { id: string; orderNumber: string; customerName: string; total: number }) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          total: o.total,
        })))
      }
    } catch {
      // ignore
    }
  }, [currentStore])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchZones(), fetchShipments()])
      setLoading(false)
    }
    load()
  }, [fetchZones, fetchShipments])

  // Zone CRUD handlers
  const handleCreateZone = async () => {
    if (!currentStore || !zoneForm.name) return
    try {
      const res = await fetch('/api/shipping/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          name: zoneForm.name,
          regions: zoneForm.regions,
          isActive: zoneForm.isActive,
          rates: zoneRates,
        }),
      })
      if (res.ok) {
        toast({ title: 'Shipping zone created', description: `${zoneForm.name} has been created successfully` })
        setZoneDialogOpen(false)
        resetZoneForm()
        fetchZones()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create zone', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create zone', variant: 'destructive' })
    }
  }

  const handleUpdateZone = async () => {
    if (!editingZone) return
    try {
      const res = await fetch(`/api/shipping/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneForm.name,
          regions: zoneForm.regions,
          isActive: zoneForm.isActive,
        }),
      })
      if (res.ok) {
        toast({ title: 'Zone updated', description: `${zoneForm.name} has been updated` })
        setZoneDialogOpen(false)
        setEditingZone(null)
        resetZoneForm()
        fetchZones()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update zone', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update zone', variant: 'destructive' })
    }
  }

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const res = await fetch(`/api/shipping/zones/${zoneId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Zone deleted', description: 'Shipping zone has been deleted' })
        fetchZones()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete zone', variant: 'destructive' })
    }
  }

  const handleToggleZoneActive = async (zone: ShippingZone) => {
    try {
      const res = await fetch(`/api/shipping/zones/${zone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !zone.isActive }),
      })
      if (res.ok) {
        toast({ title: zone.isActive ? 'Zone deactivated' : 'Zone activated', description: `${zone.name} has been ${zone.isActive ? 'deactivated' : 'activated'}` })
        fetchZones()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle zone status', variant: 'destructive' })
    }
  }

  // Rate CRUD handlers
  const handleCreateRate = async () => {
    if (!rateZoneId || !rateForm.name) return
    try {
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: rateZoneId, ...rateForm }),
      })
      if (res.ok) {
        toast({ title: 'Rate added', description: `${rateForm.name} rate has been added` })
        setRateDialogOpen(false)
        resetRateForm()
        fetchZones()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add rate', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to add rate', variant: 'destructive' })
    }
  }

  const handleUpdateRate = async () => {
    if (!editingRate) return
    try {
      const res = await fetch(`/api/shipping/rates/${editingRate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rateForm),
      })
      if (res.ok) {
        toast({ title: 'Rate updated', description: `${rateForm.name} rate has been updated` })
        setRateDialogOpen(false)
        setEditingRate(null)
        resetRateForm()
        fetchZones()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update rate', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update rate', variant: 'destructive' })
    }
  }

  const handleDeleteRate = async (rateId: string) => {
    try {
      const res = await fetch(`/api/shipping/rates/${rateId}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Rate deleted', description: 'Shipping rate has been deleted' })
        fetchZones()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete rate', variant: 'destructive' })
    }
  }

  // Shipment handlers
  const handleCreateShipment = async () => {
    if (!currentStore || !shipmentForm.orderId) return
    try {
      const dimensions = (shipmentForm.length || shipmentForm.width || shipmentForm.height)
        ? JSON.stringify({ length: shipmentForm.length, width: shipmentForm.width, height: shipmentForm.height })
        : null
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: currentStore.id,
          orderId: shipmentForm.orderId,
          carrier: shipmentForm.carrier,
          shippingMethod: shipmentForm.shippingMethod,
          weight: shipmentForm.weight,
          dimensions,
          notes: shipmentForm.notes,
        }),
      })
      if (res.ok) {
        toast({ title: 'Shipment created', description: 'New shipment has been created successfully' })
        setCreateShipmentOpen(false)
        resetShipmentForm()
        fetchShipments()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create shipment', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create shipment', variant: 'destructive' })
    }
  }

  const handleViewShipment = async (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setShipmentDetailOpen(true)
    // Fetch tracking timeline
    if (shipment.trackingNumber) {
      try {
        const res = await fetch(`/api/shipments/track?trackingNumber=${shipment.trackingNumber}`)
        if (res.ok) {
          const data = await res.json()
          setShipmentTimeline(data.timeline || [])
          if (data.shipment) setSelectedShipment(data.shipment)
        }
      } catch {
        // Build basic timeline from status
        buildBasicTimeline(shipment.status)
      }
    } else {
      buildBasicTimeline(shipment.status)
    }
  }

  const handleUpdateShipmentStatus = async (shipmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        toast({ title: 'Status updated', description: `Shipment status updated to ${SHIPMENT_STATUS_CONFIG[newStatus]?.label || newStatus}` })
        setSelectedShipment(data.shipment)
        fetchShipments()
        // Re-fetch timeline
        if (data.shipment?.trackingNumber) {
          const trackRes = await fetch(`/api/shipments/track?trackingNumber=${data.shipment.trackingNumber}`)
          if (trackRes.ok) {
            const trackData = await trackRes.json()
            setShipmentTimeline(trackData.timeline || [])
          }
        } else {
          buildBasicTimeline(newStatus)
        }
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  // Helper functions
  const buildBasicTimeline = (status: string) => {
    const currentIdx = STATUS_FLOW.indexOf(status)
    const steps = [
      { key: 'label_created', label: 'Label Created', description: 'Shipping label has been created' },
      { key: 'picked_up', label: 'Picked Up', description: 'Package has been picked up by carrier' },
      { key: 'in_transit', label: 'In Transit', description: 'Package is on its way' },
      { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Package is out for delivery' },
      { key: 'delivered', label: 'Delivered', description: 'Package has been delivered' },
    ]
    const timeline = steps.map((step, idx) => ({
      ...step,
      completed: currentIdx >= 0 ? idx <= currentIdx : false,
      current: step.key === status,
      timestamp: null,
    }))
    if (status === 'failed') {
      timeline.push({ key: 'failed', label: 'Delivery Failed', description: 'Delivery attempt was unsuccessful', completed: true, current: true, timestamp: null })
    } else if (status === 'returned') {
      timeline.push({ key: 'returned', label: 'Returned', description: 'Package has been returned', completed: true, current: true, timestamp: null })
    }
    setShipmentTimeline(timeline)
  }

  const resetZoneForm = () => {
    setZoneForm({ name: '', regions: [], isActive: true })
    setZoneRates([])
  }

  const resetRateForm = () => {
    setRateForm({ name: '', priceType: 'flat', rate: 0, estimatedDays: '3-5', freeAbove: null, minWeight: null, maxWeight: null, minOrderValue: null, maxOrderValue: null, isActive: true })
  }

  const resetShipmentForm = () => {
    setShipmentForm({ orderId: '', carrier: '', shippingMethod: '', weight: null, length: null, width: null, height: null, notes: '' })
    setOrderSearch('')
  }

  const openEditZone = (zone: ShippingZone) => {
    setEditingZone(zone)
    setZoneForm({
      name: zone.name,
      regions: JSON.parse(zone.regions || '[]'),
      isActive: zone.isActive,
    })
    setZoneDialogOpen(true)
  }

  const openAddRate = (zoneId: string) => {
    setRateZoneId(zoneId)
    setEditingRate(null)
    resetRateForm()
    setRateDialogOpen(true)
  }

  const openEditRate = (rate: ShippingRate) => {
    setEditingRate(rate)
    setRateZoneId(rate.zoneId)
    setRateForm({
      name: rate.name,
      priceType: rate.priceType,
      rate: rate.rate,
      estimatedDays: rate.estimatedDays,
      freeAbove: rate.freeAbove,
      minWeight: rate.minWeight,
      maxWeight: rate.maxWeight,
      minOrderValue: rate.minOrderValue,
      maxOrderValue: rate.maxOrderValue,
      isActive: rate.isActive,
    })
    setRateDialogOpen(true)
  }

  const openCreateShipment = () => {
    resetShipmentForm()
    fetchAvailableOrders()
    setCreateShipmentOpen(true)
  }

  const toggleRegion = (region: string) => {
    setZoneForm(prev => ({
      ...prev,
      regions: prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region],
    }))
  }

  const getNextStatus = (currentStatus: string): string[] => {
    const idx = STATUS_FLOW.indexOf(currentStatus)
    if (idx >= 0 && idx < STATUS_FLOW.length - 1) {
      return STATUS_FLOW.slice(idx + 1)
    }
    if (currentStatus === 'failed') return ['picked_up', 'in_transit', 'out_for_delivery', 'delivered']
    if (currentStatus === 'returned') return ['picked_up', 'in_transit', 'out_for_delivery', 'delivered']
    return []
  }

  const copyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking)
    toast({ title: 'Copied!', description: 'Tracking number copied to clipboard' })
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Shipping
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage shipping zones, rates, and track shipments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => { resetZoneForm(); setEditingZone(null); setZoneDialogOpen(true) }}
            className="btn-gradient text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Zone
          </Button>
          <Button
            onClick={openCreateShipment}
            variant="outline"
            className="border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <Package className="w-4 h-4 mr-1.5" />
            New Shipment
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="card-premium animate-card-entrance stagger-1 hover-lift border-t-2 border-t-blue-500 stat-glow-green">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Active Zones</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.activeZones}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="card-premium animate-card-entrance stagger-2 hover-lift border-t-2 border-t-blue-500 stat-glow-sky">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Shipping Rates</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.totalRates}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="card-premium animate-card-entrance stagger-3 hover-lift border-t-2 border-t-indigo-500 stat-glow-violet">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Transit</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.inTransit}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="card-premium animate-card-entrance stagger-4 hover-lift border-t-2 border-t-green-500 stat-glow-green">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Delivered This Month</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.deliveredThisMonth}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="zones" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <MapPin className="w-4 h-4 mr-1.5" />
            Shipping Zones
          </TabsTrigger>
          <TabsTrigger value="shipments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Package className="w-4 h-4 mr-1.5" />
            Shipments
          </TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones" className="mt-4">
          {zones.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No shipping zones yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first shipping zone to start managing delivery rates</p>
                <Button
                  onClick={() => { resetZoneForm(); setEditingZone(null); setZoneDialogOpen(true) }}
                  className="btn-gradient text-white"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Zone
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {zones.map((zone) => {
                const isExpanded = expandedZone === zone.id
                const regionsList = JSON.parse(zone.regions || '[]') as string[]
                return (
                  <motion.div
                    key={zone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={`card-premium animate-card-entrance hover-lift transition-all duration-200 ${!zone.isActive ? 'opacity-60' : ''}`}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                          >
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold">{zone.name}</CardTitle>
                              <Badge variant={zone.isActive ? 'default' : 'secondary'} className={`text-[10px] ${zone.isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : ''}`}>
                                {zone.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {regionsList.length} region{regionsList.length !== 1 ? 's' : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {zone.rates?.length || 0} rate{(zone.rates?.length || 0) !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {regionsList.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {regionsList.slice(0, 5).map(r => (
                                  <Badge key={r} variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                    {r}
                                  </Badge>
                                ))}
                                {regionsList.length > 5 && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                    +{regionsList.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleZoneActive(zone)}>
                              <div className={`w-2 h-2 rounded-full ${zone.isActive ? 'bg-blue-500' : 'bg-gray-400'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditZone(zone)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteZone(zone.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpandedZone(isExpanded ? null : zone.id)}>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <CardContent className="px-4 pb-4 pt-2">
                              <div className="border-t border-border pt-3">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-medium text-foreground">Shipping Rates</h4>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                    onClick={() => openAddRate(zone.id)}
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Rate
                                  </Button>
                                </div>
                                {(!zone.rates || zone.rates.length === 0) ? (
                                  <p className="text-xs text-muted-foreground text-center py-4">No rates configured for this zone</p>
                                ) : (
                                  <div className="space-y-2">
                                    {zone.rates.map((rate) => (
                                      <div
                                        key={rate.id}
                                        className={`flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 ${!rate.isActive ? 'opacity-50' : ''}`}
                                      >
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{rate.name}</span>
                                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                              {rate.priceType === 'flat' ? 'Flat Rate' : rate.priceType === 'weight_based' ? 'Weight Based' : 'Price Based'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(rate.rate)}</span>
                                            {rate.freeAbove && <span>Free above {formatCurrency(rate.freeAbove)}</span>}
                                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{rate.estimatedDays} days</span>
                                          </div>
                                          {rate.priceType === 'weight_based' && (rate.minWeight || rate.maxWeight) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                              Weight: {rate.minWeight || 0}kg - {rate.maxWeight || '∞'}kg
                                            </p>
                                          )}
                                          {rate.priceType === 'price_based' && (rate.minOrderValue || rate.maxOrderValue) && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                              Order: {rate.minOrderValue ? formatCurrency(rate.minOrderValue) : '₹0'} - {rate.maxOrderValue ? formatCurrency(rate.maxOrderValue) : '∞'}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditRate(rate)}>
                                            <Edit2 className="w-3 h-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteRate(rate.id)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="mt-4">
          <Card>
            <CardHeader className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tracking #, order #, customer..."
                    value={shipmentSearch}
                    onChange={(e) => setShipmentSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Select value={shipmentStatusFilter} onValueChange={setShipmentStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(SHIPMENT_STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {shipments.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No shipments found</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {shipmentSearch || shipmentStatusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first shipment to start tracking deliveries'}
                  </p>
                  {!shipmentSearch && shipmentStatusFilter === 'all' && (
                    <Button
                      onClick={openCreateShipment}
                      className="btn-gradient text-white"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      New Shipment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-t border-b border-border bg-muted/30">
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Tracking #</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Order #</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden sm:table-cell">Customer</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden md:table-cell">Carrier</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Method</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-3 hidden lg:table-cell">Shipped</th>
                        <th className="text-right text-xs font-medium text-muted-foreground p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shipments.map((shipment, idx) => {
                        const statusCfg = SHIPMENT_STATUS_CONFIG[shipment.status] || SHIPMENT_STATUS_CONFIG.label_created
                        const StatusIcon = statusCfg.icon
                        return (
                          <tr
                            key={shipment.id}
                            className={`border-b border-border cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}
                            onClick={() => handleViewShipment(shipment)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono text-blue-600 dark:text-blue-400">{shipment.trackingNumber || '—'}</span>
                                {shipment.trackingNumber && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyTracking(shipment.trackingNumber!) }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-blue-600"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-sm">{shipment.order?.orderNumber || '—'}</td>
                            <td className="p-3 text-sm hidden sm:table-cell">{shipment.order?.customerName || '—'}</td>
                            <td className="p-3 text-sm hidden md:table-cell">{shipment.carrier || '—'}</td>
                            <td className="p-3 text-sm hidden lg:table-cell">{shipment.shippingMethod || '—'}</td>
                            <td className="p-3">
                              <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0 text-[10px] font-medium`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusCfg.label}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(shipment.shippedAt)}</td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-blue-600 dark:text-blue-400"
                                onClick={(e) => { e.stopPropagation(); handleViewShipment(shipment) }}
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={(open) => { setZoneDialogOpen(open); if (!open) { setEditingZone(null); resetZoneForm() } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Shipping Zone' : 'Create Shipping Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Zone Name *</Label>
              <Input
                placeholder="e.g., Domestic - North India"
                value={zoneForm.name}
                onChange={(e) => setZoneForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Regions *</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setZoneForm(prev => ({ ...prev, regions: [...INDIAN_STATES] }))}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setZoneForm(prev => ({ ...prev, regions: [] }))}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {INDIAN_STATES.map(state => (
                    <label key={state} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zoneForm.regions.includes(state)}
                        onChange={() => toggleRegion(state)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {state}
                    </label>
                  ))}
                </div>
              </div>
              {zoneForm.regions.length > 0 && (
                <p className="text-xs text-muted-foreground">{zoneForm.regions.length} region(s) selected</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={zoneForm.isActive} onCheckedChange={(checked) => setZoneForm(prev => ({ ...prev, isActive: checked }))} />
              <Label>Active</Label>
            </div>

            {/* Inline rates for new zone */}
            {!editingZone && (
              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Shipping Rates</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    onClick={() => setZoneRates(prev => [...prev, { name: '', priceType: 'flat', rate: 0, estimatedDays: '3-5', freeAbove: null, minWeight: null, maxWeight: null, minOrderValue: null, maxOrderValue: null, isActive: true }])}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Rate
                  </Button>
                </div>
                {zoneRates.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No rates added yet. You can add rates after creating the zone too.</p>
                )}
                {zoneRates.map((r, idx) => (
                  <div key={idx} className="p-3 border border-border rounded-lg space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Rate {idx + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setZoneRates(prev => prev.filter((_, i) => i !== idx))}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="Rate name" value={r.name} onChange={(e) => setZoneRates(prev => prev.map((item, i) => i === idx ? { ...item, name: e.target.value } : item))} className="h-8 text-xs" />
                      <Select value={r.priceType} onValueChange={(val) => setZoneRates(prev => prev.map((item, i) => i === idx ? { ...item, priceType: val } : item))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat">Flat Rate</SelectItem>
                          <SelectItem value="weight_based">Weight Based</SelectItem>
                          <SelectItem value="price_based">Price Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Rate (₹)" type="number" value={r.rate || ''} onChange={(e) => setZoneRates(prev => prev.map((item, i) => i === idx ? { ...item, rate: Number(e.target.value) } : item))} className="h-8 text-xs" />
                      <Input placeholder="Days (e.g. 3-5)" value={r.estimatedDays} onChange={(e) => setZoneRates(prev => prev.map((item, i) => i === idx ? { ...item, estimatedDays: e.target.value } : item))} className="h-8 text-xs" />
                      <Input placeholder="Free above (₹)" type="number" value={r.freeAbove || ''} onChange={(e) => setZoneRates(prev => prev.map((item, i) => i === idx ? { ...item, freeAbove: e.target.value ? Number(e.target.value) : null } : item))} className="h-8 text-xs" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setZoneDialogOpen(false); setEditingZone(null); resetZoneForm() }}>Cancel</Button>
            <Button
              onClick={editingZone ? handleUpdateZone : handleCreateZone}
              disabled={!zoneForm.name || zoneForm.regions.length === 0}
              className="btn-gradient text-white"
            >
              {editingZone ? 'Update Zone' : 'Create Zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Rate Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={(open) => { setRateDialogOpen(open); if (!open) { setEditingRate(null); resetRateForm() } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Edit Shipping Rate' : 'Add Shipping Rate'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Rate Name *</Label>
              <Input placeholder="e.g., Standard, Express" value={rateForm.name} onChange={(e) => setRateForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Price Type *</Label>
                <Select value={rateForm.priceType} onValueChange={(val) => setRateForm(prev => ({ ...prev, priceType: val }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="weight_based">Weight Based</SelectItem>
                    <SelectItem value="price_based">Price Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rate Amount (₹) *</Label>
                <Input type="number" placeholder="0" value={rateForm.rate || ''} onChange={(e) => setRateForm(prev => ({ ...prev, rate: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estimated Days</Label>
                <Input placeholder="3-5" value={rateForm.estimatedDays} onChange={(e) => setRateForm(prev => ({ ...prev, estimatedDays: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Free Shipping Above (₹)</Label>
                <Input type="number" placeholder="Optional" value={rateForm.freeAbove || ''} onChange={(e) => setRateForm(prev => ({ ...prev, freeAbove: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            {rateForm.priceType === 'weight_based' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Weight (kg)</Label>
                  <Input type="number" placeholder="0" value={rateForm.minWeight || ''} onChange={(e) => setRateForm(prev => ({ ...prev, minWeight: e.target.value ? Number(e.target.value) : null }))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input type="number" placeholder="∞" value={rateForm.maxWeight || ''} onChange={(e) => setRateForm(prev => ({ ...prev, maxWeight: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
            )}
            {rateForm.priceType === 'price_based' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Min Order Value (₹)</Label>
                  <Input type="number" placeholder="0" value={rateForm.minOrderValue || ''} onChange={(e) => setRateForm(prev => ({ ...prev, minOrderValue: e.target.value ? Number(e.target.value) : null }))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Order Value (₹)</Label>
                  <Input type="number" placeholder="∞" value={rateForm.maxOrderValue || ''} onChange={(e) => setRateForm(prev => ({ ...prev, maxOrderValue: e.target.value ? Number(e.target.value) : null }))} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={rateForm.isActive} onCheckedChange={(checked) => setRateForm(prev => ({ ...prev, isActive: checked }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRateDialogOpen(false); setEditingRate(null); resetRateForm() }}>Cancel</Button>
            <Button
              onClick={editingRate ? handleUpdateRate : handleCreateRate}
              disabled={!rateForm.name || !rateForm.rate}
              className="btn-gradient text-white"
            >
              {editingRate ? 'Update Rate' : 'Add Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shipment Dialog */}
      <Dialog open={createShipmentOpen} onOpenChange={(open) => { setCreateShipmentOpen(open); if (!open) resetShipmentForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Order *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9 h-9 mb-2"
                />
              </div>
              <Select value={shipmentForm.orderId} onValueChange={(val) => setShipmentForm(prev => ({ ...prev, orderId: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {availableOrders
                    .filter(o => !orderSearch || o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerName.toLowerCase().includes(orderSearch.toLowerCase()))
                    .map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        <span className="font-mono">{o.orderNumber}</span> — {o.customerName} ({formatCurrency(o.total)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Carrier</Label>
                <Select value={shipmentForm.carrier} onValueChange={(val) => setShipmentForm(prev => ({ ...prev, carrier: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <Select value={shipmentForm.shippingMethod} onValueChange={(val) => setShipmentForm(prev => ({ ...prev, shippingMethod: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Express">Express</SelectItem>
                    <SelectItem value="Overnight">Overnight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Weight (kg)</Label>
              <Input type="number" placeholder="Package weight" value={shipmentForm.weight || ''} onChange={(e) => setShipmentForm(prev => ({ ...prev, weight: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div className="space-y-2">
              <Label>Dimensions (cm)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Length" value={shipmentForm.length || ''} onChange={(e) => setShipmentForm(prev => ({ ...prev, length: e.target.value ? Number(e.target.value) : null }))} />
                <Input type="number" placeholder="Width" value={shipmentForm.width || ''} onChange={(e) => setShipmentForm(prev => ({ ...prev, width: e.target.value ? Number(e.target.value) : null }))} />
                <Input type="number" placeholder="Height" value={shipmentForm.height || ''} onChange={(e) => setShipmentForm(prev => ({ ...prev, height: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={shipmentForm.notes} onChange={(e) => setShipmentForm(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateShipmentOpen(false); resetShipmentForm() }}>Cancel</Button>
            <Button
              onClick={handleCreateShipment}
              disabled={!shipmentForm.orderId}
              className="btn-gradient text-white"
            >
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Detail Dialog */}
      <Dialog open={shipmentDetailOpen} onOpenChange={setShipmentDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipment Details</DialogTitle>
          </DialogHeader>
          {selectedShipment && (
            <div className="space-y-6 mt-4">
              {/* Shipment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tracking Number</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-mono font-medium">{selectedShipment.trackingNumber || '—'}</span>
                    {selectedShipment.trackingNumber && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyTracking(selectedShipment.trackingNumber!)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Carrier</p>
                  <p className="text-sm font-medium mt-1">{selectedShipment.carrier || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Shipping Method</p>
                  <p className="text-sm font-medium mt-1">{selectedShipment.shippingMethod || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {(() => {
                      const cfg = SHIPMENT_STATUS_CONFIG[selectedShipment.status] || SHIPMENT_STATUS_CONFIG.label_created
                      const Icon = cfg.icon
                      return (
                        <Badge className={`${cfg.bgColor} ${cfg.color} border-0 text-xs`}>
                          <Icon className="w-3.5 h-3.5 mr-1" />
                          {cfg.label}
                        </Badge>
                      )
                    })()}
                  </div>
                </div>
                {selectedShipment.weight && (
                  <div>
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-sm font-medium mt-1">{selectedShipment.weight} kg</p>
                  </div>
                )}
                {selectedShipment.shippedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Shipped Date</p>
                    <p className="text-sm font-medium mt-1">{formatDate(selectedShipment.shippedAt)}</p>
                  </div>
                )}
                {selectedShipment.deliveredAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered Date</p>
                    <p className="text-sm font-medium mt-1">{formatDate(selectedShipment.deliveredAt)}</p>
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-2">Order Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Order Number</p>
                    <p className="text-sm font-medium mt-0.5">{selectedShipment.order?.orderNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="text-sm font-medium mt-0.5">{selectedShipment.order?.customerName || '—'}</p>
                  </div>
                  {selectedShipment.order?.customerEmail && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm mt-0.5">{selectedShipment.order.customerEmail}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Order Total</p>
                    <p className="text-sm font-medium mt-0.5">{formatCurrency(selectedShipment.order?.total || 0)}</p>
                  </div>
                </div>
                {selectedShipment.order?.items && selectedShipment.order.items.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Items</p>
                    {selectedShipment.order.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs">
                        <span>{item.name} × {item.quantity}</span>
                        <span className="text-muted-foreground">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tracking Timeline */}
              {shipmentTimeline.length > 0 && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-3">Tracking Timeline</h4>
                  <div className="relative">
                    {shipmentTimeline.map((step, idx) => (
                      <div key={step.key} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            step.completed
                              ? step.current
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {step.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            )}
                          </div>
                          {idx < shipmentTimeline.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-1 ${step.completed ? 'bg-blue-300 dark:bg-blue-700' : 'bg-border'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                            {step.current && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0 text-[10px]">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{step.description}</p>
                          {step.timestamp && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(step.timestamp).toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Update Status */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-2">Update Status</h4>
                <div className="flex items-center gap-2 flex-wrap">
                  {getNextStatus(selectedShipment.status).map(status => {
                    const cfg = SHIPMENT_STATUS_CONFIG[status]
                    if (!cfg) return null
                    const Icon = cfg.icon
                    return (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        onClick={() => handleUpdateShipmentStatus(selectedShipment.id, status)}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {cfg.label}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )
                  })}
                  {(selectedShipment.status !== 'failed' && selectedShipment.status !== 'returned' && selectedShipment.status !== 'delivered') && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        onClick={() => handleUpdateShipmentStatus(selectedShipment.id, 'failed')}
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Mark Failed
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                        onClick={() => handleUpdateShipmentStatus(selectedShipment.id, 'returned')}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Mark Returned
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedShipment.notes && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedShipment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
