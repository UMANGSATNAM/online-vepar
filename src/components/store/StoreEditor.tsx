'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import { useSocket } from '@/hooks/use-socket'

interface SectionData {
  id: string
  type: string
  label: string
  settings: Record<string, any>
}

const SECTION_TYPES = [
  { type: 'announcementBar', label: 'Announcement Bar', icon: Type, defaultSettings: { text: '🔥 NEW SEASON DROP — USE CODE FRESH30 FOR 30% OFF', backgroundColor: '#000000', textColor: '#ffffff' } },
  {
    type: 'heroBannerAdvanced', label: 'Hero Banner', icon: Sparkles, defaultSettings: {
      // Text content
      headline1: 'DRESS BOLD.',
      headline2: 'LIVE LOUD',
      subtitle: 'Street-ready styles, premium fabrics, and drops that never sleep. Built for those who refuse to blend in.',
      // Buttons
      button1Text: 'SHOP NEW ARRIVALS →',
      button2Text: 'WATCH LOOKBOOK',
      // Badge
      productTag: 'BESTSELLER',
      // Pricing
      currentPrice: '₹3,199',
      originalPrice: '₹4,499',
      // Sub-image tags
      subTag1: 'COLLAR',
      subTag2: 'PREMIUM',
      // Stats
      stat1Value: '50K+',
      stat1Label: 'HAPPY CUSTOMERS',
      stat2Value: '200+',
      stat2Label: 'STYLES AVAILABLE',
      rating: '4.9',
      statLabel: 'Average Rating',
      // Images
      imageUrl: '',
      gridImage1: '',
      gridImage2: ''
    }
  },
  { type: 'categoryGrid', label: 'Category Grid', icon: Layout, defaultSettings: { title: 'Shop by Category', columns: 4 } },
  { type: 'featuredCollection', label: 'Featured Collection', icon: Layout, defaultSettings: { title: 'New Arrivals', count: 4, collectionId: '' } },
  { type: 'featuresBand', label: 'Features Band', icon: Sparkles, defaultSettings: { text1: '50K+ HAPPY CUSTOMERS', text2: '200+ STYLES', text3: 'EASY RETURNS' } },
  { type: 'promotionalBanners', label: 'Promotional Banners', icon: ImageIcon, defaultSettings: { title: 'Special Offers', count: 2 } },
  { type: 'shoppableVideo', label: 'Shoppable Video', icon: ImageIcon, defaultSettings: { title: 'Watch & Shop', videoUrl: 'https://youtube.com/...' } },
  { type: 'bundleBuilder', label: 'Bundle Builder', icon: Layout, defaultSettings: { title: 'Build Your Look', discount: 'Save 20%' } },
  { type: 'reviewsSection', label: 'Reviews Section', icon: Type, defaultSettings: { title: 'What They Say' } },
  { type: 'footer', label: 'Footer', icon: Layout, defaultSettings: { text: '© 2026 Store Name' } },
]

