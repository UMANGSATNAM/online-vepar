'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Store,
  Home,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Globe,
  FileText,
  Search,
  Menu,
  LogOut,
  ChevronDown,
  X,
  Command,
  Sun,
  Moon,
  Monitor,
  Plus,
  Tag,
  Warehouse,
  Truck,
  Star,
  Volume2,
  VolumeX,
  Sparkles,
  Clock,
  Receipt,
  ShoppingBag,
  Layers,
  CreditCard,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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

// --- Navigation Items ---
// Main nav (shown in sidebar and bottom nav)
const mainNavItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string }[] = [
  { view: 'dashboard', label: 'Home', icon: Home, shortcut: 'Alt+H' },
  { view: 'products', label: 'Products', icon: Package, shortcut: 'Alt+P' },
  { view: 'orders', label: 'Orders', icon: ShoppingCart, shortcut: 'Alt+O' },
  { view: 'customers', label: 'Customers', icon: Users, shortcut: 'Alt+C' },
  { view: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: 'Alt+A' },
]

// Secondary nav (shown only in sidebar)
const secondaryNavItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string; group: string }[] = [
  { view: 'collections', label: 'Collections', icon: Layers, shortcut: 'Alt+L', group: 'Catalog' },
  { view: 'discounts', label: 'Discounts', icon: Tag, shortcut: 'Alt+D', group: 'Catalog' },
  { view: 'reviews', label: 'Reviews', icon: Star, shortcut: 'Alt+R', group: 'Catalog' },
  { view: 'inventory', label: 'Inventory', icon: Warehouse, shortcut: 'Alt+I', group: 'Operations' },
  { view: 'shipping', label: 'Shipping', icon: Truck, shortcut: 'Alt+Shift+S', group: 'Operations' },
  { view: 'tax-rates', label: 'Tax Rates', icon: Receipt, shortcut: 'Alt+T', group: 'Operations' },
  { view: 'gift-cards', label: 'Gift Cards', icon: CreditCard, shortcut: 'Alt+G', group: 'Operations' },
  { view: 'abandoned-carts', label: 'Abandoned Carts', icon: ShoppingBag, group: 'Operations' },
  { view: 'activity', label: 'Activity Log', icon: Clock, group: 'Operations' },
  { view: 'staff', label: 'Staff', icon: Users, shortcut: 'Alt+Shift+T', group: 'Settings' },
  { view: 'store-settings', label: 'Settings', icon: Settings, shortcut: 'Alt+S', group: 'Settings' },
  { view: 'store-preview', label: 'Preview', icon: Globe, group: 'Settings' },
  { view: 'pages', label: 'Pages', icon: FileText, group: 'Settings' },
]

