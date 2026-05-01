'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Palette, Globe, Coins, AlertTriangle,
  Save, Loader2, ImageIcon, Check, Store, Bell, ShoppingCart,
  Package, Star, FileText, Mail
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface StoreSettings {
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  theme: string
  primaryColor: string
  currency: string
  domain: string
  isActive: boolean
}

interface NotificationPreferences {
  id: string
  storeId: string
  newOrderEmail: boolean
  orderStatusEmail: boolean
  paymentReceivedEmail: boolean
  lowStockEmail: boolean
  lowStockThreshold: number
  reviewEmail: boolean
  abandonedCartEmail: boolean
  abandonedCartReminderDelay: number
  weeklyReportEmail: boolean
  monthlyReportEmail: boolean
  newsletterEmail: boolean
  reportEmail: string
}

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
]

const THEME_OPTIONS = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, white space',
    preview: (
      <div className="w-full h-20 rounded-md border bg-white p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-gray-100 rounded-sm w-full flex items-center px-1">
          <div className="h-1 w-4 bg-gray-300 rounded-full" />
          <div className="h-1 w-6 bg-gray-200 rounded-full ml-2" />
          <div className="h-1 w-5 bg-gray-200 rounded-full ml-auto" />
        </div>
        <div className="h-5 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-sm flex items-center justify-center">
          <div className="h-1 w-8 bg-emerald-300 rounded-full" />
        </div>
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-gray-50 rounded-sm" />
          <div className="flex-1 bg-gray-50 rounded-sm" />
          <div className="flex-1 bg-gray-50 rounded-sm" />
        </div>
      </div>
    )
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional, warm colors',
    preview: (
      <div className="w-full h-20 rounded-md border bg-amber-50 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-amber-100 rounded-sm w-full flex items-center px-1">
          <div className="h-1 w-4 bg-amber-600 rounded-full" />
          <div className="h-1 w-6 bg-amber-400 rounded-full ml-2" />
          <div className="h-1 w-5 bg-amber-400 rounded-full ml-auto" />
        </div>
        <div className="h-5 bg-gradient-to-r from-amber-200 to-amber-300 rounded-sm flex items-center justify-center">
          <div className="h-1 w-8 bg-amber-700 rounded-full" />
        </div>
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-amber-100 rounded-sm" />
          <div className="flex-1 bg-amber-100 rounded-sm" />
          <div className="flex-1 bg-amber-100 rounded-sm" />
        </div>
      </div>
    )
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean, thin lines',
    preview: (
      <div className="w-full h-20 rounded-md border bg-white p-1.5 flex flex-col gap-1">
        <div className="h-2 flex items-center px-1 border-b">
          <div className="h-0.5 w-4 bg-gray-400 rounded-full" />
          <div className="h-0.5 w-6 bg-gray-200 rounded-full ml-2" />
          <div className="h-0.5 w-5 bg-gray-200 rounded-full ml-auto" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-0.5 w-10 bg-gray-300 rounded-full" />
        </div>
        <div className="flex gap-2 flex-1 items-center justify-center">
          <div className="w-5 h-5 border rounded-sm" />
          <div className="w-5 h-5 border rounded-sm" />
          <div className="w-5 h-5 border rounded-sm" />
        </div>
      </div>
    )
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong colors, large text',
    preview: (
      <div className="w-full h-20 rounded-md border bg-gray-900 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-gray-800 rounded-sm w-full flex items-center px-1">
          <div className="h-1.5 w-5 bg-emerald-400 rounded-sm" />
          <div className="h-1 w-6 bg-gray-500 rounded-full ml-2" />
          <div className="h-1 w-5 bg-gray-500 rounded-full ml-auto" />
        </div>
        <div className="h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-sm flex items-center justify-center">
          <div className="h-1.5 w-10 bg-white rounded-full" />
        </div>
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-gray-800 rounded-sm" />
          <div className="flex-1 bg-gray-800 rounded-sm" />
          <div className="flex-1 bg-gray-800 rounded-sm" />
        </div>
      </div>
    )
  },
]

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
]

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'America/New_York', label: 'America/New_York (EST -5:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT +0:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
]

