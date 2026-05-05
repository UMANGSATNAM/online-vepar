'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Layout, Settings, Save, Move, Plus, Trash2, 
  Eye, Monitor, Tablet, Smartphone, ChevronDown, Type, Image as ImageIcon, Sparkles,
  Code, ArrowLeft, UploadCloud
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface SectionData {
  id: string
  type: string
  label: string
  settings: Record<string, any>
}

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Sparkles, defaultSettings: { title: 'Welcome to our store', subtitle: 'Discover amazing products', buttonText: 'Shop Now', height: '600px' } },
  { type: 'slideshow', label: 'Slideshow', icon: ImageIcon, defaultSettings: { slideCount: 3, delay: 5, autoPlay: true } },
  { type: 'categories', label: 'Categories Grid', icon: Layout, defaultSettings: { title: 'Shop by Category', columns: 4 } },
  { type: 'featuredProducts', label: 'Featured Products', icon: Layout, defaultSettings: { title: 'Featured Products', count: 4, collectionId: '' } },
  { type: 'allProducts', label: 'All Products Grid', icon: Layout, defaultSettings: { title: 'All Products', columns: 4 } },
  { type: 'textWithImage', label: 'Text with Image', icon: ImageIcon, defaultSettings: { title: 'Our Story', content: 'We make the best products...', imagePosition: 'left' } },
  { type: 'promoBanner', label: 'Promo Banner', icon: Sparkles, defaultSettings: { text: 'Free shipping on orders over $50!', backgroundColor: '#000000', textColor: '#ffffff' } },
  { type: 'countdownTimer', label: 'Countdown Timer', icon: Sparkles, defaultSettings: { title: 'Flash Sale Ends In:', targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] } },
  { type: 'trustBadges', label: 'Trust Badges', icon: Sparkles, defaultSettings: { title: 'Why shop with us?', badges: 'Free Shipping, 30-Day Returns, Secure Checkout' } },
  { type: 'faq', label: 'FAQ Accordion', icon: Type, defaultSettings: { title: 'Frequently Asked Questions' } },
  { type: 'testimonials', label: 'Testimonials', icon: Type, defaultSettings: { title: 'What Customers Say' } },
  { type: 'newsletter', label: 'Newsletter Signup', icon: Type, defaultSettings: { title: 'Subscribe to our newsletter', subtitle: 'Get 10% off your first order' } },
  { type: 'video', label: 'Product Video', icon: ImageIcon, defaultSettings: { title: 'See it in action', videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
  { type: 'blogPosts', label: 'Latest Blog Posts', icon: Type, defaultSettings: { title: 'From the Blog', count: 3 } },
  { type: 'contactForm', label: 'Contact Form', icon: Type, defaultSettings: { title: 'Get in Touch', email: 'support@store.com' } },
  { type: 'promoPopups', label: 'Promo Popup', icon: Sparkles, defaultSettings: { title: 'Wait!', subtitle: 'Get 20% off before you go', delaySeconds: 5 } },
  { type: 'lookbook', label: 'Lookbook (Hotspots)', icon: ImageIcon, defaultSettings: { title: 'Shop the Look', imageUrl: '' } },
  { type: 'promoTiles', label: 'Promo Grid Tiles', icon: Layout, defaultSettings: { title: 'Special Offers', count: 2 } },
  { type: 'logoList', label: 'Logo List / Brands', icon: ImageIcon, defaultSettings: { title: 'As Seen On' } },
  { type: 'richText', label: 'Rich Text', icon: Type, defaultSettings: { title: 'About Us', content: 'Detailed rich text content here...' } },
  { type: 'map', label: 'Store Location Map', icon: Layout, defaultSettings: { title: 'Visit Us', address: '123 Main St, City' } },
  { type: 'imageGallery', label: 'Image Gallery', icon: ImageIcon, defaultSettings: { title: 'Gallery', columns: 3 } },
  { type: 'customCode', label: 'Custom Code / HTML', icon: Code, defaultSettings: { code: '<div style="padding: 20px; text-align: center; border: 1px dashed #ccc;">Your custom HTML here</div>' } },
]

// Premium Full Themes with 21+ sections utilization
const PREMIUM_THEMES = [
  { id: 'th1', name: 'Luxe', niche: 'Fashion & Apparel', primaryColor: '#000000', theme: 'minimal', sections: [
    { id: 's1', type: 'promoBanner', label: 'Promo Banner', settings: { text: 'Free Express Shipping on Orders over $150', backgroundColor: '#000000', textColor: '#ffffff' } },
    { id: 's2', type: 'hero', label: 'Hero Banner', settings: { title: 'Autumn Collection 2026', subtitle: 'Elegance redefined.', buttonText: 'Shop the Look', height: '800px' } },
    { id: 's3', type: 'logoList', label: 'Brands', settings: { title: 'Featured In' } },
    { id: 's4', type: 'lookbook', label: 'Lookbook', settings: { title: 'Streetwear Essentials' } },
    { id: 's5', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Trending Now', count: 8 } },
    { id: 's6', type: 'video', label: 'Product Video', settings: { title: 'Behind the Scenes' } },
    { id: 's7', type: 'promoTiles', label: 'Promo Grid', settings: { title: 'Shop by Vibe' } },
    { id: 's8', type: 'newsletter', label: 'Newsletter', settings: { title: 'The Inner Circle', subtitle: 'Exclusive early access to drops.' } },
    { id: 's9', type: 'promoPopups', label: 'Popup', settings: { title: 'Unlock 15% Off', delaySeconds: 10 } }
  ]},
  { id: 'th2', name: 'TechPro', niche: 'Electronics & Gadgets', primaryColor: '#2563eb', theme: 'modern', sections: [
    { id: 's1', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3, delay: 5 } },
    { id: 's2', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Premium Guarantees', badges: '2 Year Warranty, Next Day Delivery, 24/7 Support' } },
    { id: 's3', type: 'countdownTimer', label: 'Countdown Timer', settings: { title: 'Flash Sale: Ends In' } },
    { id: 's4', type: 'categories', label: 'Categories Grid', settings: { title: 'Shop by Device', columns: 6 } },
    { id: 's5', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'New Arrivals', count: 4 } },
    { id: 's6', type: 'textWithImage', label: 'Text with Image', settings: { title: 'Next-Gen Processing', content: 'Experience the power of our latest chips.', imagePosition: 'left' } },
    { id: 's7', type: 'faq', label: 'FAQ Accordion', settings: { title: 'Technical Specifications' } },
    { id: 's8', type: 'blogPosts', label: 'Latest News', settings: { title: 'Tech Reviews' } }
  ]},
  { id: 'th3', name: 'Pure', niche: 'Health & Beauty', primaryColor: '#059669', theme: 'classic', sections: [
    { id: 's1', type: 'hero', label: 'Hero Banner', settings: { title: 'Pure. Natural. You.', subtitle: 'Skincare powered by nature.', buttonText: 'Discover Routine' } },
    { id: 's2', type: 'categories', label: 'Categories List', settings: { title: 'Shop by Concern' } },
    { id: 's3', type: 'richText', label: 'Rich Text', settings: { title: 'Our Philosophy', content: 'We believe in 100% cruelty-free, vegan ingredients.' } },
    { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Bestsellers', count: 4 } },
    { id: 's5', type: 'video', label: 'Video', settings: { title: 'How to use our serum' } },
    { id: 's6', type: 'testimonials', label: 'Testimonials', settings: { title: 'Real Results from Real Women' } },
    { id: 's7', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Our Promise', badges: 'Cruelty Free, 100% Vegan, Recyclable Packaging' } }
  ]},
  { id: 'th4', name: 'Crave', niche: 'Food & Restaurant', primaryColor: '#dc2626', theme: 'modern', sections: [
    { id: 's1', type: 'promoBanner', label: 'Promo Banner', settings: { text: 'Free Delivery on all orders over $30!', backgroundColor: '#dc2626', textColor: '#ffffff' } },
    { id: 's2', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3 } },
    { id: 's3', type: 'categories', label: 'Categories Grid', settings: { title: 'Our Menu' } },
    { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Chef Recommendations', count: 6 } },
    { id: 's5', type: 'imageGallery', label: 'Gallery', settings: { title: 'Follow us on Instagram' } },
    { id: 's6', type: 'map', label: 'Map', settings: { title: 'Visit Our Restaurant' } },
    { id: 's7', type: 'contactForm', label: 'Contact', settings: { title: 'Book a Table' } }
  ]},
  { id: 'th5', name: 'Studio', niche: 'Furniture & Home', primaryColor: '#78716c', theme: 'minimal', sections: [
    { id: 's1', type: 'hero', label: 'Hero', settings: { title: 'Design your sanctuary', subtitle: 'Modern minimalism for every room' } },
    { id: 's2', type: 'lookbook', label: 'Lookbook', settings: { title: 'Shop the Living Room' } },
    { id: 's3', type: 'categories', label: 'Categories Grid', settings: { title: 'Rooms' } },
    { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'New Arrivals' } },
    { id: 's5', type: 'textWithImage', label: 'About', settings: { title: 'Sustainable Craftsmanship' } },
    { id: 's6', type: 'blogPosts', label: 'Blog', settings: { title: 'Interior Design Tips' } }
  ]},
  { id: 'th6', name: 'Active', niche: 'Sports & Fitness', primaryColor: '#f97316', theme: 'modern', sections: [
    { id: 's1', type: 'hero', label: 'Hero', settings: { title: 'Push Your Limits', subtitle: 'Gear built for performance', buttonText: 'Shop Gear' } },
    { id: 's2', type: 'countdownTimer', label: 'Timer', settings: { title: 'Summer Sale Ends:' } },
    { id: 's3', type: 'promoTiles', label: 'Promo Tiles', settings: { title: 'Shop by Sport' } },
    { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Top Rated Equipment' } },
    { id: 's5', type: 'video', label: 'Video', settings: { title: 'See the gear in action' } },
    { id: 's6', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Why choose us?', badges: 'Lifetime Warranty, Free Returns, Expert Advice' } }
  ]},
  { id: 'th7', name: 'Craft', niche: 'Jewelry & Handmade', primaryColor: '#b45309', theme: 'classic', sections: [
    { id: 's1', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3 } },
    { id: 's2', type: 'richText', label: 'Rich Text', settings: { title: 'Artisan Crafted', content: 'Every piece tells a story.' } },
    { id: 's3', type: 'imageGallery', label: 'Gallery', settings: { title: 'Our Collections' } },
    { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Featured Pieces' } },
    { id: 's5', type: 'textWithImage', label: 'Story', settings: { title: 'Meet the Maker', imagePosition: 'right' } },
    { id: 's6', type: 'testimonials', label: 'Testimonials', settings: { title: 'Client Love' } }
  ]}
]

function SortableSectionItem({ 
  section, 
  onSelect, 
  onRemove,
  isActive 
}: { 
  section: SectionData, 
  onSelect: () => void, 
  onRemove: () => void,
  isActive: boolean 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = SECTION_TYPES.find(t => t.type === section.type)?.icon || Layout

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group p-3 border rounded-lg cursor-pointer transition-colors ${
        isActive ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-border bg-card hover:border-emerald-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
          <Move className="w-4 h-4" />
        </div>
        <Icon className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-medium flex-1">{section.label}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

export default function StoreEditor() {
  const { currentStore, setStore } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'themes' | 'sections' | 'theme_settings'>('sections')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [sections, setSections] = useState<SectionData[]>([])
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load sections from currentStore
  useEffect(() => {
    if (currentStore?.sectionsConfig) {
      try {
        const parsed = JSON.parse(currentStore.sectionsConfig)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSections(parsed)
          return
        }
      } catch (e) {
        console.error('Failed to parse sectionsConfig', e)
      }
    }
    // Default sections if none found
    setSections([
      { id: '1', type: 'hero', label: 'Hero Banner', settings: { title: 'Welcome to ' + (currentStore?.name || 'Store'), subtitle: 'Discover amazing products', buttonText: 'Shop Now' } },
      { id: '2', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Best Sellers', count: 4 } },
      { id: '3', type: 'textWithImage', label: 'Text with Image', settings: { title: 'Quality Guaranteed', content: 'We offer only the best...', imagePosition: 'right' } }
    ])
  }, [currentStore?.sectionsConfig, currentStore?.name])
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const addSection = (type: string) => {
    const template = SECTION_TYPES.find(t => t.type === type)
    if (!template) return
    const newSection: SectionData = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: template.label,
      settings: { ...template.defaultSettings }
    }
    setSections([...sections, newSection])
    setActiveSectionId(newSection.id)
  }

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id))
    if (activeSectionId === id) setActiveSectionId(null)
  }

  const updateSectionSettings = (id: string, key: string, value: any) => {
    setSections(sections.map(s => {
      if (s.id === id) return { ...s, settings: { ...s.settings, [key]: value } }
      return s
    }))
  }

  const handleSave = async () => {
    if (!currentStore) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionsConfig: JSON.stringify(sections) })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      
      setStore(data.store)
      toast({ title: 'Success', description: 'Store layout saved successfully!' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const activeSection = sections.find(s => s.id === activeSectionId)

  const { setView } = useAppStore()

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
      {/* TOP HEADER: Theme Editor */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
          <div className="h-4 w-px bg-border"></div>
          <span className="font-semibold text-sm">Theme Editor <Badge variant="secondary" className="ml-2 text-[10px] bg-emerald-100 text-emerald-800">Pro</Badge></span>
        </div>
        
        <div className="flex bg-muted p-1 rounded-lg">
          <Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setViewport('desktop')}>
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant={viewport === 'tablet' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setViewport('tablet')}>
            <Tablet className="w-4 h-4" />
          </Button>
          <Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3" onClick={() => setViewport('mobile')}>
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 hidden md:flex">
            <Eye className="w-4 h-4 mr-2" /> Preview
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8" onClick={handleSave} disabled={isSaving}>
            <Save className={`w-3.5 h-3.5 mr-2 ${isSaving ? 'animate-pulse' : ''}`} /> 
            {isSaving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-muted/20">
        {/* LEFT SIDEBAR: Tools & Sections list */}
        <div className="w-80 border-r bg-card flex flex-col shadow-sm z-10 shrink-0">

        <div className="flex border-b">
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'themes' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('themes')}
          >
            Themes
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'sections' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('sections')}
          >
            Sections
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'theme_settings' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('theme_settings')}
          >
            Settings
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">Applying a Premium Theme will inject high-converting sections and replace your current layout.</p>
              </div>

              {/* Developer Theme Upload */}
              <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Upload Custom Theme</h4>
                <p className="text-xs text-muted-foreground mb-3 mt-1">For Developers: Upload a .zip containing theme JSON and custom code sections.</p>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast({ title: 'Theme Upload', description: 'Developer theme upload API will be available soon.'})}>
                  Upload .zip
                </Button>
              </div>
              
              <div className="space-y-3 pt-2">
                {PREMIUM_THEMES.map(theme => (
                  <div key={theme.id} className="border rounded-lg p-3 hover:border-emerald-400 transition-colors cursor-pointer bg-card group" 
                       onClick={() => {
                         if(confirm(`Apply the ${theme.name} premium theme? This will replace your current sections.`)) {
                           setSections(theme.sections)
                           toast({ title: 'Theme Applied', description: `Loaded ${theme.name} layout.` })
                           setActiveTab('sections')
                         }
                       }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">{theme.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">{theme.niche}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full border shadow-sm" style={{ background: theme.primaryColor }}></div>
                      <span className="text-xs text-muted-foreground">{theme.sections.length} Sections included</span>
                    </div>
                    <Button variant="default" size="sm" className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700">Apply Theme</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'sections' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Sections</span>
              </div>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {sections.map(section => (
                      <SortableSectionItem 
                        key={section.id} 
                        section={section} 
                        onSelect={() => setActiveSectionId(section.id)}
                        onRemove={() => removeSection(section.id)}
                        isActive={activeSectionId === section.id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="pt-4 border-t">
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">Add Section</span>
                <div className="grid grid-cols-2 gap-2">
                  {SECTION_TYPES.map(type => (
                    <button
                      key={type.type}
                      onClick={() => addSection(type.type)}
                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 transition-all text-center"
                    >
                      <type.icon className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'theme_settings' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" defaultValue={currentStore?.primaryColor || '#10b981'} className="w-8 h-8 rounded border p-0 cursor-pointer" />
                  <Input defaultValue={currentStore?.primaryColor || '#10b981'} className="h-8 font-mono text-xs" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Font Family</label>
                <select className="w-full text-sm border rounded-md p-2 bg-background">
                  <option>Inter (Default)</option>
                  <option>Roboto</option>
                  <option>Playfair Display</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PREVIEW AREA */}
      <div className="flex-1 flex flex-col bg-muted/10 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start shadow-inner">
          <motion.div 
            layout
            className="bg-background shadow-2xl rounded-xl border border-border/50 transition-all duration-300 overflow-hidden"
            style={{ 
              width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
              minHeight: '800px'
            }}
          >
            {/* Header Mock */}
            <div className="h-16 border-b flex items-center justify-between px-6 bg-card">
              <span className="font-bold text-lg">{currentStore?.name || 'My Store'}</span>
              <div className="hidden md:flex gap-6 text-sm font-medium">
                <span>Home</span>
                <span>Shop</span>
                <span>About</span>
              </div>
            </div>

            {/* Sections Render */}
            <div className="flex flex-col">
              {sections.map(section => (
                <div 
                  key={section.id} 
                  className={`relative group ${activeSectionId === section.id ? 'ring-2 ring-emerald-500 ring-inset' : 'hover:ring-2 hover:ring-emerald-500/50 hover:ring-inset'} transition-all cursor-pointer`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  {/* Visual Render based on type */}
                  {section.type === 'hero' && (
                    <div className="py-24 px-8 text-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10">
                      <h1 className="text-4xl md:text-5xl font-bold mb-4">{section.settings.title}</h1>
                      <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">{section.settings.subtitle}</p>
                      <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full">{section.settings.buttonText}</Button>
                    </div>
                  )}

                  {section.type === 'featuredProducts' && (
                    <div className="py-16 px-6 md:px-12 bg-background">
                      <h2 className="text-2xl font-bold mb-8 text-center">{section.settings.title}</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Array.from({ length: section.settings.count || 4 }).map((_, i) => (
                          <div key={i} className="space-y-3">
                            <div className="aspect-square bg-muted rounded-xl"></div>
                            <div className="h-4 bg-muted rounded w-2/3"></div>
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.type === 'categories' && (
                    <div className="py-12 px-6 md:px-12 bg-background border-b border-muted/30">
                      <h2 className="text-xl font-bold mb-6">{section.settings.title || 'Shop by Category'}</h2>
                      <div className="flex gap-4 overflow-x-auto pb-4">
                        {['All', 'Electronics', 'Clothing', 'Home'].map((cat, i) => (
                          <div key={i} className={`px-6 py-2 rounded-full border-2 ${i === 0 ? 'border-emerald-600 text-emerald-600 bg-emerald-50' : 'border-muted text-muted-foreground'}`}>
                            {cat}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.type === 'allProducts' && (
                    <div className="py-16 px-6 md:px-12 bg-background">
                      <h2 className="text-2xl font-bold mb-8">{section.settings.title || 'All Products'}</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((_, i) => (
                          <div key={i} className="space-y-3">
                            <div className="aspect-square bg-muted rounded-xl"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.type === 'textWithImage' && (
                    <div className="py-16 px-6 md:px-12 bg-muted/10 flex flex-col md:flex-row items-center gap-12">
                      {section.settings.imagePosition === 'left' && <div className="flex-1 aspect-[4/3] bg-muted rounded-xl w-full"></div>}
                      <div className="flex-1 space-y-4">
                        <h2 className="text-3xl font-bold">{section.settings.title}</h2>
                        <p className="text-muted-foreground leading-relaxed">{section.settings.content}</p>
                        <Button variant="outline">Learn More</Button>
                      </div>
                      {section.settings.imagePosition === 'right' && <div className="flex-1 aspect-[4/3] bg-muted rounded-xl w-full"></div>}
                    </div>
                  )}

                  {section.type === 'testimonials' && (
                    <div className="py-16 px-6 md:px-12 bg-background text-center">
                      <h2 className="text-2xl font-bold mb-12">{section.settings.title}</h2>
                      <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                          <Card key={i} className="p-6 text-center space-y-4 shadow-sm border-border/50">
                            <div className="flex justify-center gap-1">{'⭐⭐⭐⭐⭐'}</div>
                            <p className="text-sm text-muted-foreground italic">"Amazing quality and fast shipping! Will definitely buy again."</p>
                            <p className="font-semibold text-sm">- Customer {i}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Highlight overlay for active state */}
                  {activeSectionId === section.id && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                      {section.label}
                    </div>
                  )}
                </div>
              ))}
              
              {sections.length === 0 && (
                <div className="py-32 flex flex-col items-center justify-center text-muted-foreground">
                  <Layout className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your store is empty. Add sections from the sidebar.</p>
                </div>
              )}
            </div>

            {/* Footer Mock */}
            <div className="py-12 px-6 border-t bg-card text-center text-sm text-muted-foreground">
              <p>&copy; 2026 {currentStore?.name || 'Store'}. All rights reserved.</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Section Settings */}
      {activeSection && (
        <div className="w-72 border-l bg-card flex flex-col shadow-sm shrink-0 z-10 animate-in slide-in-from-right-4 duration-200">
          <div className="p-4 border-b flex items-center justify-between bg-muted/10">
            <h3 className="font-semibold text-sm">{activeSection.label} Settings</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveSectionId(null)}>
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            {Object.keys(activeSection.settings).map(key => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                
                {key === 'count' || key === 'slideCount' || key === 'delay' || key === 'delaySeconds' || key === 'columns' ? (
                  <Input 
                    type="number" 
                    value={activeSection.settings[key]} 
                    onChange={(e) => updateSectionSettings(activeSection.id, key, parseInt(e.target.value) || 0)}
                    className="text-sm h-8"
                  />
                ) : key === 'imagePosition' ? (
                  <select 
                    className="w-full text-sm border rounded-md p-1.5 bg-background h-8"
                    value={activeSection.settings[key]}
                    onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                  >
                    <option value="left">Image Left</option>
                    <option value="right">Image Right</option>
                  </select>
                ) : key.toLowerCase().includes('image') || key === 'videoUrl' ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        value={activeSection.settings[key]} 
                        onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                        className="text-sm h-8 flex-1"
                        placeholder="https://..."
                      />
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => toast({ title: 'Media Manager', description: 'Opening media manager...' })}>
                        <UploadCloud className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                    {activeSection.settings[key] && key.toLowerCase().includes('image') && (
                      <div className="aspect-video w-full rounded border overflow-hidden bg-muted relative">
                        <img src={activeSection.settings[key]} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                ) : key === 'code' ? (
                  <textarea 
                    value={activeSection.settings[key]} 
                    onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                    className="w-full text-xs font-mono border rounded-md p-2 bg-slate-900 text-emerald-400 min-h-[200px]"
                    placeholder="<!-- HTML/CSS Code -->"
                  />
                ) : key === 'content' || key === 'subtitle' || key === 'badges' || key === 'text' ? (
                  <textarea 
                    value={activeSection.settings[key]} 
                    onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                    className="w-full text-sm border rounded-md p-2 bg-background min-h-[80px]"
                  />
                ) : key === 'collectionId' || key === 'productId' ? (
                  <select 
                    className="w-full text-sm border rounded-md p-1.5 bg-background h-8"
                    value={activeSection.settings[key]}
                    onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                  >
                    <option value="">Select an option...</option>
                    {/* Placeholder dynamic data */}
                    <option value="col_1">Summer Collection</option>
                    <option value="col_2">Winter Wear</option>
                    <option value="col_3">New Arrivals</option>
                  </select>
                ) : key.toLowerCase().includes('color') ? (
                  <div className="flex items-center gap-2">
                    <input type="color" value={activeSection.settings[key]} onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)} className="w-8 h-8 rounded border p-0 cursor-pointer" />
                    <Input value={activeSection.settings[key]} onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)} className="h-8 font-mono text-xs" />
                  </div>
                ) : (
                  <Input 
                    value={activeSection.settings[key]} 
                    onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                    className="text-sm h-8"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      </div>
    </div>
  )
}
