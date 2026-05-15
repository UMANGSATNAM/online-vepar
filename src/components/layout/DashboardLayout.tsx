'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Store, Home, Package, ShoppingCart, Users, BarChart3, Settings, Globe, FileText, Search, Menu, LogOut, ChevronDown, X, Command, Sun, Moon, Monitor, Plus, Tag, Warehouse, Truck, Star, Clock, Receipt, ShoppingBag, Layers, CreditCard, LayoutGrid, ChevronRight, PanelLeftClose, PanelLeftOpen, Shield, Bell, Zap, Database, Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useAppStore, type ViewType } from '@/lib/store'
import { useMounted } from '@/hooks/use-mounted'
import DashboardHome from '@/components/dashboard/DashboardHome'
import ProductsPage from '@/components/products/ProductsPage'
import OrdersPage from '@/components/orders/OrdersPage'
import CustomersPage from '@/components/customers/CustomersPage'
import StoreSettings from '@/components/store/StoreSettings'
import StorePreview from '@/components/store/StorePreview'
import AnalyticsPage from '@/components/analytics/AnalyticsPage'
import FinancePage from '@/components/finance/FinancePage'
import PagesPage from '@/components/pages/PagesPage'
import CreateStoreDialog from '@/components/store/CreateStoreDialog'
import DiscountsPage from '@/components/discounts/DiscountsPage'
import InventoryPage from '@/components/inventory/InventoryPage'
import ShippingPage from '@/components/shipping/ShippingPage'
import TaxRatesPage from '@/components/tax/TaxRatesPage'
import AbandonedCartsPage from '@/components/abandoned-carts/AbandonedCartsPage'
import ReviewsPage from '@/components/reviews/ReviewsPage'
import ActivityLogPage from '@/components/activity/ActivityLogPage'
import CollectionsPage from '@/components/collections/CollectionsPage'
import GiftCardsPage from '@/components/gift-cards/GiftCardsPage'
import StaffPage from '@/components/staff/StaffPage'
import NotificationsPanel from '@/components/layout/NotificationsPanel'
import GlobalSearch from '@/components/layout/GlobalSearch'
import DomainSettings from '@/components/store/DomainSettings'
import BillingSettings from '@/components/store/BillingSettings'
import SeoSettings from '@/components/store/SeoSettings'
import StoreEditor from '@/components/store/StoreEditor'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import MetafieldsPage from '@/components/metafields/MetafieldsPage'

const navItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; parent?: string }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  
  { view: 'orders', label: 'Orders', icon: ShoppingCart },
  { view: 'draft-orders', label: 'Draft Orders', icon: FileText, parent: 'Orders' },
  { view: 'abandoned-checkouts', label: 'Abandoned Checkouts', icon: ShoppingBag, parent: 'Orders' },
  { view: 'returns', label: 'Returns', icon: Truck, parent: 'Orders' },

  { view: 'products', label: 'Products', icon: Package },
  { view: 'collections', label: 'Collections', icon: Layers, parent: 'Products' },
  { view: 'inventory', label: 'Inventory', icon: Warehouse, parent: 'Products' },
  { view: 'transfers', label: 'Transfers', icon: Truck, parent: 'Products' },
  { view: 'purchase-orders', label: 'Purchase Orders', icon: Receipt, parent: 'Products' },
  { view: 'gift-cards', label: 'Gift Cards', icon: CreditCard, parent: 'Products' },

  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'segments', label: 'Segments', icon: Users, parent: 'Customers' },

  { view: 'marketing', label: 'Marketing', icon: Star },
  { view: 'automations', label: 'Automations', icon: Zap, parent: 'Marketing' },
  { view: 'activity', label: 'Activity', icon: Clock, parent: 'Marketing' },

  { view: 'discounts', label: 'Discounts', icon: Tag },

  { view: 'content', label: 'Content', icon: FileText },
  { view: 'pages', label: 'Pages', icon: FileText, parent: 'Content' },
  { view: 'blog-posts', label: 'Blog Posts', icon: FileText, parent: 'Content' },
  { view: 'menus', label: 'Navigation', icon: LayoutGrid, parent: 'Content' },
  { view: 'files', label: 'Files', icon: Database, parent: 'Content' },
  { view: 'metaobjects', label: 'Metaobjects', icon: Database, parent: 'Content' },

  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'reports', label: 'Reports', icon: BarChart3, parent: 'Analytics' },
  { view: 'live-view', label: 'Live View', icon: Globe, parent: 'Analytics' },

  { view: 'online-store', label: 'Online Store', icon: Globe },
  { view: 'themes', label: 'Themes', icon: LayoutGrid, parent: 'Online Store' },
  { view: 'domains', label: 'Domains', icon: Globe, parent: 'Online Store' },
  { view: 'preferences', label: 'Preferences', icon: Settings, parent: 'Online Store' },

  { view: 'apps', label: 'Apps', icon: Package },
]