// Premium Full Themes with 21+ sections utilization
const PREMIUM_THEMES = [
  {
    id: 'th1', name: 'Luxe', niche: 'Fashion & Apparel', primaryColor: '#000000', theme: 'minimal', sections: [
      { id: 's1', type: 'promoBanner', label: 'Promo Banner', settings: { text: 'Free Express Shipping on Orders over $150', backgroundColor: '#000000', textColor: '#ffffff' } },
      { id: 's2', type: 'hero', label: 'Hero Banner', settings: { title: 'Autumn Collection 2026', subtitle: 'Elegance redefined.', buttonText: 'Shop the Look', height: '800px' } },
      { id: 's3', type: 'logoList', label: 'Brands', settings: { title: 'Featured In' } },
      { id: 's4', type: 'lookbook', label: 'Lookbook', settings: { title: 'Streetwear Essentials' } },
      { id: 's5', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Trending Now', count: 8 } },
      { id: 's6', type: 'video', label: 'Product Video', settings: { title: 'Behind the Scenes' } },
      { id: 's7', type: 'promoTiles', label: 'Promo Grid', settings: { title: 'Shop by Vibe' } },
      { id: 's8', type: 'newsletter', label: 'Newsletter', settings: { title: 'The Inner Circle', subtitle: 'Exclusive early access to drops.' } },
      { id: 's9', type: 'promoPopups', label: 'Popup', settings: { title: 'Unlock 15% Off', delaySeconds: 10 } }
    ]
  },
  {
    id: 'th2', name: 'TechPro', niche: 'Electronics & Gadgets', primaryColor: '#2563eb', theme: 'modern', sections: [
      { id: 's1', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3, delay: 5 } },
      { id: 's2', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Premium Guarantees', badges: '2 Year Warranty, Next Day Delivery, 24/7 Support' } },
      { id: 's3', type: 'countdownTimer', label: 'Countdown Timer', settings: { title: 'Flash Sale: Ends In' } },
      { id: 's4', type: 'categories', label: 'Categories Grid', settings: { title: 'Shop by Device', columns: 6 } },
      { id: 's5', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'New Arrivals', count: 4 } },
      { id: 's6', type: 'textWithImage', label: 'Text with Image', settings: { title: 'Next-Gen Processing', content: 'Experience the power of our latest chips.', imagePosition: 'left' } },
      { id: 's7', type: 'faq', label: 'FAQ Accordion', settings: { title: 'Technical Specifications' } },
      { id: 's8', type: 'blogPosts', label: 'Latest News', settings: { title: 'Tech Reviews' } }
    ]
  },
  {
    id: 'th3', name: 'Pure', niche: 'Health & Beauty', primaryColor: '#059669', theme: 'classic', sections: [
      { id: 's1', type: 'hero', label: 'Hero Banner', settings: { title: 'Pure. Natural. You.', subtitle: 'Skincare powered by nature.', buttonText: 'Discover Routine' } },
      { id: 's2', type: 'categories', label: 'Categories List', settings: { title: 'Shop by Concern' } },
      { id: 's3', type: 'richText', label: 'Rich Text', settings: { title: 'Our Philosophy', content: 'We believe in 100% cruelty-free, vegan ingredients.' } },
      { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Bestsellers', count: 4 } },
      { id: 's5', type: 'video', label: 'Video', settings: { title: 'How to use our serum' } },
      { id: 's6', type: 'testimonials', label: 'Testimonials', settings: { title: 'Real Results from Real Women' } },
      { id: 's7', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Our Promise', badges: 'Cruelty Free, 100% Vegan, Recyclable Packaging' } }
    ]
  },
  {
    id: 'th4', name: 'Crave', niche: 'Food & Restaurant', primaryColor: '#dc2626', theme: 'modern', sections: [
      { id: 's1', type: 'promoBanner', label: 'Promo Banner', settings: { text: 'Free Delivery on all orders over $30!', backgroundColor: '#dc2626', textColor: '#ffffff' } },
      { id: 's2', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3 } },
      { id: 's3', type: 'categories', label: 'Categories Grid', settings: { title: 'Our Menu' } },
      { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Chef Recommendations', count: 6 } },
      { id: 's5', type: 'imageGallery', label: 'Gallery', settings: { title: 'Follow us on Instagram' } },
      { id: 's6', type: 'map', label: 'Map', settings: { title: 'Visit Our Restaurant' } },
      { id: 's7', type: 'contactForm', label: 'Contact', settings: { title: 'Book a Table' } }
    ]
  },
  {
    id: 'th5', name: 'Studio', niche: 'Furniture & Home', primaryColor: '#78716c', theme: 'minimal', sections: [
      { id: 's1', type: 'hero', label: 'Hero', settings: { title: 'Design your sanctuary', subtitle: 'Modern minimalism for every room' } },
      { id: 's2', type: 'lookbook', label: 'Lookbook', settings: { title: 'Shop the Living Room' } },
      { id: 's3', type: 'categories', label: 'Categories Grid', settings: { title: 'Rooms' } },
      { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'New Arrivals' } },
      { id: 's5', type: 'textWithImage', label: 'About', settings: { title: 'Sustainable Craftsmanship' } },
      { id: 's6', type: 'blogPosts', label: 'Blog', settings: { title: 'Interior Design Tips' } }
    ]
  },
  {
    id: 'th6', name: 'Active', niche: 'Sports & Fitness', primaryColor: '#f97316', theme: 'modern', sections: [
      { id: 's1', type: 'hero', label: 'Hero', settings: { title: 'Push Your Limits', subtitle: 'Gear built for performance', buttonText: 'Shop Gear' } },
      { id: 's2', type: 'countdownTimer', label: 'Timer', settings: { title: 'Summer Sale Ends:' } },
      { id: 's3', type: 'promoTiles', label: 'Promo Tiles', settings: { title: 'Shop by Sport' } },
      { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Top Rated Equipment' } },
      { id: 's5', type: 'video', label: 'Video', settings: { title: 'See the gear in action' } },
      { id: 's6', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Why choose us?', badges: 'Lifetime Warranty, Free Returns, Expert Advice' } }
    ]
  },
  {
    id: 'th7', name: 'Craft', niche: 'Jewelry & Handmade', primaryColor: '#b45309', theme: 'classic', sections: [
      { id: 's1', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3 } },
      { id: 's2', type: 'richText', label: 'Rich Text', settings: { title: 'Artisan Crafted', content: 'Every piece tells a story.' } },
      { id: 's3', type: 'imageGallery', label: 'Gallery', settings: { title: 'Our Collections' } },
      { id: 's4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Featured Pieces' } },
      { id: 's5', type: 'textWithImage', label: 'Story', settings: { title: 'Meet the Maker', imagePosition: 'right' } },
      { id: 's6', type: 'testimonials', label: 'Testimonials', settings: { title: 'Client Love' } }
    ]
  }
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
      className={`relative group p-3 cursor-pointer transition-colors flex items-center gap-3 ${isActive ? 'bg-[#ebf5fa] border-l-4 border-l-[#005bd3]' : 'bg-white border-b border-[#dfe3e8] hover:bg-[#f9fafb]'
        }`}
      onClick={onSelect}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
        <Layout className="w-4 h-4 opacity-50" />
      </div>
      <Icon className={`w-4 h-4 ${isActive ? 'text-[#005bd3]' : 'text-gray-500'}`} />
      <span className={`text-sm flex-1 ${isActive ? 'font-semibold text-[#005bd3]' : 'font-medium text-gray-700'}`}>{section.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  )
}

// ─── HERO BANNER DEDICATED SETTINGS PANEL ────────────────────────────────────
function HeroBannerSettings({
  section, onUpdate, onImageUpload, primaryColor
}: {
  section: SectionData
  onUpdate: (id: string, key: string, value: any) => void
  onImageUpload: (sectionId: string, key: string) => void
  primaryColor: string
}) {
  const s = section.settings
  const set = (key: string, value: any) => onUpdate(section.id, key, value)

  const Field = ({ label, field, multiline = false }: { label: string; field: string; multiline?: boolean }) => (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6d7175]">{label}</label>
      {multiline ? (
        <textarea
          value={s[field] || ''}
          onChange={e => set(field, e.target.value)}
          rows={3}
          className="w-full text-[13px] border border-[#c9cccf] rounded-md p-2 bg-white shadow-inner resize-none focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] outline-none"
        />
      ) : (
        <input
          type="text"
          value={s[field] || ''}
          onChange={e => set(field, e.target.value)}
          className="w-full text-[13px] border border-[#c9cccf] rounded-md px-3 h-8 bg-white shadow-inner focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] outline-none"
        />
      )}
    </div>
  )

  const ImageField = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6d7175]">{label}</label>
      {s[field] ? (
        <div className="relative rounded-lg overflow-hidden border border-[#dfe3e8] group bg-gray-50" style={{ aspectRatio: '4/3' }}>
          <img src={s[field]} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
            <button
              className="bg-white text-[#202223] text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 flex items-center gap-1"
              onClick={() => onImageUpload(section.id, field)}
            >
              <UploadCloud className="w-3 h-3" /> Replace
            </button>
            <button
              className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-red-600"
              onClick={() => set(field, '')}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] bg-[#f9fafb] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#005bd3] hover:bg-[#f0f6ff] transition-all py-6"
          onClick={() => onImageUpload(section.id, field)}
        >
          <div className="w-9 h-9 rounded-full bg-[#e8f0fe] flex items-center justify-center">
            <UploadCloud className="w-4 h-4 text-[#005bd3]" />
          </div>
          <p className="text-[12px] font-semibold text-[#202223]">Upload image</p>
          <p className="text-[10px] text-[#6d7175]">JPG, PNG, WebP</p>
        </div>
      )}
      {/* URL fallback */}
      <input
        type="text"
        value={s[field] || ''}
        onChange={e => set(field, e.target.value)}
        placeholder="or paste image URL..."
        className="w-full text-[11px] border border-[#c9cccf] rounded-md px-3 h-7 bg-white shadow-inner focus:border-[#005bd3] outline-none text-[#6d7175] placeholder:text-[#c9cccf]"
      />
    </div>
  )

  const SectionDivider = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 pt-2">
      <div className="flex-1 h-px bg-[#dfe3e8]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#8c9196]">{title}</span>
      <div className="flex-1 h-px bg-[#dfe3e8]" />
    </div>
  )

  return (
    <div className="space-y-4">
      <SectionDivider title="Headlines" />
      <Field label="Headline Line 1" field="headline1" />
      <Field label="Headline Line 2" field="headline2" />
      <Field label="Subtitle Text" field="subtitle" multiline />

      <SectionDivider title="Buttons" />
      <Field label="Primary Button" field="button1Text" />
      <Field label="Secondary Button" field="button2Text" />

      <SectionDivider title="Badge & Pricing" />
      <Field label="Product Badge" field="productTag" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Sale Price" field="currentPrice" />
        <Field label="Original Price" field="originalPrice" />
      </div>

      <SectionDivider title="Stats" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Stat 1 Value" field="stat1Value" />
        <Field label="Stat 1 Label" field="stat1Label" />
        <Field label="Stat 2 Value" field="stat2Value" />
        <Field label="Stat 2 Label" field="stat2Label" />
        <Field label="Rating" field="rating" />
        <Field label="Rating Label" field="statLabel" />
      </div>

      <SectionDivider title="Grid Image Tags" />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Left Tag" field="subTag1" />
        <Field label="Right Tag" field="subTag2" />
      </div>

      <SectionDivider title="Images" />
      <ImageField label="Main Hero Image" field="imageUrl" />
      <ImageField label="Grid Image (Left)" field="gridImage1" />
      <ImageField label="Grid Image (Right)" field="gridImage2" />

      <div className="pt-4 border-t border-[#dfe3e8]" />
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImageKey, setPendingImageKey] = useState<{ sectionId: string; key: string } | null>(null)
  const [storeTheme, setStoreTheme] = useState<string>('modern')
  const socket = useSocket()

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
        { id: '1', type: 'announcementBar', label: 'Announcement Bar', settings: { text: '🔥 NEW SEASON DROP — USE CODE FRESH30 FOR 30% OFF', backgroundColor: '#000000', textColor: '#ffffff' } },
        {
          id: '2', type: 'heroBannerAdvanced', label: 'Hero Banner', settings: {
            rating: '4.9', statLabel: 'Average Rating', productTag: 'BESTSELLER',
            currentPrice: '₹3,199', originalPrice: '₹4,499', subTag1: 'COLLAR', subTag2: 'PREMIUM'
          }
        },
        { id: '3', type: 'featuresBand', label: 'Features Band', settings: { text1: '50K+ HAPPY CUSTOMERS', text2: '200+ STYLES', text3: 'EASY RETURNS' } },
        { id: '4', type: 'categoryGrid', label: 'Category Grid', settings: { title: 'Shop by Category', columns: 4 } },
        { id: '5', type: 'featuredCollection', label: 'Featured Collection', settings: { title: 'New Arrivals', count: 4 } },
        { id: '6', type: 'shoppableVideo', label: 'Shoppable Video', settings: { title: 'Watch & Shop' } },
        { id: '7', type: 'reviewsSection', label: 'Reviews Section', settings: { title: 'What They Say' } },
        { id: '8', type: 'footer', label: 'Footer', settings: { text: '© 2026 Peril Jewellery' } }
      ])
    if (currentStore?.theme) {
      setStoreTheme(currentStore.theme)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.sectionsConfig, currentStore?.name, currentStore?.theme])

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
    const updated = sections.map(s => {
      if (s.id === id) return { ...s, settings: { ...s.settings, [key]: value } }
      return s
    })
    setSections(updated)
    if (socket && currentStore) {
      socket.emit('editor_update', { storeId: currentStore.id, payload: updated })
    }
  }

  // Image upload: convert file → base64 and inject into section setting
  const handleImageFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingImageKey) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      updateSectionSettings(pendingImageKey.sectionId, pendingImageKey.key, base64)
      setPendingImageKey(null)
    }
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }, [pendingImageKey])

  const triggerImageUpload = (sectionId: string, key: string) => {
    setPendingImageKey({ sectionId, key })
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  const handleSave = async () => {
    if (!currentStore) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/stores/${currentStore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionsConfig: JSON.stringify(sections),
          theme: storeTheme,
          isActive: true   // auto-publish on every save
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')

      setStore(data.store)
      setIsPublished(true)
      toast({ title: '✅ Saved & Published!', description: 'Your store is live with the latest changes.' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const activeSection = sections.find(s => s.id === activeSectionId)

  const { setView } = useAppStore()

  return (
    <div className="fixed inset-0 z-[100] bg-[#f4f6f8] flex flex-col overflow-hidden text-[#202223]">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
      {/* TOP HEADER: Theme Editor (Shopify Style) */}
      <div className="h-14 bg-white border-b border-[#dfe3e8] flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('dashboard')} className="text-gray-600 hover:text-black hover:bg-gray-100 px-2 h-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Exit
          </Button>
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
            <span className="font-semibold text-[13px]">Home page</span>
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </div>
        </div>

        <div className="flex bg-[#f4f6f8] p-0.5 rounded-lg border border-[#dfe3e8]">
          <Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="sm" className={`h-7 px-3 rounded-md ${viewport === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} onClick={() => setViewport('desktop')}>
            <Monitor className="w-4 h-4 text-gray-700" />
          </Button>
          <Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="sm" className={`h-7 px-3 rounded-md ${viewport === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} onClick={() => setViewport('mobile')}>
            <Smartphone className="w-4 h-4 text-gray-700" />
          </Button>
          <Button variant={viewport === 'tablet' ? 'secondary' : 'ghost'} size="sm" className={`h-7 px-3 rounded-md ${viewport === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`} onClick={() => setViewport('tablet')}>
            <Tablet className="w-4 h-4 text-gray-700" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {isPublished && (
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Published
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-8 text-gray-600 hover:bg-gray-100">
            <Eye className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-[#008060] hover:bg-[#006e52] text-white h-8 px-4 rounded font-medium shadow-sm" onClick={handleSave} disabled={isSaving}>
            <Save className={`w-3.5 h-3.5 mr-2 ${isSaving ? 'animate-pulse' : ''}`} />
            {isSaving ? 'Saving & Publishing...' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">

        {/* MINI LEFT NAV */}
        <div className="w-[60px] bg-white border-r border-[#dfe3e8] flex flex-col items-center py-4 gap-4 z-20 shrink-0">
          <button
            className={`w-10 h-10 flex justify-center items-center rounded-lg transition-colors ${activeTab === 'sections' ? 'bg-[#ebf5fa] text-[#005bd3]' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('sections')}
            title="Sections"
          >
            <Layout className="w-5 h-5" />
          </button>
          <button
            className={`w-10 h-10 flex justify-center items-center rounded-lg transition-colors ${activeTab === 'theme_settings' ? 'bg-[#ebf5fa] text-[#005bd3]' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('theme_settings')}
            title="Theme Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            className={`w-10 h-10 flex justify-center items-center rounded-lg transition-colors ${activeTab === 'themes' ? 'bg-[#ebf5fa] text-[#005bd3]' : 'text-gray-500 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('themes')}
            title="Theme Library"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        </div>

        {/* MAIN LEFT SIDEBAR */}
        <div className="w-[300px] bg-[#f4f6f8] border-r border-[#dfe3e8] flex flex-col z-10 shrink-0 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-[#dfe3e8] bg-white">
            <h2 className="font-semibold text-base text-[#202223]">
              {activeTab === 'sections' ? 'Sections' : activeTab === 'theme_settings' ? 'Theme settings' : 'Theme Library'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-[#f4f6f8]">
            {activeTab === 'themes' && (
              <div className="space-y-4">
                <div className="bg-[#ebf5fa] p-3 rounded-lg border border-[#b4e1fa]">
                  <p className="text-[13px] text-[#005bd3]">Applying a Premium Theme will inject high-converting sections and replace your current layout.</p>
                </div>

                {/* Developer Theme Upload */}
                <div className="bg-white border border-dashed border-[#c9cccf] rounded-lg p-5 text-center hover:bg-[#f9fafb] transition-colors cursor-pointer" onClick={() => toast({ title: 'Theme Upload', description: 'Developer theme upload API will be available soon.' })}>
                  <UploadCloud className="w-6 h-6 text-[#8c9196] mx-auto mb-2" />
                  <h4 className="font-semibold text-[13px] text-[#202223]">Upload Custom Theme</h4>
                  <p className="text-xs text-[#6d7175] mb-3 mt-1">For Developers: Upload a .zip containing theme JSON and custom code sections.</p>
                  <span className="text-xs font-medium text-[#005bd3]">Upload .zip</span>
                </div>

                <div className="space-y-3 pt-2">
                  {PREMIUM_THEMES.map(theme => (
                    <div key={theme.id} className="border border-[#dfe3e8] bg-white rounded-lg p-4 hover:border-[#c9cccf] transition-colors cursor-pointer group shadow-sm"
                      onClick={() => {
                        if (confirm(`Apply the ${theme.name} premium theme? This will replace your current sections.`)) {
                          setSections(theme.sections)
                          setStoreTheme(theme.theme)
                          toast({ title: 'Theme Applied', description: `Loaded ${theme.name} layout.` })
                          setActiveTab('sections')
                        }
                      }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-[14px] text-[#202223]">{theme.name}</h4>
                        <Badge variant="secondary" className="text-[10px] bg-[#f4f6f8] text-[#6d7175] border-[#dfe3e8]">{theme.niche}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-4 h-4 rounded-full border border-gray-200" style={{ background: theme.primaryColor }}></div>
                        <span className="text-xs text-[#6d7175]">{theme.sections.length} Sections included</span>
                      </div>
                      <Button variant="outline" size="sm" className="w-full h-8 text-[13px] text-[#202223] hover:bg-[#f9fafb] border-[#c9cccf]">Apply theme</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'sections' && (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6d7175] px-1">Template</div>

                <div className="bg-white border border-[#dfe3e8] rounded-lg shadow-sm overflow-hidden">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col">
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
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6d7175] mb-3 block px-1">Add section</span>
                  <div className="grid grid-cols-2 gap-2">
                    {SECTION_TYPES.map(type => (
                      <button
                        key={type.type}
                        onClick={() => addSection(type.type)}
                        className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border border-[#dfe3e8] bg-white hover:bg-[#f9fafb] hover:border-[#c9cccf] transition-all text-center shadow-sm"
                      >
                        <type.icon className="w-4 h-4 text-[#8c9196]" />
                        <span className="text-[11px] font-medium text-[#202223] leading-tight">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'theme_settings' && (
              <div className="space-y-4 bg-white border border-[#dfe3e8] p-4 rounded-lg shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-[#202223]">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" defaultValue={currentStore?.primaryColor || '#10b981'} className="w-8 h-8 rounded border border-[#c9cccf] p-0 cursor-pointer" />
                    <Input defaultValue={currentStore?.primaryColor || '#10b981'} className="h-8 font-mono text-xs border-[#c9cccf] bg-[#f4f6f8]" />
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <label className="text-[13px] font-medium text-[#202223]">Font Family</label>
                  <select className="w-full text-[13px] border border-[#c9cccf] rounded-md p-2 bg-white text-[#202223]">
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
        <div className="flex-1 flex flex-col relative bg-transparent">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
            <motion.div
              layout
              className={`bg-white shadow-[0_0_0_1px_rgba(63,63,68,0.05),0_1px_3px_0_rgba(63,63,68,0.15)] rounded-md transition-all duration-300 overflow-hidden theme-${storeTheme}`}
              style={{
                width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
                minHeight: '800px',
                maxWidth: '1200px'
              }}
            >
              {/* Header Mock */}
              <div className="h-16 border-b flex items-center justify-between px-6 bg-white">
                <span className="font-bold text-lg tracking-tight">{currentStore?.name || 'My Store'}</span>
                <div className="hidden md:flex gap-6 text-[13px] font-medium text-gray-600">
                  <span className="hover:text-black cursor-pointer">Home</span>
                  <span className="hover:text-black cursor-pointer">Catalog</span>
                  <span className="hover:text-black cursor-pointer">Contact</span>
                </div>
              </div>

              {/* Sections Render */}
              <div className="flex flex-col">
                {sections.map(section => (
                  <div
                    key={section.id}
                    className={`relative group ${activeSectionId === section.id ? 'ring-2 ring-[#005bd3] ring-inset z-10' : 'hover:ring-2 hover:ring-[#005bd3]/50 hover:ring-inset z-0'} transition-all cursor-pointer`}
                    onClick={() => setActiveSectionId(section.id)}
                  >
                    {/* Visual Render based on type */}
                    {/* Visual Render based on type */}
                    {section.type === 'announcementBar' && (
                      <div style={{ backgroundColor: section.settings.backgroundColor || '#000', color: section.settings.textColor || '#fff' }} className="py-2.5 px-4 text-center text-[10px] sm:text-xs font-bold tracking-widest uppercase w-full flex items-center justify-center gap-2">
                        <span className="animate-pulse">🔥</span> {section.settings.text} <span className="animate-pulse">🔥</span>
                      </div>
                    )}

                    {section.type === 'heroBannerAdvanced' && (
                      <div className="relative w-full bg-[#111111] text-white overflow-hidden flex flex-col md:flex-row min-h-[600px] md:min-h-[800px]">
                        {/* Left Content */}
                        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center relative z-10 border-r border-white/10">
                          <Badge className="bg-[#cc4444] text-white hover:bg-[#aa3333] border-none mb-6 w-max uppercase tracking-wider text-[10px] font-bold">
                            ● {section.settings.productTag || 'BESTSELLER'}
                          </Badge>
                          <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase text-[#ccff00] mb-2">
                            {section.settings.headline1 || 'DRESS BOLD.'}
                          </h1>
                          <h1 className="text-6xl md:text-8xl font-black leading-[0.85] tracking-tighter uppercase text-white mb-8">
                            {section.settings.headline2 || 'LIVE LOUD'}
                          </h1>
                          <p className="text-gray-400 text-sm md:text-base max-w-md mb-10 leading-relaxed">
                            {section.settings.subtitle || 'Street-ready styles, premium fabrics, and drops that never sleep.'}
                          </p>
                          <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <Button className="bg-[#ccff00] hover:bg-[#bbee00] text-black font-bold h-14 px-8 rounded-none text-sm tracking-widest uppercase">
                              {section.settings.button1Text || 'SHOP NEW ARRIVALS →'}
                            </Button>
                            <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold h-14 px-8 rounded-none text-sm tracking-widest uppercase bg-transparent">
                              {section.settings.button2Text || 'WATCH LOOKBOOK'}
                            </Button>
                          </div>

                          {/* Stats Footer */}
                          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10 w-full mt-auto">
                            <div>
                              <p className="text-2xl font-black mb-1">{section.settings.stat1Value || '50K+'}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{section.settings.stat1Label || 'HAPPY CUSTOMERS'}</p>
                            </div>
                            <div>
                              <p className="text-2xl font-black mb-1">{section.settings.stat2Value || '200+'}</p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{section.settings.stat2Label || 'STYLES AVAILABLE'}</p>
                            </div>
                            <div>
                              <p className="text-2xl font-black mb-1 flex items-center gap-1">{section.settings.rating || '4.9'} <Sparkles className="w-4 h-4 text-[#ccff00]" /></p>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{section.settings.statLabel || 'AVERAGE RATING'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Right Imagery */}
                        <div className="flex-1 relative flex flex-col md:grid md:grid-cols-2 md:grid-rows-2">
                          {/* Main Image */}
                          <div className="md:col-span-2 md:row-span-1 bg-[#1a1a1a] relative group overflow-hidden border-b border-white/10 min-h-[400px]">
                            {section.settings.imageUrl ? (
                              <img src={section.settings.imageUrl} alt="Hero" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                                <UploadCloud className="w-8 h-8" />
                                <span className="text-xs">Main Image</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 bg-black text-white text-[10px] font-bold px-3 py-1 tracking-widest uppercase">
                              {section.settings.productTag}
                            </div>
                            <div className="absolute bottom-4 right-4 bg-white text-black p-3 flex flex-col items-end shadow-2xl">
                              <span className="text-xs text-gray-500 line-through font-medium">{section.settings.originalPrice}</span>
                              <span className="text-xl font-black">{section.settings.currentPrice}</span>
                            </div>
                          </div>

                          {/* Grid Bottom Left */}
                          <div className="bg-[#222222] relative group overflow-hidden border-r border-white/10 min-h-[300px]">
                            {section.settings.gridImage1 ? (
                              <img src={section.settings.gridImage1} alt="Grid 1" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                                <UploadCloud className="w-6 h-6" />
                                <span className="text-xs">Grid Img 1</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                              <span className="text-[10px] font-bold text-white tracking-widest uppercase border border-white/30 px-2 py-1 backdrop-blur-sm">{section.settings.subTag1}</span>
                            </div>
                          </div>

                          {/* Grid Bottom Right */}
                          <div className="bg-[#1a1a1a] relative group overflow-hidden min-h-[300px]">
                            {section.settings.gridImage2 ? (
                              <img src={section.settings.gridImage2} alt="Grid 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20 gap-2">
                                <UploadCloud className="w-6 h-6" />
                                <span className="text-xs">Grid Img 2</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end">
                              <span className="text-[10px] font-bold text-white tracking-widest uppercase border border-white/30 px-2 py-1 backdrop-blur-sm">{section.settings.subTag2}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.type === 'featuresBand' && (
                      <div className="py-6 border-y border-gray-200 bg-white">
                        <div className="flex flex-wrap justify-center gap-8 md:gap-24 text-center">
                          {[section.settings.text1, section.settings.text2, section.settings.text3].map((txt, i) => (
                            <div key={i} className="flex items-center gap-3 font-black text-sm uppercase tracking-widest text-black">
                              <div className="w-2 h-2 rounded-full bg-[#ccff00]"></div>
                              {txt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'categoryGrid' && (
                      <div className="py-20 px-8 bg-gray-50">
                        <div className="flex justify-between items-end mb-10">
                          <h2 className="text-3xl font-black uppercase tracking-tight">{section.settings.title}</h2>
                          <a href="#" className="text-xs font-bold border-b-2 border-black pb-1 uppercase tracking-widest">VIEW ALL</a>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[4/5] bg-gray-200 relative group overflow-hidden cursor-pointer">
                              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors z-10"></div>
                              <h3 className="absolute bottom-6 left-6 text-white font-black text-xl z-20 uppercase tracking-widest">CATEGORY {i}</h3>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'featuredCollection' && (
                      <div className="py-20 px-8 bg-white">
                        <div className="flex justify-between items-end mb-10">
                          <h2 className="text-3xl font-black uppercase tracking-tight">{section.settings.title}</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="group cursor-pointer">
                              <div className="aspect-[3/4] bg-gray-100 mb-4 relative overflow-hidden">
                                <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest z-10">NEW</div>
                              </div>
                              <h4 className="font-bold text-sm uppercase tracking-wider mb-1 group-hover:underline">Product Title {i}</h4>
                              <p className="text-sm font-medium text-gray-500">₹2,499 <span className="line-through text-gray-300 ml-2">₹3,999</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'shoppableVideo' && (
                      <div className="py-24 px-8 bg-[#111] text-white">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-12">{section.settings.title}</h2>
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
                          <div className="flex-1 aspect-[9/16] md:aspect-auto bg-gray-800 rounded-2xl relative overflow-hidden flex items-center justify-center">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center pl-2">▶</div>
                          </div>
                          <div className="w-full md:w-80 flex flex-col gap-4">
                            {[1, 2].map(i => (
                              <div key={i} className="bg-white/5 p-4 rounded-xl flex gap-4 items-center">
                                <div className="w-16 h-20 bg-white/10 rounded"></div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-sm uppercase">Featured Item</h4>
                                  <p className="text-sm text-gray-400">₹1,999</p>
                                  <Button size="sm" className="w-full mt-2 bg-white text-black hover:bg-gray-200 text-xs">ADD TO CART</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {section.type === 'bundleBuilder' && (
                      <div className="py-20 px-8 bg-[#f4f6f8] text-center">
                        <Badge className="bg-[#ccff00] text-black mb-4 uppercase font-bold tracking-widest border-none px-3 py-1">{section.settings.discount}</Badge>
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-4">{section.settings.title}</h2>
                        <p className="text-gray-500 max-w-lg mx-auto mb-10">Select 3 items and unlock an exclusive automatic discount at checkout.</p>

                        <div className="flex justify-center items-center gap-4 max-w-3xl mx-auto">
                          <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200">+</div>
                          <span className="font-black text-2xl text-gray-300">+</span>
                          <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200">+</div>
                          <span className="font-black text-2xl text-gray-300">+</span>
                          <div className="w-32 h-40 bg-white border-2 border-dashed border-gray-300 flex items-center justify-center font-black text-4xl text-gray-200">+</div>
                        </div>

                        <Button className="mt-10 h-14 px-12 bg-black hover:bg-gray-800 text-white font-bold tracking-widest uppercase rounded-none">Start Building</Button>
                      </div>
                    )}

                    {section.type === 'promotionalBanners' && (
                      <div className="py-12 px-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="aspect-[21/9] bg-[#cc4444] text-white flex flex-col justify-center items-start p-10 cursor-pointer hover:opacity-95 transition-opacity">
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-2">Buy 1 Get 1</h3>
                            <p className="mb-4 font-medium opacity-90">On all accessories</p>
                            <span className="border-b-2 border-white pb-1 font-bold text-xs uppercase tracking-widest">Shop Now</span>
                          </div>
                          <div className="aspect-[21/9] bg-black text-white flex flex-col justify-center items-start p-10 cursor-pointer hover:opacity-95 transition-opacity">
                            <h3 className="text-3xl font-black uppercase tracking-tight mb-2">New Drops</h3>
                            <p className="mb-4 font-medium opacity-90">Limited edition sneakers</p>
                            <span className="border-b-2 border-[#ccff00] text-[#ccff00] pb-1 font-bold text-xs uppercase tracking-widest">View Collection</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {section.type === 'reviewsSection' && (
                      <div className="py-24 px-8 bg-white border-y border-gray-100">
                        <h2 className="text-3xl font-black uppercase tracking-tight text-center mb-16">{section.settings.title}</h2>
                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="bg-gray-50 p-8">
                              <div className="flex gap-1 text-black mb-6">{'★★★★★'}</div>
                              <p className="text-lg font-medium leading-relaxed mb-6">"The quality is absolutely insane. I've been wearing this every single day since it arrived."</p>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">— Verified Buyer</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'footer' && (
                      <div className="bg-[#111] text-white py-20 px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                          <div>
                            <h4 className="font-black uppercase tracking-widest mb-6">About</h4>
                            <div className="space-y-3 text-sm text-gray-400">
                              <p>Our Story</p>
                              <p>Careers</p>
                              <p>Press</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-black uppercase tracking-widest mb-6">Support</h4>
                            <div className="space-y-3 text-sm text-gray-400">
                              <p>FAQ</p>
                              <p>Shipping</p>
                              <p>Returns</p>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <h4 className="font-black uppercase tracking-widest mb-6">Join the Club</h4>
                            <p className="text-sm text-gray-400 mb-4">Subscribe for exclusive drops and 10% off your first order.</p>
                            <div className="flex">
                              <input type="email" placeholder="Email Address" className="bg-white/10 px-4 py-3 w-full text-sm outline-none focus:bg-white/20 transition-colors" />
                              <Button className="bg-white text-black px-6 py-3 h-auto rounded-none font-bold uppercase text-xs tracking-widest">Subscribe</Button>
                            </div>
                          </div>
                        </div>
                        <div className="pt-8 border-t border-white/10 flex justify-between items-center text-xs text-gray-500 font-medium">
                          <p>{section.settings.text}</p>
                          <div className="flex gap-4">
                            <span>Instagram</span>
                            <span>TikTok</span>
                            <span>Twitter</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── PREMIUM THEME SECTION PREVIEWS ─── */}

                    {section.type === 'hero' && (
                      <div className="relative overflow-hidden flex items-center justify-center min-h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 px-8 text-center">
                        <div>
                          <h1 className="text-4xl font-black text-gray-900 mb-3">{section.settings.title || 'Hero Title'}</h1>
                          <p className="text-gray-500 mb-6">{section.settings.subtitle || 'Subtitle text here'}</p>
                          <button className="px-8 py-3 rounded-full text-white font-bold text-sm" style={{ background: currentStore?.primaryColor || '#10b981' }}>{section.settings.buttonText || 'Shop Now'}</button>
                        </div>
                      </div>
                    )}

                    {section.type === 'promoBanner' && (
                      <div className="py-2.5 px-4 text-center text-xs font-bold tracking-widest uppercase"
                        style={{ backgroundColor: section.settings.backgroundColor || '#000', color: section.settings.textColor || '#fff' }}>
                        {section.settings.text || 'Free shipping on all orders!'}
                      </div>
                    )}

                    {section.type === 'categories' && (
                      <div className="py-12 px-8 bg-gray-50">
                        <h2 className="text-2xl font-black uppercase text-center mb-8">{section.settings.title || 'Shop by Category'}</h2>
                        <div className="grid grid-cols-4 gap-3">
                          {['Apparel','Accessories','Shoes','Bags'].map(c => (
                            <div key={c} className="p-4 bg-white rounded-xl text-center border border-gray-100 shadow-sm">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 mx-auto mb-2 flex items-center justify-center">🛍️</div>
                              <p className="text-xs font-semibold text-gray-800">{c}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'featuredProducts' && (
                      <div className="py-12 px-8">
                        <h2 className="text-2xl font-black uppercase mb-8">{section.settings.title || 'Featured Products'}</h2>
                        <div className="grid grid-cols-4 gap-4">
                          {[1,2,3,4].map(i => (
                            <div key={i}>
                              <div className="aspect-[3/4] bg-gray-100 rounded-xl mb-3 relative overflow-hidden">
                                <div className="absolute top-2 left-2 bg-white px-2 py-0.5 text-[9px] font-bold uppercase shadow-sm">NEW</div>
                              </div>
                              <p className="font-semibold text-xs text-gray-800">Product {i}</p>
                              <p className="text-xs text-gray-500 mt-0.5">₹2,499</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'trustBadges' && (
                      <div className="py-10 px-8 bg-white border-y border-gray-100">
                        <h2 className="text-xl font-bold text-center mb-6">{section.settings.title || 'Why Choose Us'}</h2>
                        <div className="flex justify-center gap-8">
                          {['Free Shipping','Secure Pay','Easy Returns','24/7 Support'].map((b,i) => (
                            <div key={i} className="flex flex-col items-center gap-2 text-center">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm" style={{ background: currentStore?.primaryColor || '#10b981' }}>✓</div>
                              <p className="text-xs font-semibold text-gray-700">{b}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'countdownTimer' && (
                      <div className="py-10 px-8 text-white text-center" style={{ background: currentStore?.primaryColor || '#10b981' }}>
                        <h2 className="text-lg font-black mb-4">{section.settings.title || 'Sale Ends In'}</h2>
                        <div className="flex justify-center gap-3">
                          {[{v:'08',l:'HRS'},{v:'34',l:'MIN'},{v:'12',l:'SEC'}].map(({v,l}) => (
                            <div key={l} className="bg-white/20 rounded-lg px-4 py-3 text-center min-w-[56px]">
                              <p className="text-2xl font-black">{v}</p>
                              <p className="text-[9px] font-bold opacity-80 tracking-widest mt-0.5">{l}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'slideshow' && (
                      <div className="relative min-h-[280px] bg-gray-900 flex items-center justify-center text-white text-center px-8 py-12">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest mb-2 opacity-50">Collection</p>
                          <h2 className="text-3xl font-black mb-4">{currentStore?.name || 'Store Name'}</h2>
                          <button className="px-6 py-2 bg-white text-gray-900 rounded-full font-bold text-xs">Shop Now</button>
                        </div>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {[0,1,2].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i===0?'bg-white':'bg-white/40'}`} />)}
                        </div>
                      </div>
                    )}

                    {section.type === 'richText' && (
                      <div className="py-16 px-8 text-center">
                        <h2 className="text-2xl font-black mb-4">{section.settings.title || 'Our Story'}</h2>
                        <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">{section.settings.content || 'We believe in quality craftsmanship and delivering exceptional products.'}</p>
                      </div>
                    )}

                    {section.type === 'video' && (
                      <div className="py-16 px-8 bg-gray-900 text-white text-center">
                        <h2 className="text-xl font-black mb-6">{section.settings.title || 'Watch Our Story'}</h2>
                        <div className="max-w-md mx-auto aspect-video bg-gray-800 rounded-2xl flex items-center justify-center">
                          <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-xl pl-1">▶</div>
                        </div>
                      </div>
                    )}

                    {section.type === 'lookbook' && (
                      <div className="py-12 px-8 bg-gray-900 text-white">
                        <h2 className="text-2xl font-black text-center mb-8">{section.settings.title || 'Lookbook'}</h2>
                        <div className="grid grid-cols-3 gap-3">
                          {[1,2,3,4,5,6].map(i => (
                            <div key={i} className={`bg-gray-800 rounded-xl ${i===1?'col-span-2 row-span-2':''} aspect-square flex items-center justify-center opacity-40`}>
                              <Sparkles className="w-6 h-6" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'promoTiles' && (
                      <div className="py-12 px-8">
                        <h2 className="text-xl font-black text-center mb-6">{section.settings.title || 'Shop by Style'}</h2>
                        <div className="grid grid-cols-4 gap-3">
                          {['New In','Best Sellers','Sale','Exclusive'].map((l,i) => (
                            <div key={i} className="aspect-[3/4] rounded-xl flex items-end p-4 cursor-pointer"
                              style={{ background: `linear-gradient(135deg, ${currentStore?.primaryColor || '#10b981'}${['99','77','55','33'][i]} 0%, ${currentStore?.primaryColor || '#10b981'}11 100%)` }}>
                              <div>
                                <p className="text-white font-black text-sm">{l}</p>
                                <p className="text-white/60 text-[10px] mt-0.5">Shop →</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'logoList' && (
                      <div className="py-8 px-8 border-y border-gray-100">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 text-center mb-5">{section.settings.title || 'As Featured In'}</p>
                        <div className="flex justify-center gap-8 opacity-30">
                          {['Forbes','Vogue','GQ','TechCrunch','Wired'].map(b => (
                            <p key={b} className="font-black text-base text-gray-800 tracking-tighter">{b}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'newsletter' && (
                      <div className="py-14 px-8 text-white text-center" style={{ background: currentStore?.primaryColor || '#10b981' }}>
                        <h2 className="text-2xl font-black mb-2">{section.settings.title || 'Join the Club'}</h2>
                        <p className="opacity-80 mb-6 text-sm">{section.settings.subtitle || 'Get exclusive deals and early drops.'}</p>
                        <div className="flex max-w-sm mx-auto gap-2">
                          <div className="flex-1 h-10 bg-white/20 rounded-full" />
                          <button className="px-6 h-10 bg-white rounded-full font-bold text-xs" style={{ color: currentStore?.primaryColor || '#10b981' }}>Subscribe</button>
                        </div>
                      </div>
                    )}

                    {section.type === 'faq' && (
                      <div className="py-12 px-8 bg-gray-50">
                        <h2 className="text-xl font-black text-center mb-6">{section.settings.title || 'FAQ'}</h2>
                        <div className="space-y-3 max-w-lg mx-auto">
                          {['What is your return policy?','How long does shipping take?','Do you ship internationally?'].map((q,i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
                              <p className="text-sm font-medium text-gray-800">{q}</p>
                              <span className="text-gray-400 text-lg">↓</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'blogPosts' && (
                      <div className="py-12 px-8">
                        <h2 className="text-xl font-black text-center mb-6">{section.settings.title || 'Latest News'}</h2>
                        <div className="grid grid-cols-3 gap-4">
                          {['Style Guide','Top Must-Haves','Care Tips'].map((t,i) => (
                            <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                              <div className="aspect-video bg-gray-100" />
                              <div className="p-3">
                                <p className="font-bold text-xs text-gray-900">{t}</p>
                                <p className="text-[10px] mt-1" style={{ color: currentStore?.primaryColor || '#10b981' }}>Read More →</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'imageGallery' && (
                      <div className="py-12 px-8">
                        <h2 className="text-xl font-black text-center mb-6">{section.settings.title || 'Gallery'}</h2>
                        <div className="grid grid-cols-4 gap-2">
                          {[1,2,3,4,5,6,7,8].map(i => (
                            <div key={i} className={`bg-gray-100 rounded-lg aspect-square ${i===1?'col-span-2 row-span-2':''}`} />
                          ))}
                        </div>
                      </div>
                    )}

                    {section.type === 'textWithImage' && (
                      <div className="py-12 px-8 flex gap-8 items-center">
                        <div className="flex-1 aspect-square bg-gray-100 rounded-2xl" />
                        <div className="flex-1">
                          <h2 className="text-2xl font-black text-gray-900 mb-3">{section.settings.title || 'About Us'}</h2>
                          <p className="text-gray-500 text-sm leading-relaxed">{section.settings.content || 'Quality craftsmanship for the modern world.'}</p>
                        </div>
                      </div>
                    )}

                    {section.type === 'contactForm' && (
                      <div className="py-12 px-8">
                        <h2 className="text-xl font-black text-center mb-6">{section.settings.title || 'Contact Us'}</h2>
                        <div className="max-w-sm mx-auto space-y-3">
                          {['Name','Email','Message'].map(p => (
                            <div key={p} className={`w-full border border-gray-200 rounded-xl px-4 ${p==='Message'?'h-20':'h-10'} bg-white flex items-start pt-3`}>
                              <p className="text-xs text-gray-300">{p}</p>
                            </div>
                          ))}
                          <button className="w-full h-10 rounded-xl text-white font-bold text-sm" style={{ background: currentStore?.primaryColor || '#10b981' }}>Send</button>
                        </div>
                      </div>
                    )}

                    {section.type === 'map' && (
                      <div className="py-12 px-8 bg-gray-50 text-center">
                        <h2 className="text-xl font-black mb-4">{section.settings.title || 'Find Us'}</h2>
                        <div className="h-48 bg-gray-200 rounded-2xl flex items-center justify-center max-w-lg mx-auto">
                          <p className="text-gray-400 text-sm">📍 Map Embed</p>
                        </div>
                      </div>
                    )}

                    {/* Highlight overlay for active state */}
                    {activeSectionId === section.id && (
                      <div className="absolute top-0 right-0 bg-[#005bd3] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl shadow-sm flex items-center gap-1">
                        {section.label}
                      </div>
                    )}
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="py-32 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                    <Layout className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Your store is empty. Add sections from the sidebar.</p>
                  </div>
                )}
              </div>

              {/* Footer Mock */}
              <div className="py-12 px-6 border-t border-gray-200 bg-white text-center text-sm text-gray-500">
                <p>&copy; 2026 {currentStore?.name || 'Store'}. Powered by Online Vepar.</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Section Settings */}
        {activeSection && (
          <div className="w-[320px] bg-white border-l border-[#dfe3e8] flex flex-col shadow-xl shrink-0 z-50 absolute right-0 top-14 bottom-0 animate-in slide-in-from-right-8 duration-200">
            <div className="p-4 border-b border-[#dfe3e8] flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
              <h3 className="font-semibold text-[14px] text-[#202223]">{activeSection.label}</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-gray-100 rounded-md" onClick={() => setActiveSectionId(null)}>
                <ArrowLeft className="w-4 h-4 text-gray-600 rotate-180" />
              </Button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto bg-[#f4f6f8] flex-1">
              {/* Hero Banner: dedicated grouped settings panel */}
              {activeSection.type === 'heroBannerAdvanced' && (
                <HeroBannerSettings
                  section={activeSection}
                  onUpdate={updateSectionSettings}
                  onImageUpload={triggerImageUpload}
                  primaryColor={currentStore?.primaryColor || '#10b981'}
                />
              )}

              {/* Generic settings: auto-rendered from section.settings keys */}
              {activeSection.type !== 'heroBannerAdvanced' && (
                <div className="space-y-5">
                  {Object.keys(activeSection.settings).filter(k => !k.startsWith('//')).map(key => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-[13px] font-medium text-[#202223] capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>

                      {key === 'count' || key === 'slideCount' || key === 'delay' || key === 'delaySeconds' || key === 'columns' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="1"
                            max="12"
                            value={activeSection.settings[key]}
                            onChange={(e) => updateSectionSettings(activeSection.id, key, parseInt(e.target.value) || 0)}
                            className="flex-1 accent-[#008060]"
                          />
                          <Input
                            type="number"
                            value={activeSection.settings[key]}
                            onChange={(e) => updateSectionSettings(activeSection.id, key, parseInt(e.target.value) || 0)}
                            className="text-[13px] h-8 w-16 border-[#c9cccf] bg-white text-center"
                          />
                        </div>
                      ) : key === 'imagePosition' ? (
                        <select
                          className="w-full text-[13px] border border-[#c9cccf] rounded-md p-1.5 bg-white text-[#202223] h-8 shadow-sm focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] outline-none"
                          value={activeSection.settings[key]}
                          onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                        >
                          <option value="left">Image first</option>
                          <option value="right">Text first</option>
                        </select>
                      ) : key.toLowerCase().includes('image') || key === 'videoUrl' ? (
                        <div className="space-y-2 p-3 bg-white border border-[#dfe3e8] rounded-lg shadow-sm">
                          {activeSection.settings[key] && key.toLowerCase().includes('image') ? (
                            <div className="w-full rounded-lg border border-[#dfe3e8] overflow-hidden bg-gray-50 relative group" style={{ aspectRatio: '16/9' }}>
                              <img src={activeSection.settings[key]} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <Button size="sm" className="h-7 text-xs bg-white text-gray-800 hover:bg-gray-100"
                                  onClick={() => triggerImageUpload(activeSection.id, key)}>
                                  <UploadCloud className="w-3 h-3 mr-1" /> Replace
                                </Button>
                                <Button size="sm" variant="destructive" className="h-7 text-xs"
                                  onClick={() => updateSectionSettings(activeSection.id, key, '')}>
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="w-full rounded-lg border-2 border-dashed border-[#c9cccf] bg-[#f9fafb] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#005bd3] hover:bg-[#f0f6ff] transition-colors py-8"
                              onClick={() => triggerImageUpload(activeSection.id, key)}
                            >
                              <div className="w-10 h-10 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                                <UploadCloud className="w-5 h-5 text-[#005bd3]" />
                              </div>
                              <p className="text-[13px] font-semibold text-[#202223]">Upload image</p>
                              <p className="text-[11px] text-[#6d7175]">JPG, PNG, WebP — click to browse</p>
                            </div>
                          )}
                          <div className="flex items-center gap-1 pt-1">
                            <div className="flex-1 h-px bg-[#dfe3e8]" />
                            <span className="text-[10px] text-[#8c9196] px-2">or paste URL</span>
                            <div className="flex-1 h-px bg-[#dfe3e8]" />
                          </div>
                          <Input
                            value={activeSection.settings[key]}
                            onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                            className="text-[12px] h-8 border-[#c9cccf] bg-white shadow-inner"
                            placeholder="https://..."
                          />
                        </div>
                      ) : key === 'code' ? (
                        <textarea
                          value={activeSection.settings[key]}
                          onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                          className="w-full text-[12px] font-mono border border-[#c9cccf] rounded-md p-3 bg-[#202223] text-[#47c1bf] min-h-[250px] shadow-inner focus:ring-1 focus:ring-[#005bd3] outline-none"
                          placeholder="<!-- HTML/CSS Code -->"
                        />
                      ) : key === 'content' || key === 'subtitle' || key === 'badges' || key === 'text' ? (
                        <textarea
                          value={activeSection.settings[key]}
                          onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                          className="w-full text-[13px] border border-[#c9cccf] rounded-md p-2 bg-white min-h-[100px] shadow-inner focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] outline-none"
                        />
                      ) : key === 'collectionId' || key === 'productId' ? (
                        <select
                          className="w-full text-[13px] border border-[#c9cccf] rounded-md p-1.5 bg-white text-[#202223] h-8 shadow-sm focus:border-[#005bd3] focus:ring-1 focus:ring-[#005bd3] outline-none"
                          value={activeSection.settings[key]}
                          onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                        >
                          <option value="">Select an option...</option>
                          <option value="col_1">Summer Collection</option>
                          <option value="col_2">Winter Wear</option>
                          <option value="col_3">New Arrivals</option>
                        </select>
                      ) : key.toLowerCase().includes('color') ? (
                        <div className="flex items-center gap-3 p-2 bg-white border border-[#dfe3e8] rounded-md shadow-sm">
                          <input type="color" value={activeSection.settings[key]} onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                          <Input value={activeSection.settings[key]} onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)} className="h-7 font-mono text-xs border-0 shadow-none bg-transparent focus-visible:ring-0 px-0 flex-1 uppercase" />
                        </div>
                      ) : (
                        <Input
                          value={activeSection.settings[key]}
                          onChange={(e) => updateSectionSettings(activeSection.id, key, e.target.value)}
                          className="text-[13px] h-8 border-[#c9cccf] bg-white shadow-inner focus-visible:ring-[#005bd3]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Remove Section button — always shown */}
              <div className="pt-4 border-t border-[#dfe3e8] mt-2">
                <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300" onClick={() => removeSection(activeSection.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Remove section
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
