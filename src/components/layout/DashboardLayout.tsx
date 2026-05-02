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
  Clock,
  Receipt,
  ShoppingBag,
  Layers,
  CreditCard,
  LayoutGrid,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
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
const mainNavItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  { view: 'products', label: 'Products', icon: Package },
  { view: 'orders', label: 'Orders', icon: ShoppingCart },
  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
]

const secondaryNavItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { view: 'collections', label: 'Collections', icon: Layers, group: 'Catalog' },
  { view: 'discounts', label: 'Discounts', icon: Tag, group: 'Catalog' },
  { view: 'reviews', label: 'Reviews', icon: Star, group: 'Catalog' },
  { view: 'inventory', label: 'Inventory', icon: Warehouse, group: 'Operations' },
  { view: 'shipping', label: 'Shipping', icon: Truck, group: 'Operations' },
  { view: 'tax-rates', label: 'Tax Rates', icon: Receipt, group: 'Operations' },
  { view: 'gift-cards', label: 'Gift Cards', icon: CreditCard, group: 'Operations' },
  { view: 'abandoned-carts', label: 'Abandoned Carts', icon: ShoppingBag, group: 'Operations' },
  { view: 'activity', label: 'Activity Log', icon: Clock, group: 'Operations' },
  { view: 'staff', label: 'Staff', icon: Users, group: 'Settings' },
  { view: 'store-settings', label: 'Settings', icon: Settings, group: 'Settings' },
  { view: 'store-preview', label: 'Preview', icon: Globe, group: 'Settings' },
  { view: 'pages', label: 'Pages', icon: FileText, group: 'Settings' },
]

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
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="w-4 h-4 text-muted-foreground" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Sun className="w-[16px] h-[16px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-[16px] h-[16px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
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

