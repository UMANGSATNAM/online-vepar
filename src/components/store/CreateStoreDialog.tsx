'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Store,
  Loader2,
  Check,
  ArrowLeft,
  Palette,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

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
      <div className="w-full h-16 rounded-md border bg-white dark:bg-gray-900 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-sm w-full flex items-center px-1">
          <div className="h-1 w-4 bg-gray-300 dark:bg-gray-600 rounded-full" />
          <div className="h-1 w-6 bg-gray-200 dark:bg-gray-700 rounded-full ml-2" />
          <div className="h-1 w-5 bg-gray-200 dark:bg-gray-700 rounded-full ml-auto" />
        </div>
        <div className="h-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-sm flex items-center justify-center">
          <div className="h-1 w-6 bg-blue-300 dark:bg-blue-600 rounded-full" />
        </div>
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-sm" />
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-sm" />
          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional, warm',
    preview: (
      <div className="w-full h-16 rounded-md border bg-amber-50 dark:bg-amber-950 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-amber-100 dark:bg-amber-900 rounded-sm w-full flex items-center px-1">
          <div className="h-1 w-4 bg-amber-600 dark:bg-amber-500 rounded-full" />
          <div className="h-1 w-6 bg-amber-400 dark:bg-amber-600 rounded-full ml-2" />
        </div>
        <div className="h-4 bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-800 dark:to-amber-700 rounded-sm" />
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-amber-100 dark:bg-amber-900 rounded-sm" />
          <div className="flex-1 bg-amber-100 dark:bg-amber-900 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean, thin lines',
    preview: (
      <div className="w-full h-16 rounded-md border bg-white dark:bg-gray-950 p-1.5 flex flex-col gap-1">
        <div className="h-2 flex items-center px-1 border-b dark:border-gray-800">
          <div className="h-0.5 w-4 bg-gray-400 dark:bg-gray-600 rounded-full" />
          <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-700 rounded-full ml-2" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        <div className="flex gap-2 flex-1 items-center justify-center">
          <div className="w-4 h-4 border dark:border-gray-700 rounded-sm" />
          <div className="w-4 h-4 border dark:border-gray-700 rounded-sm" />
        </div>
      </div>
    ),
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong, large text',
    preview: (
      <div className="w-full h-16 rounded-md border bg-gray-900 dark:bg-gray-950 p-1.5 flex flex-col gap-1">
        <div className="h-2 bg-gray-800 dark:bg-gray-900 rounded-sm w-full flex items-center px-1">
          <div className="h-1.5 w-4 bg-blue-400 rounded-sm" />
          <div className="h-1 w-6 bg-gray-500 rounded-full ml-2" />
        </div>
        <div className="h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm" />
        <div className="flex gap-0.5 flex-1">
          <div className="flex-1 bg-gray-800 dark:bg-gray-900 rounded-sm" />
          <div className="flex-1 bg-gray-800 dark:bg-gray-900 rounded-sm" />
        </div>
      </div>
    ),
  },
]

const STORE_CATEGORIES = [
  { value: 'fashion', label: 'Fashion & Apparel' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'home-decor', label: 'Home & Decor' },
  { value: 'beauty', label: 'Beauty & Personal Care' },
  { value: 'other', label: 'Other' },
]

export default function CreateStoreDialog() {
  const { setView, setStore, setStores, stores } = useAppStore()
  const { toast } = useToast()
  const [creating, setCreating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    theme: 'modern',
    primaryColor: '#10b981',
  })

  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
    setFormData((prev) => ({ ...prev, name, slug }))
  }

  const handleCreateStore = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Store name is required', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          theme: formData.theme,
          primaryColor: formData.primaryColor,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newStore = {
          id: data.store.id,
          name: data.store.name,
          slug: data.store.slug,
          description: data.store.description,
          logo: data.store.logo,
          banner: data.store.banner,
          theme: data.store.theme,
          primaryColor: data.store.primaryColor,
          currency: data.store.currency,
          domain: data.store.domain,
          isActive: data.store.isActive,
          ownerId: data.store.ownerId,
          createdAt: data.store.createdAt,
          updatedAt: data.store.updatedAt,
        }
        setStores([...stores, newStore])
        setStore(newStore)
        setView('dashboard')
        toast({
          title: 'Store created!',
          description: `"${formData.name}" is ready. Start adding products!`,
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create store',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create store. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground hover:text-foreground"
            onClick={() => setView('dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create New Store</h1>
              <p className="text-muted-foreground mt-0.5">
                Set up a new store for your business
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="store-name">
                    Store Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="store-name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Awesome Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-slug">Store Slug</Label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                      onlinevepar.com/
                    </span>
                    <Input
                      id="store-slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, slug: e.target.value }))
                      }
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
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Tell customers about your store..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-category">Store Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="w-5 h-5 text-blue-600" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose Theme</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, theme: theme.id }))
                      }
                      className={`relative rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                        formData.theme === theme.id
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-muted hover:border-blue-300'
                      }`}
                    >
                      {formData.theme === theme.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {theme.preview}
                      <div className="mt-2">
                        <p className="text-sm font-medium">{theme.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Primary Color */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Primary Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))
                    }
                    className="w-32 font-mono"
                    placeholder="#10b981"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, primaryColor: color.value }))
                      }
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs ${
                        formData.primaryColor === color.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm'
                          : 'border-muted hover:border-blue-300'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setView('dashboard')}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateStore}
              disabled={creating || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 mr-2" />
                  Create Store
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