// Map views to breadcrumb labels
const viewLabels: Record<string, string> = {
  landing: 'Home',
  login: 'Login',
  register: 'Register',
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  'store-settings': 'Store Settings',
  'store-preview': 'Store Preview',
  analytics: 'Analytics',
  pages: 'Pages',
  'create-store': 'Create Store',
  discounts: 'Discounts',
  'gift-cards': 'Gift Cards',
  inventory: 'Inventory',
  shipping: 'Shipping',
  'tax-rates': 'Tax Rates',
  'abandoned-carts': 'Abandoned Carts',
  reviews: 'Reviews',
  activity: 'Activity Log',
  checkout: 'Storefront',
  collections: 'Collections',
  staff: 'Staff',
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="w-4 h-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')} className={theme === 'light' ? 'bg-accent' : ''}>
          <Sun className="w-4 h-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className={theme === 'dark' ? 'bg-accent' : ''}>
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className={theme === 'system' ? 'bg-accent' : ''}>
          <Monitor className="w-4 h-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// --- Sidebar Content Component (shared between Sheet and Desktop sidebar) ---
function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { currentView, setView, currentStore, stores, setStore, currentUser, logout } = useAppStore()
  const [soundEnabled, setSoundEnabled] = useState(true)

  const handleNav = (view: ViewType) => {
    setView(view)
    onNavigate?.()
  }

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 flex items-center gap-2 px-3 border-b border-border shrink-0">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Store className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
            <span className="text-base font-bold text-emerald-900 dark:text-emerald-100 whitespace-nowrap truncate">
              Online Vepar
            </span>
            <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              PRO
            </Badge>
          </div>
        )}
      </div>

      {/* Store selector */}
      {!collapsed && (
        <div className="px-3 py-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Select
              value={currentStore?.id || ''}
              onValueChange={(value) => {
                const store = stores.find((s) => s.id === value)
                if (store) setStore(store)
              }}
            >
              <SelectTrigger className="flex-1 h-8 text-xs border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200"
              onClick={() => handleNav('create-store')}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-1.5">
        <nav className="space-y-0.5">
          {/* Main nav items */}
          <div className="space-y-0.5">
            {!collapsed && <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Main</p>}
            {mainNavItems.map((item) => {
              const isActive = currentView === item.view
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full ${collapsed ? 'justify-center h-10' : 'justify-start gap-2.5 h-9 pl-3'} relative transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  onClick={() => handleNav(item.view)}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-600 rounded-r" />}
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                </Button>
              )
            })}
          </div>

          {/* Secondary nav groups */}
          {!collapsed && (
            <>
              {['Catalog', 'Operations', 'Settings'].map((group) => (
                <div key={group} className="mt-2 space-y-0.5">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{group}</p>
                  {secondaryNavItems
                    .filter((item) => item.group === group)
                    .map((item) => {
                      const isActive = currentView === item.view
                      return (
                        <Button
                          key={item.view}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start gap-2.5 h-9 pl-3 relative transition-all duration-150 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          onClick={() => handleNav(item.view)}
                        >
                          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-600 rounded-r" />}
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-sm whitespace-nowrap">{item.label}</span>
                        </Button>
                      )
                    })}
                </div>
              ))}
            </>
          )}

          {/* Collapsed secondary nav (icons only) */}
          {collapsed && (
            <>
              <div className="my-2 border-t border-border" />
              {secondaryNavItems.map((item) => {
                const isActive = currentView === item.view
                return (
                  <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-center h-10 relative transition-all duration-150 ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                        onClick={() => handleNav(item.view)}
                      >
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-600 rounded-r" />}
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </>
          )}

          {/* Visit Store */}
          <div className="mt-2 pt-2 border-t border-border">
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? 'justify-center h-10' : 'justify-start gap-2.5 h-9 pl-3'} text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30`}
              onClick={() => handleNav('checkout')}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm">Visit Store</span>}
            </Button>
          </div>
        </nav>
      </ScrollArea>

      {/* Sound toggle */}
      {!collapsed && (
        <div className="px-2 py-0.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 h-7 text-muted-foreground hover:text-foreground text-[11px]"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
        </div>
      )}

      {/* User profile */}
      <div className="border-t border-border p-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start gap-2'} h-auto p-2 hover:bg-accent transition-all duration-150`}
            >
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                </div>
              </div>
              {!collapsed && (
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{currentUser?.name || 'User'}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{currentUser?.email || ''}</div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleNav('store-settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                setView('landing')
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!collapsed && (
        <div className="px-3 py-1.5 border-t border-border shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">Online Vepar v1.0</p>
        </div>
      )}
    </div>
  )
}

// --- Mobile Bottom Navigation ---
function MobileBottomNav() {
  const { currentView, setView } = useAppStore()
  const [showMore, setShowMore] = useState(false)

  const bottomNavItems = [
    { view: 'dashboard' as ViewType, label: 'Home', icon: Home },
    { view: 'products' as ViewType, label: 'Products', icon: Package },
    { view: 'orders' as ViewType, label: 'Orders', icon: ShoppingCart },
    { view: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
  ]

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              className="fixed bottom-16 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">More Options</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowMore(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {secondaryNavItems.map((item) => {
                  const isActive = currentView === item.view
                  return (
                    <button
                      key={item.view}
                      className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-foreground hover:bg-accent'
                      }`}
                      onClick={() => {
                        setView(item.view)
                        setShowMore(false)
                      }}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm">{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {bottomNavItems.map((item) => {
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setView(item.view)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
          {/* More button */}
          <button
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] ${
              showMore || secondaryNavItems.some((i) => i.view === currentView)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setShowMore(!showMore)}
          >
            <LayoutGrid className={`w-5 h-5 ${showMore ? 'scale-110' : ''} transition-transform`} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default function DashboardLayout() {
  const {
    currentView,
    setView,
    currentUser,
    currentStore,
    stores,
    setStore,
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    logout,
  } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Keyboard shortcut for global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Track scroll for header shadow
  useEffect(() => {
    const mainContent = document.getElementById('main-content')
    if (!mainContent) return
    const handleScroll = () => {
      setScrolled(mainContent.scrollTop > 0)
    }
    mainContent.addEventListener('scroll', handleScroll)
    return () => mainContent.removeEventListener('scroll', handleScroll)
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardHome />
      case 'products':
        return <ProductsPage />
      case 'orders':
        return <OrdersPage />
      case 'customers':
        return <CustomersPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'store-settings':
        return <StoreSettings />
      case 'store-preview':
        return <StorePreview />
      case 'pages':
        return <PagesPage />
      case 'discounts':
        return <DiscountsPage />
      case 'inventory':
        return <InventoryPage />
      case 'shipping':
        return <ShippingPage />
      case 'tax-rates':
        return <TaxRatesPage />
      case 'abandoned-carts':
        return <AbandonedCartsPage />
      case 'reviews':
        return <ReviewsPage />
      case 'activity':
        return <ActivityLogPage />
      case 'collections':
        return <CollectionsPage />
      case 'gift-cards':
        return <GiftCardsPage />
      case 'staff':
        return <StaffPage />
      case 'create-store':
        return <CreateStoreDialog />
      default:
        return <DashboardHome />
    }
  }

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <motion.aside
            className="hidden lg:flex flex-col border-r border-border overflow-hidden shrink-0 sticky top-0 h-screen"
            animate={{ width: sidebarOpen ? 240 : 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              background: sidebarOpen
                ? 'linear-gradient(180deg, oklch(0.96 0.04 155 / 0.5) 0%, oklch(0.94 0.02 155 / 0.2) 40%, var(--card) 100%)'
                : undefined,
            }}
          >
            <div className="absolute inset-0 hidden dark:block pointer-events-none"
              style={{
                background: sidebarOpen
                  ? 'linear-gradient(180deg, oklch(0.2 0.03 155 / 0.6) 0%, oklch(0.16 0.02 155 / 0.3) 40%, var(--card) 100%)'
                  : undefined,
              }}
            />
            <div className="relative z-10 h-full">
              <SidebarContent
                collapsed={!sidebarOpen}
                onNavigate={() => {}}
              />
            </div>
          </motion.aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top header */}
            <header className={`h-14 border-b border-border bg-card flex items-center gap-2 px-3 lg:px-5 transition-shadow duration-200 shrink-0 ${scrolled ? 'shadow-sm' : ''}`}>
              {/* Mobile: hamburger opens Sheet */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-9 w-9">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </SheetHeader>
                  <SidebarContent
                    onNavigate={() => setMobileMenuOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              {/* Breadcrumbs */}
              <div className="hidden md:block shrink-0">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className="cursor-pointer text-muted-foreground"
                        onClick={() => setView('dashboard')}
                      >
                        {currentStore?.name || 'My Store'}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-foreground font-medium text-sm">
                        {viewLabels[currentView] || 'Dashboard'}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              {/* Mobile: current page title */}
              <div className="md:hidden shrink-0">
                <h2 className="text-sm font-semibold text-foreground">
                  {viewLabels[currentView] || 'Dashboard'}
                </h2>
              </div>

              {/* Search */}
              <div className="flex-1 max-w-xs mx-auto lg:mx-0 lg:max-w-sm">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-10 bg-background border-border h-8 text-sm focus:ring-1 focus:ring-emerald-500 transition-shadow pointer-events-none"
                    readOnly
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center pointer-events-none">
                    <kbd className="inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
                      <Command className="w-2 h-2" />K
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Visit Store */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-1 h-7 text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  onClick={() => setView('checkout')}
                >
                  <Globe className="w-3 h-3" />
                  <span className="hidden md:inline">Visit Store</span>
                </Button>

                {/* Theme toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationsPanel />

                {/* User avatar (mobile) */}
                <Avatar className="h-7 w-7 lg:hidden">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>

            {/* Page content */}
            <main id="main-content" className="flex-1 overflow-auto pb-16 lg:pb-0">
              <div className="p-3 lg:p-5 max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />

        {/* Global Search Dialog */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Collapse toggle for desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed bottom-4 left-0 z-50 w-5 h-10 rounded-none rounded-r-md bg-card border border-border border-l-0 hover:bg-accent transition-colors"
          onClick={toggleSidebar}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`}
          />
        </Button>
      </div>
    </TooltipProvider>
  )
}
