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

const navItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }>; shortcut?: string }[] = [
  { view: 'dashboard', label: 'Home', icon: Home, shortcut: 'Alt+H' },
  { view: 'products', label: 'Products', icon: Package, shortcut: 'Alt+P' },
  { view: 'collections', label: 'Collections', icon: Layers, shortcut: 'Alt+L' },
  { view: 'staff', label: 'Staff', icon: Users, shortcut: 'Alt+Shift+T' },
  { view: 'orders', label: 'Orders', icon: ShoppingCart, shortcut: 'Alt+O' },
  { view: 'customers', label: 'Customers', icon: Users, shortcut: 'Alt+C' },
  { view: 'reviews', label: 'Reviews', icon: Star, shortcut: 'Alt+R' },
  { view: 'activity', label: 'Activity', icon: Clock },
  { view: 'discounts', label: 'Discounts', icon: Tag, shortcut: 'Alt+D' },
  { view: 'gift-cards', label: 'Gift Cards', icon: CreditCard, shortcut: 'Alt+G' },
  { view: 'inventory', label: 'Inventory', icon: Warehouse, shortcut: 'Alt+I' },
  { view: 'shipping', label: 'Shipping', icon: Truck, shortcut: 'Alt+Shift+S' },
  { view: 'tax-rates', label: 'Tax Rates', icon: Receipt, shortcut: 'Alt+T' },
  { view: 'abandoned-carts', label: 'Abandoned Carts', icon: ShoppingBag },
  { view: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: 'Alt+A' },
  { view: 'store-settings', label: 'Store Settings', icon: Settings, shortcut: 'Alt+S' },
  { view: 'store-preview', label: 'Store Preview', icon: Globe },
  { view: 'pages', label: 'Pages', icon: FileText },
  { view: 'checkout', label: 'Visit Store', icon: Globe },
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
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Keyboard shortcut for global search (Cmd+K / Ctrl+K)
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
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex bg-background">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside
          className="fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border overflow-hidden"
          animate={{
            width: sidebarOpen ? 256 : 64,
            translateX: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -256 : 0),
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: sidebarOpen
              ? 'linear-gradient(180deg, oklch(0.96 0.04 155 / 0.6) 0%, oklch(0.94 0.02 155 / 0.3) 40%, var(--card) 100%)'
              : undefined,
          }}
        >
          {/* Dark mode gradient */}
          <div className="absolute inset-0 dark:hidden pointer-events-none" />
          <div className="absolute inset-0 hidden dark:block pointer-events-none"
            style={{
              background: sidebarOpen
                ? 'linear-gradient(180deg, oklch(0.2 0.03 155 / 0.8) 0%, oklch(0.16 0.02 155 / 0.4) 40%, var(--card) 100%)'
                : undefined,
            }}
          />

          {/* Sidebar header */}
          <div className="relative h-16 flex items-center gap-2 px-4 border-b border-border">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5 overflow-hidden"
                >
                  <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100 whitespace-nowrap">
                    Online Vepar
                  </span>
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[9px] px-1.5 py-0 h-4 font-semibold shrink-0">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    PRO
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden relative z-10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Store selector with + button */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="px-3 py-3 relative z-10"
              >
                <div className="flex items-center gap-1.5">
                  <Select
                    value={currentStore?.id || ''}
                    onValueChange={(value) => {
                      const store = stores.find((s) => s.id === value)
                      if (store) setStore(store)
                    }}
                  >
                    <SelectTrigger className="flex-1 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
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
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 shrink-0 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 hover:scale-105"
                        onClick={() => setView('create-store')}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Create Store</TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-2 relative z-10">
            <nav className="space-y-1">
              {navItems.map((item, idx) => {
                const isActive = currentView === item.view

                // Collapsed sidebar: show tooltip
                if (!sidebarOpen) {
                  return (
                    <Tooltip key={item.view}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-center h-10 relative transition-all duration-200 hover:scale-105 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          onClick={() => {
                            setView(item.view)
                            if (window.innerWidth < 1024) setSidebarOpen(false)
                          }}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-600 rounded-r" />
                          )}
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                        {item.shortcut && (
                          <span className="ml-2 text-[10px] text-muted-foreground opacity-70">({item.shortcut})</span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <motion.div
                    key={item.view}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: idx * 20 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={`w-full justify-start gap-3 h-10 relative transition-all duration-200 hover:scale-[1.02] ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium pl-5'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                          onClick={() => {
                            setView(item.view)
                            if (window.innerWidth < 1024) setSidebarOpen(false)
                          }}
                        >
                          {/* Active indicator bar */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-600 rounded-r" />
                          )}
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{item.label}</span>
                        </Button>
                      </TooltipTrigger>
                      {item.shortcut && (
                        <TooltipContent side="right" sideOffset={8}>
                          <span className="text-[10px] text-muted-foreground">{item.shortcut}</span>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </motion.div>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Sound toggle */}
          {sidebarOpen && (
            <div className="px-3 py-1 relative z-10">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                {soundEnabled ? 'Sound On' : 'Sound Off'}
              </Button>
            </div>
          )}

          {/* Sidebar footer */}
          {sidebarOpen && (
            <div className="px-3 py-2 border-t border-border relative z-10">
              <p className="text-[10px] text-muted-foreground text-center">
                Online Vepar v1.0
              </p>
            </div>
          )}

          {/* User profile at bottom */}
          <div className="border-t border-border p-3 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-auto p-2 hover:bg-accent transition-all duration-200 ${
                    !sidebarOpen ? 'lg:justify-center lg:px-0' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online status indicator */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                      <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-pulse-ring" />
                    </div>
                  </div>
                  {sidebarOpen && (
                    <div className="text-left flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {currentUser?.name || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {currentUser?.email || ''}
                      </div>
                    </div>
                  )}
                  {sidebarOpen && <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setView('store-settings')}>
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
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className={`h-16 border-b border-border bg-card flex items-center gap-3 px-4 lg:px-6 transition-shadow duration-200 ${scrolled ? 'shadow-sm' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

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
                    <BreadcrumbPage className="text-foreground font-medium">
                      {viewLabels[currentView] || 'Dashboard'}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Mobile store name */}
            <div className="md:hidden shrink-0">
              <h2 className="text-sm font-medium text-muted-foreground">
                {currentStore?.name || 'My Store'}
              </h2>
            </div>

            {/* Search with command palette look */}
            <div className="flex-1 max-w-md mx-auto lg:mx-0">
              <div
                className="relative group cursor-pointer"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  placeholder="Search products, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-12 bg-background border-border h-9 focus:ring-1 focus:ring-emerald-500 transition-shadow pointer-events-none"
                  readOnly
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                  <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Visit Store button */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-1.5 h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                onClick={() => setView('checkout')}
              >
                <Globe className="w-3.5 h-3.5" />
                Visit Store
              </Button>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <NotificationsPanel />

              {/* User avatar (mobile) */}
              <Avatar className="h-8 w-8 lg:hidden">
                <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Page content with fade-in transition */}
          <main id="main-content" className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Global Search Dialog */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Collapse toggle for desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex fixed bottom-4 left-0 z-50 w-6 h-12 rounded-none rounded-r-md bg-card border border-border border-l-0 hover:bg-accent transition-colors"
          onClick={toggleSidebar}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              sidebarOpen ? '-rotate-90' : 'rotate-90'
            }`}
          />
        </Button>
      </div>
    </TooltipProvider>
  )
}