export default function StoreSettings() {
  const { currentStore, setStore } = useAppStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  const [settings, setSettings] = useState<StoreSettings>({
    name: '',
    slug: '',
    description: '',
    logo: '',
    banner: '',
    theme: 'modern',
    primaryColor: '#10b981',
    currency: 'INR',
    domain: '',
    isActive: true,
  })

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const fetchStoreDetails = useCallback(async () => {
    if (!currentStore?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        const s = data.store
        setSettings({
          name: s.name || '',
          slug: s.slug || '',
          description: s.description || '',
          logo: s.logo || '',
          banner: s.banner || '',
          theme: s.theme || 'modern',
          primaryColor: s.primaryColor || '#10b981',
          currency: s.currency || 'INR',
          domain: s.domain || '',
          isActive: s.isActive ?? true,
        })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load store settings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentStore?.id, toast])

  useEffect(() => {
    fetchStoreDetails()
  }, [fetchStoreDetails])

  const fetchNotificationPrefs = useCallback(async () => {
    if (!currentStore?.id) return
    setNotifLoading(true)
    try {
      const res = await fetch(`/api/notification-preferences?storeId=${currentStore.id}`)
      if (res.ok) {
        const data = await res.json()
        setNotifPrefs(data.preferences)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load notification preferences', variant: 'destructive' })
    } finally {
      setNotifLoading(false)
    }
  }, [currentStore?.id, toast])

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotificationPrefs()
    }
  }, [activeTab, fetchNotificationPrefs])

  const saveNotificationPref = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!currentStore?.id) return
    setNotifSaving(true)
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: currentStore.id, ...updates }),
      })
      if (res.ok) {
        const data = await res.json()
        setNotifPrefs(data.preferences)
        toast({ title: 'Preferences saved', description: 'Your notification preferences have been updated.' })
      } else {
        toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' })
    } finally {
      setNotifSaving(false)
    }
  }, [currentStore?.id, toast])

  const handleNotifChange = useCallback((updates: Partial<NotificationPreferences>) => {
    setNotifPrefs(prev => prev ? { ...prev, ...updates } : null)
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      saveNotificationPref(updates)
    }, 500)
    setDebounceTimer(timer)
  }, [debounceTimer, saveNotificationPref])

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    setSettings(prev => ({ ...prev, name, slug }))
  }

  const saveSettings = async (partial?: Partial<StoreSettings>) => {
    if (!currentStore?.id) return
    setSaving(true)
    try {
      const dataToSave = partial || settings
      const res = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })
      if (res.ok) {
        const data = await res.json()
        setStore(data.store)
        if (partial) {
          setSettings(prev => ({ ...prev, ...partial }))
        }
        toast({ title: 'Settings saved', description: 'Your store settings have been updated.' })
      } else {
        const error = await res.json()
        toast({ title: 'Error', description: error.error || 'Failed to save settings', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStore = async () => {
    if (!currentStore?.id) return
    try {
      const res = await fetch(`/api/stores/${currentStore.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Store deleted', description: 'Your store has been permanently deleted.' })
        setStore(null)
      } else {
        toast({ title: 'Error', description: 'Failed to delete store', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete store', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-96" />
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your store preferences and branding</p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="general" className="gap-1.5">
              <Settings className="w-3.5 h-3.5 hidden sm:block" />
              General
            </TabsTrigger>
            <TabsTrigger value="theme" className="gap-1.5">
              <Palette className="w-3.5 h-3.5 hidden sm:block" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="domain" className="gap-1.5">
              <Globe className="w-3.5 h-3.5 hidden sm:block" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-1.5">
              <Coins className="w-3.5 h-3.5 hidden sm:block" />
              Regional
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="w-3.5 h-3.5 hidden sm:block" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="danger" className="gap-1.5 text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 hidden sm:block" />
              Danger
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* General Settings */}
        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" />
                  General Settings
                </CardTitle>
                <CardDescription>Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="store-name">Store Name</Label>
                    <Input
                      id="store-name"
                      value={settings.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="My Awesome Store"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-slug">Store Slug</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                        onlinevepar.com/
                      </span>
                      <Input
                        id="store-slug"
                        value={settings.slug}
                        onChange={(e) => setSettings(prev => ({ ...prev, slug: e.target.value }))}
                        className="rounded-l-none"
                        placeholder="my-store"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-description">Store Description</Label>
                  <Textarea
                    id="store-description"
                    value={settings.description}
                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell customers about your store..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="store-logo">Logo URL</Label>
                    <Input
                      id="store-logo"
                      value={settings.logo}
                      onChange={(e) => setSettings(prev => ({ ...prev, logo: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                    {settings.logo && (
                      <div className="mt-2 p-3 bg-muted rounded-lg inline-block">
                        <img
                          src={settings.logo}
                          alt="Store logo preview"
                          className="h-12 w-12 object-contain rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-banner">Banner URL</Label>
                    <Input
                      id="store-banner"
                      value={settings.banner}
                      onChange={(e) => setSettings(prev => ({ ...prev, banner: e.target.value }))}
                      placeholder="https://example.com/banner.jpg"
                    />
                    {settings.banner && (
                      <div className="mt-2 p-2 bg-muted rounded-lg">
                        <img
                          src={settings.banner}
                          alt="Store banner preview"
                          className="h-16 w-full object-cover rounded"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {!settings.logo && !settings.banner && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No logo uploaded</p>
                      <p className="text-xs">Enter a URL above</p>
                    </div>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No banner uploaded</p>
                      <p className="text-xs">Enter a URL above</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Store Active</Label>
                    <p className="text-sm text-muted-foreground">
                      When active, your store is visible to customers
                    </p>
                  </div>
                  <Switch
                    checked={settings.isActive}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Theme & Appearance */}
        <TabsContent value="theme">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-emerald-600" />
                  Theme & Appearance
                </CardTitle>
                <CardDescription>Customize how your store looks to customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Theme Selector */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Choose Theme</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {THEME_OPTIONS.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => setSettings(prev => ({ ...prev, theme: theme.id }))}
                        className={`relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                          settings.theme === theme.id
                            ? 'border-emerald-500 ring-2 ring-emerald-200'
                            : 'border-muted hover:border-emerald-300'
                        }`}
                      >
                        {settings.theme === theme.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {theme.preview}
                        <div className="mt-2">
                          <p className="text-sm font-medium">{theme.name}</p>
                          <p className="text-xs text-muted-foreground">{theme.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Primary Color */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Primary Color</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                      <Input
                        value={settings.primaryColor}
                        onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-32 font-mono"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Quick select:</p>
                    <div className="flex flex-wrap gap-3">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSettings(prev => ({ ...prev, primaryColor: color.value }))}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                            settings.primaryColor === color.value
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : 'border-muted hover:border-emerald-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-xs font-medium">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Mini Live Preview */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Live Preview</Label>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    {/* Header */}
                    <div
                      className="px-4 py-3 flex items-center justify-between"
                      style={{
                        backgroundColor: settings.theme === 'bold' ? '#1f2937' : '#fff',
                        borderBottom: settings.theme === 'minimal' ? '1px solid #e5e7eb' : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {settings.logo ? (
                          <img src={settings.logo} alt="" className="h-6 w-6 rounded" />
                        ) : (
                          <Store className="w-5 h-5" style={{ color: settings.primaryColor }} />
                        )}
                        <span
                          className="font-semibold text-sm"
                          style={{ color: settings.theme === 'bold' ? '#fff' : '#111' }}
                        >
                          {settings.name || 'Your Store'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Home</span>
                        <span className="text-xs text-muted-foreground">Shop</span>
                        <span className="text-xs text-muted-foreground">About</span>
                      </div>
                    </div>
                    {/* Hero */}
                    <div
                      className="px-4 py-8 text-center"
                      style={{
                        background: `linear-gradient(135deg, ${settings.primaryColor}20, ${settings.primaryColor}40)`,
                      }}
                    >
                      <h3
                        className="font-bold text-lg mb-1"
                        style={{ color: settings.theme === 'bold' ? '#fff' : '#111' }}
                      >
                        {settings.name || 'Your Store'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {settings.description || 'Welcome to our store'}
                      </p>
                      <button
                        className="mt-3 px-4 py-1.5 text-white text-xs rounded-md font-medium"
                        style={{ backgroundColor: settings.primaryColor }}
                      >
                        Shop Now
                      </button>
                    </div>
                    {/* Products Grid */}
                    <div className="p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-3">Featured Products</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="rounded border p-2">
                            <div
                              className="h-10 rounded mb-1.5"
                              style={{ backgroundColor: `${settings.primaryColor}15` }}
                            />
                            <div className="h-1.5 w-12 bg-gray-200 rounded-full mb-1" />
                            <div
                              className="h-1.5 w-8 rounded-full"
                              style={{ backgroundColor: settings.primaryColor }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings()}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Domain & URL */}
        <TabsContent value="domain">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  Domain & URL
                </CardTitle>
                <CardDescription>Manage your store domain and URL settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Default Store Domain</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium">
                      {settings.slug || 'your-store'}.onlinevepar.com
                    </span>
                    <Badge variant="secondary" className="ml-auto">Default</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This is your store&apos;s default domain. All your products and pages are accessible through this URL.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <Input
                    id="custom-domain"
                    value={settings.domain}
                    onChange={(e) => setSettings(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="www.yourstore.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your custom domain name. You&apos;ll need to configure DNS settings with your domain registrar.
                  </p>
                </div>

                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2">DNS Configuration Instructions</h4>
                    <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                      <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                      <li>Add a CNAME record pointing to <code className="bg-amber-100 px-1 rounded">cname.onlinevepar.com</code></li>
                      <li>Wait for DNS propagation (up to 48 hours)</li>
                      <li>Enter your domain above and save</li>
                    </ol>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings({ domain: settings.domain })}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Domain
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Currency & Regional */}
        <TabsContent value="currency">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600" />
                  Currency & Regional
                </CardTitle>
                <CardDescription>Set your store&apos;s currency and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={settings.currency}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This affects how prices are displayed in your store
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select defaultValue="Asia/Kolkata">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 max-w-xs">
                  <Label>Weight Unit</Label>
                  <Select defaultValue="kg">
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="lb">Pounds (lb)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveSettings({ currency: settings.currency })}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Regional Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {notifLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : notifPrefs ? (
              <>
                {/* Notification Preview */}
                <Card className="card-gradient-emerald border-emerald-200 dark:border-emerald-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bell className="w-4 h-4 text-emerald-600" />
                      Notification Preview
                    </CardTitle>
                    <CardDescription>This is what a sample notification email looks like</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-background p-4 space-y-3">
                      <div className="flex items-center gap-2 border-b pb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Online Vepar</p>
                          <p className="text-xs text-muted-foreground">noreply@onlinevepar.com</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">🎉 New Order Received!</p>
                        <p className="text-xs text-muted-foreground">You have a new order #OV-1234 from Priya Sharma worth ₹2,499.</p>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="inline-block rounded-md bg-emerald-600 px-3 py-1.5 text-xs text-white font-medium">
                          View Order Details
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        You are receiving this because you enabled order notifications.{' '}
                        <span className="text-emerald-600">Manage preferences</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      Order Notifications
                    </CardTitle>
                    <CardDescription>Configure email notifications for order events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">New order notifications</Label>
                        <p className="text-xs text-muted-foreground">Get notified when a new order is placed</p>
                      </div>
                      <div className="data-[state=checked]:bg-emerald-600">
                        <Switch
                          checked={notifPrefs.newOrderEmail}
                          onCheckedChange={(checked) => handleNotifChange({ newOrderEmail: checked })}
                          disabled={notifSaving}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Order status updates</Label>
                        <p className="text-xs text-muted-foreground">Receive updates when order status changes</p>
                      </div>
                      <Switch
                        checked={notifPrefs.orderStatusEmail}
                        onCheckedChange={(checked) => handleNotifChange({ orderStatusEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Payment received</Label>
                        <p className="text-xs text-muted-foreground">Get notified when payment is received</p>
                      </div>
                      <Switch
                        checked={notifPrefs.paymentReceivedEmail}
                        onCheckedChange={(checked) => handleNotifChange({ paymentReceivedEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Inventory Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      Inventory Alerts
                    </CardTitle>
                    <CardDescription>Get alerts about your product inventory levels</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Low stock alerts</Label>
                        <p className="text-xs text-muted-foreground">Get alerts when products are running low</p>
                      </div>
                      <Switch
                        checked={notifPrefs.lowStockEmail}
                        onCheckedChange={(checked) => handleNotifChange({ lowStockEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    {notifPrefs.lowStockEmail && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Low stock threshold</Label>
                            <p className="text-xs text-muted-foreground">Alert when stock falls below this number</p>
                          </div>
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={notifPrefs.lowStockThreshold}
                            onChange={(e) => handleNotifChange({ lowStockThreshold: parseInt(e.target.value) || 5 })}
                            className="w-20 text-center"
                            disabled={notifSaving}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Marketing & Reviews */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-emerald-600" />
                      Marketing &amp; Reviews
                    </CardTitle>
                    <CardDescription>Manage customer engagement notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">New review notifications</Label>
                        <p className="text-xs text-muted-foreground">Get notified when customers leave reviews</p>
                      </div>
                      <Switch
                        checked={notifPrefs.reviewEmail}
                        onCheckedChange={(checked) => handleNotifChange({ reviewEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Abandoned cart reminders</Label>
                        <p className="text-xs text-muted-foreground">Send reminders to customers with abandoned carts</p>
                      </div>
                      <Switch
                        checked={notifPrefs.abandonedCartEmail}
                        onCheckedChange={(checked) => handleNotifChange({ abandonedCartEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    {notifPrefs.abandonedCartEmail && (
                      <>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Reminder delay (hours)</Label>
                            <p className="text-xs text-muted-foreground">Hours to wait before sending reminder</p>
                          </div>
                          <Input
                            type="number"
                            min={1}
                            max={168}
                            value={notifPrefs.abandonedCartReminderDelay}
                            onChange={(e) => handleNotifChange({ abandonedCartReminderDelay: parseInt(e.target.value) || 24 })}
                            className="w-20 text-center"
                            disabled={notifSaving}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-600" />
                      Reports
                    </CardTitle>
                    <CardDescription>Configure report and newsletter email preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Weekly summary report</Label>
                        <p className="text-xs text-muted-foreground">Receive a weekly performance summary</p>
                      </div>
                      <Switch
                        checked={notifPrefs.weeklyReportEmail}
                        onCheckedChange={(checked) => handleNotifChange({ weeklyReportEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Monthly analytics report</Label>
                        <p className="text-xs text-muted-foreground">Receive detailed monthly analytics</p>
                      </div>
                      <Switch
                        checked={notifPrefs.monthlyReportEmail}
                        onCheckedChange={(checked) => handleNotifChange({ monthlyReportEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <Label className="text-sm font-medium">Report email address</Label>
                      </div>
                      <p className="text-xs text-muted-foreground">Reports will be sent to this email address</p>
                      <Input
                        type="email"
                        value={notifPrefs.reportEmail || ''}
                        onChange={(e) => handleNotifChange({ reportEmail: e.target.value })}
                        placeholder="Email address for reports (defaults to your account email)"
                        disabled={notifSaving}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Newsletter</Label>
                        <p className="text-xs text-muted-foreground">Receive product updates and tips</p>
                      </div>
                      <Switch
                        checked={notifPrefs.newsletterEmail}
                        onCheckedChange={(checked) => handleNotifChange({ newsletterEmail: checked })}
                        disabled={notifSaving}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                    </div>
                  </CardContent>
                </Card>

                {notifSaving && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 pulse-glow rounded-lg px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 w-fit">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving preferences...
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Unable to load notification preferences</p>
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your store permanently
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                  <h3 className="text-sm font-semibold text-destructive mb-2">Delete Store</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your store, there is no going back. All products, orders, customers,
                    and pages will be permanently deleted. Please be certain.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Delete Store</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your store
                          &quot;{settings.name}&quot; and all associated data including products, orders,
                          customers, and pages.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteStore}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, delete my store
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