const viewLabels: Record<string, string> = {
  dashboard: 'Home', products: 'Products', orders: 'Orders', customers: 'Customers',
  analytics: 'Analytics', finance: 'Finance', 'store-settings': 'Settings', 'store-preview': 'Store Preview',
  pages: 'Pages', 'create-store': 'Create Store', discounts: 'Discounts', 'gift-cards': 'Gift Cards',
  inventory: 'Inventory', shipping: 'Shipping', 'tax-rates': 'Tax Rates',
  'abandoned-checkouts': 'Abandoned Checkouts', reviews: 'Reviews', activity: 'Activity Log',
  collections: 'Collections', staff: 'Staff', 'domains': 'Domains',
  billing: 'Billing & Plan', 'seo-settings': 'SEO & Marketing', 'store-editor': 'Theme Editor',
  metaobjects: 'Metaobjects', marketing: 'Marketing', content: 'Content', 'online-store': 'Online Store', apps: 'Apps',
  'draft-orders': 'Draft Orders', 'returns': 'Returns', 'transfers': 'Transfers', 'purchase-orders': 'Purchase Orders',
  'segments': 'Segments', 'automations': 'Automations', 'blog-posts': 'Blog Posts', 'menus': 'Navigation',
  'files': 'Files', 'reports': 'Reports', 'live-view': 'Live View', 'themes': 'Themes', 'preferences': 'Preferences'
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground">This module is currently under construction and will be available in the next platform update.</p>
    </div>
  )
}

