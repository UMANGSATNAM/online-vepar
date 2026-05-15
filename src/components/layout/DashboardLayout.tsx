'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Settings, 
  Menu, Bell, Search, LogOut, ChevronDown, Store,
  CreditCard, Tag, FileText, Megaphone, HelpCircle,
  BarChart3, Zap, Globe, Plus, X, Layers, Paintbrush, Play
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import DashboardHome from '@/components/dashboard/DashboardHome'
import OrdersPage from '@/components/orders/OrdersPage'
import ProductsPage from '@/components/products/ProductsPage'
import CustomersPage from '@/components/customers/CustomersPage'
import AnalyticsPage from '@/components/analytics/AnalyticsPage'
import MarketingPage from '@/components/marketing/MarketingPage'
import DiscountsPage from '@/components/discounts/DiscountsPage'
import ContentPage from '@/components/content/ContentPage'
import SettingsPage from '@/components/settings/SettingsPage'
import NotificationsPanel from './NotificationsPanel'
import GlobalSearch from './GlobalSearch'

// Premium Floating Placeholder Page
function PlaceholderPage({ viewName, icon: Icon }: { viewName: string, icon: any }) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-12 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#0052FF] to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform duration-500">
            <Icon size={36} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 capitalize">
            {viewName.replace('-', ' ')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            This module is currently being crafted to international standards. It will be available in an upcoming platform update.
          </p>
          <Button className="bg-[#0052FF] text-white hover:bg-[#0052FF]/90 rounded-full px-8 py-6 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
            Return Home
          </Button>
        </div>
      </div>
    </div>
  )
}

const NAVIGATION = [
  { group: 'Overview', items: [
    { name: 'Home', view: 'home', icon: LayoutDashboard },
    { name: 'Analytics', view: 'analytics', icon: BarChart3 },
    { name: 'Live View', view: 'live-view', icon: Play, badge: 'PRO' },
  ]},
  { group: 'Sales', items: [
    { name: 'Orders', view: 'orders', icon: ShoppingCart },
    { name: 'Draft Orders', view: 'draft-orders', icon: FileText },
    { name: 'Abandoned Checkouts', view: 'abandoned-checkouts', icon: ShoppingCart },
  ]},
  { group: 'Inventory', items: [
    { name: 'Products', view: 'products', icon: Package },
    { name: 'Collections', view: 'collections', icon: Layers },
    { name: 'Inventory', view: 'inventory', icon: Package },
    { name: 'Transfers', view: 'transfers', icon: Package },
  ]},
  { group: 'Audience', items: [
    { name: 'Customers', view: 'customers', icon: Users },
    { name: 'Segments', view: 'segments', icon: Users },
  ]},
  { group: 'Growth', items: [
    { name: 'Marketing', view: 'marketing', icon: Megaphone },
    { name: 'Discounts', view: 'discounts', icon: Tag },
    { name: 'Automations', view: 'automations', icon: Zap },
  ]},
  { group: 'Online Store', items: [
    { name: 'Themes', view: 'themes', icon: Paintbrush },
    { name: 'Pages', view: 'pages', icon: FileText },
    { name: 'Navigation', view: 'navigation', icon: Menu },
  ]}
]

