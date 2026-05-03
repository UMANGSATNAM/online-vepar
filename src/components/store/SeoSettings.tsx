'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Search, BarChart, Facebook } from 'lucide-react'

export default function SeoSettings() {
  const { currentStore, setStore } = useAppStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    seoTitle: '',
    seoDescription: '',
    googleAnalyticsId: '',
    facebookPixelId: ''
  })

  useEffect(() => {
    if (currentStore) {
      setFormData({
        seoTitle: currentStore.seoTitle || '',
        seoDescription: currentStore.seoDescription || '',
        googleAnalyticsId: currentStore.googleAnalyticsId || '',
        facebookPixelId: currentStore.facebookPixelId || ''
      })
    }
  }, [currentStore])

  const handleSave = async () => {
    if (!currentStore) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setStore(data.store)
      toast({ title: 'Saved', description: 'SEO and Marketing settings updated.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' })
    }
    setLoading(false)
  }

  if (!currentStore) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO & Marketing</h1>
        <p className="text-muted-foreground text-sm mt-1">Optimize your store for search engines and track visitors</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Search Engine Optimization</CardTitle>
          <CardDescription>How your store appears in Google search results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seoTitle">Meta Title</Label>
            <Input 
              id="seoTitle" 
              placeholder={`${currentStore.name} | Official Store`}
              value={formData.seoTitle}
              onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
              maxLength={70}
            />
            <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/70 characters recommended</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seoDescription">Meta Description</Label>
            <Textarea 
              id="seoDescription" 
              placeholder={`Shop the latest products at ${currentStore.name}. Best prices guaranteed.`}
              value={formData.seoDescription}
              onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters recommended</p>
          </div>

          <div className="mt-4 p-4 border rounded-lg bg-muted/30">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Search Preview</p>
            <div className="space-y-1">
              <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl cursor-pointer hover:underline truncate">
                {formData.seoTitle || currentStore.name}
              </p>
              <p className="text-[#006621] dark:text-[#81c995] text-sm">
                https://{currentStore.domain || `${currentStore.slug}.onlinevepar.com`}
              </p>
              <p className="text-[#545454] dark:text-[#bdc1c6] text-sm line-clamp-2">
                {formData.seoDescription || `Welcome to ${currentStore.name} online store. Browse our wide selection of products.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart className="w-5 h-5" /> Tracking & Pixels</CardTitle>
          <CardDescription>Connect third-party analytics and ad tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="ga" className="flex items-center gap-2">
              <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" className="w-4 h-4" alt="GA" />
              Google Analytics ID
            </Label>
            <Input 
              id="ga" 
              placeholder="G-XXXXXXXXXX"
              value={formData.googleAnalyticsId}
              onChange={e => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Used to track visitors and behavior on your storefront.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook (Meta) Pixel ID
            </Label>
            <Input 
              id="fb" 
              placeholder="123456789012345"
              value={formData.facebookPixelId}
              onChange={e => setFormData({ ...formData, facebookPixelId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Used for tracking conversions and retargeting ads on Facebook & Instagram.</p>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/20 px-6 py-4">
          <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