function NavItem({ view, label, icon: Icon, collapsed, active, isSubitem, onClick }: { view: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed?: boolean; active?: boolean; isSubitem?: boolean; onClick: () => void }) {
  const btn = (
    <button onClick={onClick} className={`relative w-full flex items-center gap-3 py-1.5 rounded-lg text-sm transition-all duration-150 group ${
      active
        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 font-medium'
    } ${collapsed ? 'justify-center px-2' : isSubitem ? 'px-3 pl-9 text-[13px]' : 'px-3'}`}>
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r-full" />}
      {!isSubitem && <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 ${active ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-110'}`} />}
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  )
  if (!collapsed) return btn
  return (
    <Tooltip>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{label}</TooltipContent>
    </Tooltip>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  if (!mounted) return <Button variant="ghost" size="icon" className="h-8 w-8"><Sun className="w-4 h-4" /></Button>
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : theme === 'light' ? <Sun className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}><Sun className="w-4 h-4 mr-2" />Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}><Moon className="w-4 h-4 mr-2" />Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}><Monitor className="w-4 h-4 mr-2" />System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Sidebar({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { currentView, setView, currentStore, stores, setStore, currentUser, logout } = useAppStore()
  const nav = (v: ViewType) => { setView(v); onNavigate?.() }
  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const storeInit = currentStore?.name?.[0]?.toUpperCase() || 'S'

  const handleVisitStore = () => {
    if (!currentStore) return
    const isDev = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'onlinevepar.com'
    
    if (currentStore.domain) {
      window.open(`https://${currentStore.domain}`, '_blank')
    } else {
      if (isDev) {
        window.open(`http://${currentStore.slug}.localhost:3000`, '_blank')
      } else if (platformDomain.includes('up.railway.app')) {
        // Railway free domains don't support wildcard subdomains natively
        window.open(`https://${platformDomain}/store/${currentStore.slug}`, '_blank')
      } else {
        window.open(`https://${currentStore.slug}.${platformDomain}`, '_blank')
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-card border-r border-border/60">
      {/* Logo */}
      <div className={`h-14 flex items-center shrink-0 border-b border-border/40 ${collapsed ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
          <Store className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-sm font-bold truncate">Online Vepar</span>
            <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-0 text-[9px] px-1.5 h-4 font-bold shrink-0">PRO</Badge>
          </div>
        )}
      </div>

      {/* Store Selector */}
      {!collapsed ? (
        <div className="px-3 py-2.5 border-b border-border/40 shrink-0">
          <div className="flex gap-1.5">
            <Select value={currentStore?.id || ''} onValueChange={v => { const s = stores.find(x => x.id === v); if (s) setStore(s) }}>
              <SelectTrigger className="flex-1 h-8 text-xs border-border/50 bg-muted/30 hover:bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 bg-blue-600/10 rounded flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-400">{storeInit}</span>
                  </div>
                  <SelectValue placeholder="Select store" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8 shrink-0 border-border/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 hover:border-blue-200 rounded-lg" onClick={() => nav('create-store')}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Store</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 border-b border-border/40 shrink-0 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 bg-blue-600/10 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-600/20 transition-colors">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{storeInit}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">{currentStore?.name || 'Select Store'}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Nav */}
      <ScrollArea className="flex-1 min-h-0 py-2">
        <nav className={`space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.filter(item => !item.parent).map(item => (
            <div key={item.view} className="space-y-0.5">
              <NavItem {...item} collapsed={collapsed} active={currentView === item.view} onClick={() => nav(item.view as ViewType)} />
              
              {/* Render sub-items if not collapsed */}
              {!collapsed && navItems.filter(sub => sub.parent === item.label).map(subItem => (
                <NavItem key={subItem.view} {...subItem} isSubitem collapsed={collapsed} active={currentView === subItem.view} onClick={() => nav(subItem.view as ViewType)} />
              ))}
            </div>
          ))}
          
          <div className="my-4 border-t border-border/40" />
          <NavItem view="store-settings" label="Settings" icon={Settings} collapsed={collapsed} active={currentView === 'store-settings'} onClick={() => nav('store-settings')} />
        </nav>
      </ScrollArea>

      {/* Visit Store */}
      <div className={`border-t border-border/40 py-2 ${collapsed ? 'px-2' : 'px-3'}`}>
        <NavItem view="checkout" label="Visit Store" icon={Globe} collapsed={collapsed} onClick={handleVisitStore} />
      </div>

      {/* User */}
      <div className="border-t border-border/40 p-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-full flex items-center ${collapsed ? 'justify-center p-1' : 'gap-2.5 px-2 py-1.5'} hover:bg-accent/60 rounded-lg transition-colors`}>
              <div className="relative shrink-0">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/60 dark:to-indigo-900/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-card" />
              </div>
              {!collapsed && (
                <div className="text-left flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{currentUser?.name || 'User'}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{currentUser?.email || ''}</div>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {(currentUser as { role?: string })?.role === 'superadmin' && (
              <>
                <DropdownMenuItem onClick={() => window.open('/admin', '_blank')}>
                  <Shield className="w-4 h-4 mr-2 text-violet-500" /><span className="text-violet-600 font-medium">Super Admin</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => nav('store-settings')}><Settings className="w-4 h-4 mr-2" />Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { logout(); setView('landing') }}>
              <LogOut className="w-4 h-4 mr-2" />Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!collapsed && <p className="text-[9px] text-muted-foreground/30 text-center mt-1.5">Online Vepar v2.0</p>}
      </div>
    </div>
  )
}

function renderContent(view: string) {
  switch (view) {
    case 'dashboard': return <DashboardHome />
    case 'products': return <ProductsPage />
    case 'orders': return <OrdersPage />
    case 'customers': return <CustomersPage />
    case 'analytics': return <AnalyticsPage />
    case 'finance': return <FinancePage />
    case 'store-settings': return <StoreSettings />
    case 'store-preview': return <StorePreview />
    case 'pages': return <PagesPage />
    case 'discounts': return <DiscountsPage />
    case 'inventory': return <InventoryPage />
    case 'shipping': return <ShippingPage />
    case 'tax-rates': return <TaxRatesPage />
    case 'abandoned-checkouts': return <AbandonedCartsPage />
    case 'reviews': return <ReviewsPage />
    case 'activity': return <ActivityLogPage />
    case 'collections': return <CollectionsPage />
    case 'gift-cards': return <GiftCardsPage />
    case 'staff': return <StaffPage />
    case 'create-store': return <CreateStoreDialog />
    case 'domains': return <DomainSettings />
    case 'billing': return <BillingSettings />
    case 'seo-settings': return <SeoSettings />
    case 'store-editor': return <StoreEditor />
    case 'metaobjects': return <MetafieldsPage />
    
    // Fallback for currently unmapped nav items
    case 'draft-orders':
    case 'returns':
    case 'transfers':
    case 'purchase-orders':
    case 'segments':
    case 'automations':
    case 'blog-posts':
    case 'menus':
    case 'files':
    case 'reports':
    case 'live-view':
    case 'themes':
    case 'preferences':
    case 'apps':
      return <PlaceholderPage title={viewLabels[view] || view} />
      
    default: return <DashboardHome />
  }
}

export default function DashboardLayout() {
  const { currentView, setView, currentUser, currentStore, sidebarOpen, toggleSidebar } = useAppStore()
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const initials = currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const handleVisitStore = () => {
    if (!currentStore) return
    const isDev = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'onlinevepar.com'
    
    if (currentStore.domain) {
      window.open(`https://${currentStore.domain}`, '_blank')
    } else {
      if (isDev) {
        window.open(`http://${currentStore.slug}.localhost:3000`, '_blank')
      } else if (platformDomain.includes('up.railway.app')) {
        // Railway free domains don't support wildcard subdomains natively
        window.open(`https://${platformDomain}/store/${currentStore.slug}`, '_blank')
      } else {
        window.open(`https://${currentStore.slug}.${platformDomain}`, '_blank')
      }
    }
  }

  useEffect(() => {
    const el = document.getElementById('main-content')
    if (!el) return
    const h = () => setScrolled(el.scrollTop > 4)
    el.addEventListener('scroll', h)
    return () => el.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(p => !p) } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen flex bg-background">
        {/* Desktop Sidebar */}
        <motion.aside
          className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 overflow-hidden"
          animate={{ width: sidebarOpen ? 232 : 52 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        >
          <Sidebar collapsed={!sidebarOpen} />
        </motion.aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Header */}
          <header className={`h-14 shrink-0 flex items-center gap-2 px-4 border-b border-border/50 bg-card/80 backdrop-blur-sm transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8"><Menu className="w-4 h-4" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle></SheetHeader>
                <Sidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="hidden md:block">
              <Breadcrumb>
                <BreadcrumbList className="text-xs">
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-pointer text-muted-foreground/60 hover:text-foreground transition-colors" onClick={() => setView('dashboard')}>
                      {currentStore?.name || 'My Store'}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-muted-foreground/30" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">{viewLabels[currentView] || 'Dashboard'}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="md:hidden text-sm font-semibold">{viewLabels[currentView] || 'Dashboard'}</div>

            <div className="flex-1" />

            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-border/50 bg-muted/30 text-muted-foreground text-xs hover:bg-muted/60 hover:border-border transition-all max-w-[200px] xl:max-w-[240px]">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 text-left truncate">Search...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1 font-mono text-[9px] text-muted-foreground/70 shrink-0">
                <Command className="w-2 h-2" />K
              </kbd>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleSidebar}>
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" className="hidden sm:flex h-7 gap-1.5 text-[11px] border-border/50 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" onClick={handleVisitStore}>
                <Globe className="w-3 h-3" /><span className="hidden md:inline">Visit Store</span>
              </Button>
              <ThemeToggle />
              <NotificationsPanel />
              <Avatar className="h-7 w-7 lg:hidden">
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-[10px] font-bold">{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Content */}
          <main id="main-content" className="flex-1 overflow-auto pb-20 lg:pb-0">
            <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {renderContent(currentView)}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/40 safe-bottom">
          <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
            {[
              { view: 'dashboard' as ViewType, label: 'Home', icon: Home },
              { view: 'orders' as ViewType, label: 'Orders', icon: ShoppingCart },
              { view: 'products' as ViewType, label: 'Products', icon: Package },
              { view: 'customers' as ViewType, label: 'Customers', icon: Users },
              { view: 'analytics' as ViewType, label: 'More', icon: LayoutGrid },
            ].map(item => {
              const active = currentView === item.view
              return (
                <button key={item.view} onClick={() => setView(item.view)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl min-w-[54px] transition-all ${active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                  <div className={`p-1 rounded-lg transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <item.icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </nav>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        
        <AnimatePresence>
          {currentStore?.kycStatus === 'pending' && <OnboardingWizard />}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  )
}