export default function DashboardLayout() {
  const { currentView, setView } = useAppStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'home': return <DashboardHome />
      case 'orders': return <OrdersPage />
      case 'products': return <ProductsPage />
      case 'customers': return <CustomersPage />
      case 'analytics': return <AnalyticsPage />
      case 'marketing': return <MarketingPage />
      case 'discounts': return <DiscountsPage />
      case 'content': return <ContentPage />
      case 'settings': return <SettingsPage />
      default:
        let icon = LayoutDashboard
        NAVIGATION.forEach(g => {
          const item = g.items.find(i => i.view === currentView)
          if (item) icon = item.icon
        })
        return <PlaceholderPage viewName={currentView} icon={icon} />
    }
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#09090B] font-sans selection:bg-[#0052FF]/30 overflow-hidden">
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}

      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Antigravity Glassmorphism Style */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isSidebarOpen ? 'w-[280px] translate-x-0' : '-translate-x-full lg:w-0 lg:hidden'}
        bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-r border-slate-200/60 dark:border-white/10
        flex flex-col transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      `}>
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-slate-200/40 dark:border-white/5">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0052FF] to-[#3B82F6] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-[#0052FF]/20">
            <Store size={18} className="text-white" />
          </div>
          <span className="ml-3 font-bold tracking-tight text-slate-900 dark:text-white text-lg">OmniBuilder</span>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="ml-auto p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          <button className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/60 dark:bg-white/5 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 truncate">
              <Avatar className="h-9 w-9 rounded-xl border border-slate-200/50 shadow-sm">
                <AvatarFallback className="bg-white text-[#0052FF] rounded-xl font-bold text-xs">ST</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start truncate">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">My Storefront</span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider">PREMIUM TIER</span>
              </div>
            </div>
            <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-8 scrollbar-hide">
          {NAVIGATION.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                {group.group}
              </p>
              {group.items.map((item) => (
                <button
                  key={item.view}
                  onClick={() => { setView(item.view); if (isMobile) setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group
                    ${currentView === item.view 
                      ? 'bg-[#0052FF]/10 text-[#0052FF] dark:bg-[#0052FF]/20 dark:text-[#3B82F6]' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  {currentView === item.view && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#0052FF] rounded-r-full" />
                  )}
                  <item.icon size={18} className={`transition-transform duration-300 ${currentView === item.view ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="tracking-wide">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1.5 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-sm font-bold">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-slate-200/40 dark:border-white/5">
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors
              ${currentView === 'settings' ? 'bg-[#0052FF]/10 text-[#0052FF]' : 'text-slate-600 hover:bg-slate-100/60 hover:text-slate-900'}
            `}
          >
            <Settings size={18} /> Platform Settings
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header - Floating Glassmorphism */}
        <header className="h-20 px-6 sm:px-10 flex items-center justify-between shrink-0 z-30 transition-all">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2.5 bg-white border border-slate-200/60 rounded-xl shadow-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="hidden sm:block">
              <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-900 dark:text-white capitalize">
                {currentView.replace('-', ' ')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <button 
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-md dark:bg-zinc-900/60 border border-slate-200/60 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-sm text-slate-500 hover:border-slate-300 transition-colors w-72"
            >
              <Search size={16} />
              <span>Search everywhere...</span>
              <div className="ml-auto flex gap-1.5">
                <kbd className="bg-slate-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-sans font-bold text-slate-400">⌘</kbd>
                <kbd className="bg-slate-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-sans font-bold text-slate-400">K</kbd>
              </div>
            </button>
            <button className="md:hidden p-2.5 bg-white/60 border border-slate-200/60 rounded-full shadow-sm text-slate-600">
              <Search size={20} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/60 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-600 dark:text-slate-300 hover:bg-white transition-all hover:scale-105 active:scale-95"
              >
                <Bell size={20} />
              </button>
              <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-[#0052FF] border-2 border-[#FAFAFA] rounded-full"></span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-md dark:bg-zinc-900/80 border border-slate-200/60 dark:border-white/10 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:scale-105 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-gradient-to-tr from-[#0052FF] to-blue-400 text-white text-xs font-bold">US</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 border-slate-200/60 shadow-[0_20px_40px_rgba(0,0,0,0.08)] bg-white/95 backdrop-blur-xl">
                <DropdownMenuLabel className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">John Doe</span>
                    <span className="text-xs text-slate-500 font-medium">john@omnibuilder.com</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 font-medium">
                  <Store className="mr-3 h-4 w-4 text-slate-500" /> Switch Store
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 font-medium">
                  <Settings className="mr-3 h-4 w-4 text-slate-500" /> Preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 font-medium">
                  <HelpCircle className="mr-3 h-4 w-4 text-slate-500" /> Support Hub
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700 font-bold">
                  <LogOut className="mr-3 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-12">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </div>

      </main>
    </div>
  )
}
