'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Layout, Settings, Save, Move, Plus, Trash2, 
  Eye, Monitor, Tablet, Smartphone, ChevronDown, Type, Image as ImageIcon, Sparkles
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
  { type: 'hero', label: 'Hero Banner', icon: Sparkles, defaultSettings: { title: 'Welcome to our store', subtitle: 'Discover amazing products', buttonText: 'Shop Now' } },
  { type: 'slideshow', label: 'Slideshow', icon: ImageIcon, defaultSettings: { slideCount: 3, delay: 5 } },
  { type: 'categories', label: 'Categories List', icon: Layout, defaultSettings: { title: 'Shop by Category' } },
  { type: 'featuredProducts', label: 'Featured Products', icon: Layout, defaultSettings: { title: 'Featured Products', count: 4, collectionId: '' } },
  { type: 'allProducts', label: 'All Products Grid', icon: Layout, defaultSettings: { title: 'All Products' } },
  { type: 'textWithImage', label: 'Text with Image', icon: ImageIcon, defaultSettings: { title: 'Our Story', content: 'We make the best products...', imagePosition: 'left' } },
  { type: 'promoBanner', label: 'Promo Banner', icon: Sparkles, defaultSettings: { text: 'Free shipping on orders over $50!', backgroundColor: '#000000', textColor: '#ffffff' } },
  { type: 'countdownTimer', label: 'Countdown Timer', icon: Sparkles, defaultSettings: { title: 'Flash Sale Ends In:', targetDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] } },
  { type: 'trustBadges', label: 'Trust Badges', icon: Sparkles, defaultSettings: { title: 'Why shop with us?', badges: 'Free Shipping, 30-Day Returns, Secure Checkout' } },
  { type: 'faq', label: 'FAQ Accordion', icon: Type, defaultSettings: { title: 'Frequently Asked Questions' } },
  { type: 'testimonials', label: 'Testimonials', icon: Type, defaultSettings: { title: 'What Customers Say' } },
  { type: 'newsletter', label: 'Newsletter Signup', icon: Type, defaultSettings: { title: 'Subscribe to our newsletter', subtitle: 'Get 10% off your first order' } },
]

