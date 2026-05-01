'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Bell,
  Search,
  Menu,
  LogOut,
  ChevronDown,
  X,
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
import { useAppStore, type ViewType } from '@/lib/store'
import DashboardHome from '@/components/dashboard/DashboardHome'
import ProductsPage from '@/components/products/ProductsPage'
import OrdersPage from '@/components/orders/OrdersPage'
import CustomersPage from '@/components/customers/CustomersPage'
import StoreSettings from '@/components/store/StoreSettings'
import StorePreview from '@/components/store/StorePreview'
import AnalyticsPage from '@/components/analytics/AnalyticsPage'
import PagesPage from '@/components/pages/PagesPage'

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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
        }`}
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
              className="text-lg font-bold text-emerald-900 whitespace-nowrap"
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

        {/* Store selector */}
        {sidebarOpen && stores.length > 0 && (
          <div className="px-3 py-3">
            <Select
              value={currentStore?.id || ''}
              onValueChange={(value) => {
                const store = stores.find((s) => s.id === value)
                if (store) setStore(store)
              }}
            >
              <SelectTrigger className="w-full border-emerald-200 bg-emerald-50/50">
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
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = currentView === item.view
              return (
                <Button
                  key={item.view}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={`w-full justify-start gap-3 h-10 ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } ${!sidebarOpen ? 'lg:justify-center lg:px-0' : ''}`}
                  onClick={() => {
                    setView(item.view)
                    if (window.innerWidth < 1024) setSidebarOpen(false)
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
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
                className={`w-full justify-start gap-3 h-auto p-2 hover:bg-accent ${
                  !sidebarOpen ? 'lg:justify-center lg:px-0' : ''
                }`}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
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
        <header className="h-16 border-b border-border bg-card flex items-center gap-4 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {currentStore?.name || 'My Store'}
            </h2>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto lg:mx-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background border-border h-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-emerald-600 text-[10px] text-white">
                3
              </Badge>
            </Button>

            {/* User avatar (mobile) */}
            <Avatar className="h-8 w-8 lg:hidden">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Collapse toggle for desktop */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex fixed bottom-4 left-0 z-50 w-6 h-12 rounded-none rounded-r-md bg-card border border-border border-l-0 hover:bg-accent"
        onClick={toggleSidebar}
      >
        <ChevronDown
          className={`w-3 h-3 transition-transform ${
            sidebarOpen ? '-rotate-90' : 'rotate-90'
          }`}
        />
      </Button>
    </div>
  )
}
