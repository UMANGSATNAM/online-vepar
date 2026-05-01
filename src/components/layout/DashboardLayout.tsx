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
import NotificationsPanel from '@/components/layout/NotificationsPanel'

const navItems: { view: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { view: 'dashboard', label: 'Home', icon: Home },
  { view: 'products', label: 'Products', icon: Package },
  { view: 'orders', label: 'Orders', icon: ShoppingCart },
  { view: 'customers', label: 'Customers', icon: Users },
  { view: 'analytics', label: 'Analytics', icon: BarChart3 },
  { view: 'store-settings', label: 'Store Settings', icon: Settings },
  { view: 'store-preview', label: 'Store Preview', icon: Globe },
  { view: 'pages', label: 'Pages', icon: FileText },
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
  const [scrolled, setScrolled] = useState(false)

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
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
          }`}
          style={{
            background: sidebarOpen
              ? 'linear-gradient(to bottom, oklch(0.96 0.02 155 / 0.5), var(--card))'
              : undefined,
          }}
        >
          {/* Sidebar header */}
          <div className="h-16 flex items-center gap-2 px-4 border-b border-border">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-bold text-emerald-900 dark:text-emerald-100 whitespace-nowrap"
              >
                Online Vepar
              </motion.span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Store selector with + button */}
          {sidebarOpen && (
            <div className="px-3 py-3">
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
                      className="h-9 w-9 shrink-0 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-300"
                      onClick={() => setView('create-store')}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Create Store</TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentView === item.view

                // Collapsed sidebar: show tooltip
                if (!sidebarOpen) {
                  return (
                    <Tooltip key={item.view}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-center h-10 relative transition-all duration-200 ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
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
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return (
                  <Button
                    key={item.view}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-3 h-10 relative transition-all duration-200 ${
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
                )
              })}
            </nav>
          </ScrollArea>

          {/* User profile at bottom */}
          <div className="border-t border-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-3 h-auto p-2 hover:bg-accent transition-all duration-200 ${
                    !sidebarOpen ? 'lg:justify-center lg:px-0' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
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
        </aside>

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
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  placeholder="Search products, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-12 bg-background border-border h-9 focus:ring-1 focus:ring-emerald-500 transition-shadow"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 pointer-events-none">
                  <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <Command className="w-2.5 h-2.5" />K
                  </kbd>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
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