// Pre-made template configurations
const PREMADE_TEMPLATES = [
  { id: 't1', name: 'Minimal Fashion', niche: 'Fashion', primaryColor: '#111827', theme: 'minimal', sections: [
    { id: '1', type: 'promoBanner', label: 'Promo Banner', settings: { text: 'Free Worldwide Shipping on all orders', backgroundColor: '#111827', textColor: '#ffffff' } },
    { id: '2', type: 'hero', label: 'Hero Banner', settings: { title: 'Summer Collection 2026', subtitle: 'Elevate your everyday style.', buttonText: 'Explore Now' } },
    { id: '3', type: 'categories', label: 'Categories List', settings: { title: 'Shop by Category' } },
    { id: '4', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Trending Now', count: 4 } },
    { id: '5', type: 'textWithImage', label: 'Text with Image', settings: { title: 'Sustainable Fashion', content: 'We believe in ethical manufacturing...', imagePosition: 'left' } },
    { id: '6', type: 'newsletter', label: 'Newsletter', settings: { title: 'Join our club', subtitle: 'Get exclusive offers directly to your inbox.' } }
  ]},
  { id: 't2', name: 'Tech Gadgets Pro', niche: 'Electronics', primaryColor: '#2563eb', theme: 'modern', sections: [
    { id: '1', type: 'slideshow', label: 'Slideshow', settings: { slideCount: 3, delay: 5 } },
    { id: '2', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Premium Guarantees', badges: '2 Year Warranty, Next Day Delivery, 24/7 Support' } },
    { id: '3', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'New Arrivals', count: 8 } },
    { id: '4', type: 'countdownTimer', label: 'Countdown Timer', settings: { title: 'Deal of the Week Ends In:', targetDate: new Date(Date.now() + 172800000).toISOString().split('T')[0] } },
    { id: '5', type: 'faq', label: 'FAQ', settings: { title: 'Got Questions?' } }
  ]},
  { id: 't3', name: 'Organic Beauty', niche: 'Beauty', primaryColor: '#059669', theme: 'classic', sections: [
    { id: '1', type: 'hero', label: 'Hero Banner', settings: { title: 'Pure. Natural. You.', subtitle: 'Skincare powered by nature.', buttonText: 'Shop Skincare' } },
    { id: '2', type: 'categories', label: 'Categories List', settings: { title: 'Our Lines' } },
    { id: '3', type: 'featuredProducts', label: 'Featured Products', settings: { title: 'Bestsellers', count: 4 } },
    { id: '4', type: 'testimonials', label: 'Testimonials', settings: { title: 'Real Results' } },
    { id: '5', type: 'trustBadges', label: 'Trust Badges', settings: { title: 'Our Promise', badges: 'Cruelty Free, 100% Vegan, Recyclable Packaging' } }
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
  const [activeTab, setActiveTab] = useState<'templates' | 'sections' | 'theme'>('sections')
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

  return (
    <div className="flex h-[calc(100vh-100px)] -mx-4 lg:-mx-6 -my-4 lg:-my-6 bg-muted/30 overflow-hidden">
      
      {/* LEFT SIDEBAR: Tools & Sections list */}
      <div className="w-80 border-r bg-card flex flex-col shadow-sm z-10 shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Layout className="w-5 h-5 text-emerald-600" />
            Store Editor
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Customize your storefront layout</p>
        </div>

        <div className="flex border-b">
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'templates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('templates')}
          >
            Templates
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'sections' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('sections')}
          >
            Sections
          </button>
          <button 
            className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'theme' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('theme')}
          >
            Theme
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-300">Applying a template will overwrite your current layout sections and colors.</p>
              </div>
              <div className="space-y-3">
                {PREMADE_TEMPLATES.map(template => (
                  <div key={template.id} className="border rounded-lg p-3 hover:border-emerald-400 transition-colors cursor-pointer bg-card" 
                       onClick={() => {
                         if(confirm(`Apply the ${template.name} template? This will replace your current sections.`)) {
                           setSections(template.sections)
                           toast({ title: 'Template Applied', description: `Loaded ${template.name} layout.` })
                           setActiveTab('sections')
                         }
                       }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{template.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">{template.niche}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full border" style={{ background: template.primaryColor }}></div>
                      <span className="text-xs text-muted-foreground">{template.sections.length} Sections</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs">Apply Template</Button>
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

          {activeTab === 'theme' && (
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
        
        <div className="p-4 border-t bg-muted/10">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={isSaving}>
            <Save className={`w-4 h-4 mr-2 ${isSaving ? 'animate-pulse' : ''}`} /> 
            {isSaving ? 'Saving...' : 'Save Store Layout'}
          </Button>
        </div>
      </div>

      {/* CENTER PREVIEW AREA */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
          <div className="flex bg-muted p-1 rounded-lg">
            <Button variant={viewport === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewport('desktop')}>
              <Monitor className="w-4 h-4" />
            </Button>
            <Button variant={viewport === 'tablet' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewport('tablet')}>
              <Tablet className="w-4 h-4" />
            </Button>
            <Button variant={viewport === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewport('mobile')}>
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="w-4 h-4" /> Live Preview
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
          <motion.div 
            layout
            className="bg-background shadow-xl rounded-b-xl border transition-all duration-300 overflow-hidden"
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
                
                {key === 'count' ? (
                  <Input 
                    type="number" 
                    value={activeSection.settings[key]} 
                    onChange={(e) => updateSectionSettings(activeSection.id, key, parseInt(e.target.value) || 4)}
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
                ) : key === 'content' || key === 'subtitle' ? (
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
                    <option value="col_1">Summer Collection</option>
                    <option value="col_2">Winter Wear</option>
                  </select>
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
  )
}