// --- Sidebar Content ---
function SidebarContent({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { currentView, setView, currentStore, stores, setStore, currentUser, logout } = useAppStore()

  const handleNav = (view: ViewType) => {
    setView(view)
    onNavigate?.()
  }

  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const storeInitial = currentStore?.name?.[0]?.toUpperCase() || 'S'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo Header */}
      <div className="h-14 flex items-center gap-2.5 px-3 border-b border-border/60 shrink-0">
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <Store className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
            <span className="text-[15px] font-bold text-foreground whitespace-nowrap truncate">
              Online Vepar
            </span>
            <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-0 text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0">
              PRO
            </Badge>
          </div>
        )}
      </div>

      {/* Store Selector */}
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
              <SelectTrigger className="flex-1 h-9 text-xs border-border/80 bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 rounded flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">{storeInitial}</span>
                  </div>
                  <SelectValue placeholder="Select store" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/50 rounded flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{store.name[0]?.toUpperCase()}</span>
                      </div>
                      {store.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9 shrink-0 border-border/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200"
                  onClick={() => handleNav('create-store')}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Create Store</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Collapsed store indicator */}
      {collapsed && (
        <div className="px-2 py-2 shrink-0 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/70 transition-colors">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{storeInitial}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>{currentStore?.name || 'Select Store'}</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 px-2 py-1.5">
        <nav className="space-y-0.5">
          {/* Main nav */}
          <div className="space-y-0.5">
            {!collapsed && <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">Main</p>}
            {mainNavItems.map((item) => {
              const isActive = currentView === item.view
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full ${collapsed ? 'justify-center h-9' : 'justify-start gap-2.5 h-8 pl-3'} relative transition-all duration-150 rounded-md text-[13px] ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                  }`}
                  onClick={() => handleNav(item.view)}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-600 rounded-r" />}
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              )
            })}
          </div>

          {/* Secondary nav groups */}
          {!collapsed && (
            <>
              {['Catalog', 'Operations', 'Settings'].map((group) => (
                <div key={group} className="mt-1 space-y-0.5">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{group}</p>
                  {secondaryNavItems
                    .filter((item) => item.group === group)
                    .map((item) => {
                      const isActive = currentView === item.view
                      return (
                        <Button
                          key={item.view}
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start gap-2.5 h-8 pl-3 relative transition-all duration-150 rounded-md text-[13px] ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                          }`}
                          onClick={() => handleNav(item.view)}
                        >
                          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-600 rounded-r" />}
                          <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Button>
                      )
                    })}
                </div>
              ))}
            </>
          )}

          {/* Collapsed secondary nav */}
          {collapsed && (
            <>
              <div className="my-1.5 border-t border-border/60" />
              {secondaryNavItems.map((item) => {
                const isActive = currentView === item.view
                return (
                  <Tooltip key={item.view}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`w-full justify-center h-9 relative transition-all duration-150 rounded-md ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/80'
                        }`}
                        onClick={() => handleNav(item.view)}
                      >
                        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-emerald-600 rounded-r" />}
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
          <div className="mt-1.5 pt-1.5 border-t border-border/60">
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? 'justify-center h-9' : 'justify-start gap-2.5 h-8 pl-3'} text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-md text-[13px]`}
              onClick={() => handleNav('checkout')}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>Visit Store</span>}
            </Button>
          </div>
        </nav>
      </ScrollArea>

      {/* User profile */}
      <div className="border-t border-border/60 p-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start gap-2.5'} h-auto p-2 hover:bg-accent/80 transition-colors rounded-md`}
            >
              <div className="relative shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
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
        <div className="px-3 py-1.5 border-t border-border/40 shrink-0">
          <p className="text-[10px] text-muted-foreground/50 text-center">Online Vepar v1.0</p>
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
    { view: 'orders' as ViewType, label: 'Orders', icon: ShoppingCart },
    { view: 'products' as ViewType, label: 'Products', icon: Package },
    { view: 'customers' as ViewType, label: 'Customers', icon: Users },
  ]

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              className="fixed bottom-[68px] left-0 right-0 z-50 bg-card border-t border-border/50 rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto overscroll-contain"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">More Options</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMore(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {['Catalog', 'Operations', 'Settings'].map((group) => (
                  <div key={group} className="mb-2">
                    <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{group}</p>
                    {secondaryNavItems
                      .filter((item) => item.group === group)
                      .map((item) => {
                        const isActive = currentView === item.view
                        return (
                          <button
                            key={item.view}
                            className={`flex items-center gap-3 w-full p-3 rounded-xl text-left transition-colors touch-target ${
                              isActive
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : 'text-foreground hover:bg-accent/80 active:bg-accent'
                            }`}
                            onClick={() => {
                              setView(item.view)
                              setShowMore(false)
                            }}
                          >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span className="text-sm font-medium">{item.label}</span>
                            {isActive && <ChevronRight className="w-4 h-4 ml-auto text-emerald-600" />}
                          </button>
                        )
                      })}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/40 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
          {bottomNavItems.map((item) => {
            const isActive = currentView === item.view
            return (
              <button
                key={item.view}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px] touch-target ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground active:text-foreground'
                }`}
                onClick={() => setView(item.view)}
              >
                <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/40' : ''}`}>
                  <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
          {/* More button */}
          <button
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px] touch-target ${
              showMore || secondaryNavItems.some((i) => i.view === currentView)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground active:text-foreground'
            }`}
            onClick={() => setShowMore(!showMore)}
          >
            <div className={`p-1 rounded-lg transition-all ${showMore ? 'bg-emerald-50 dark:bg-emerald-900/40' : ''}`}>
              <LayoutGrid className={`w-5 h-5 transition-transform ${showMore ? 'scale-110' : ''}`} />
            </div>
            <span className="text-[10px] font-medium leading-tight">More</span>
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
      <div className="h-screen flex flex-col bg-background">
        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebar */}
          <motion.aside
            className="hidden lg:flex flex-col border-r border-border/60 overflow-hidden shrink-0 sticky top-0 h-screen bg-card"
            animate={{ width: sidebarOpen ? 240 : 56 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="h-full min-h-0">
              <SidebarContent
                collapsed={!sidebarOpen}
                onNavigate={() => {}}
              />
            </div>
          </motion.aside>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Top header */}
            <header className={`h-13 border-b border-border/60 bg-card flex items-center gap-2 px-3 lg:px-4 transition-shadow duration-200 shrink-0 ${scrolled ? 'shadow-sm' : ''}`}>
              {/* Mobile: hamburger opens Sheet */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0 h-8 w-8">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 overflow-hidden">
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
                  <BreadcrumbList className="text-xs">
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        className="cursor-pointer text-muted-foreground/70 hover:text-foreground transition-colors"
                        onClick={() => setView('dashboard')}
                      >
                        {currentStore?.name || 'My Store'}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="text-muted-foreground/30" />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-foreground font-medium">
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

              {/* Spacer */}
              <div className="flex-1" />

              {/* Search trigger */}
              <div className="hidden sm:flex items-center max-w-[220px] lg:max-w-[260px] shrink-0">
                <button
                  className="flex items-center gap-2 w-full h-8 px-3 rounded-md border border-border/60 bg-background text-muted-foreground text-xs hover:border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">Search...</span>
                  <kbd className="hidden lg:inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground shrink-0">
                    <Command className="w-2 h-2" />K
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                {/* Collapse sidebar toggle (desktop) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:flex h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={toggleSidebar}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="w-[16px] h-[16px]" />
                  ) : (
                    <PanelLeftOpen className="w-[16px] h-[16px]" />
                  )}
                </Button>

                {/* Visit Store */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex gap-1.5 h-7 text-[11px] border-border/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800"
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
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>

            {/* Page content */}
            <main id="main-content" className="flex-1 overflow-auto pb-20 lg:pb-0">
              <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
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
      </div>
    </TooltipProvider>
  )
}
