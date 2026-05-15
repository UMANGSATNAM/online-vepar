'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Store, Users, CreditCard, Globe, Settings,
  TrendingUp, ShoppingBag, UserCheck, AlertTriangle, CheckCircle,
  XCircle, Eye, RefreshCw, Search, ChevronRight, ArrowUpRight,
  Shield, Bell, Menu, Tag, Plus, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface OverviewStats {
  totalUsers: number
  totalStores: number
  activeStores: number
  suspendedStores: number
  totalOrders: number
  totalProducts: number
  totalRevenue: number
}

interface AdminStore {
  id: string; name: string; slug: string; isActive: boolean; createdAt: string
  owner: { name: string; email: string }
  _count: { products: number; orders: number; customers: number }
}

interface AdminUser {
  id: string; name: string; email: string; role: string; createdAt: string
  _count: { stores: number }
}

const NAVIGATION = [
  { group: 'Platform', items: [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp, badge: 'NEW' },
  ]},
  { group: 'Tenants', items: [
    { id: 'stores', label: 'Manage Stores', icon: Store },
    { id: 'users', label: 'User Accounts', icon: Users },
    { id: 'domains', label: 'Custom Domains', icon: Globe },
  ]},
  { group: 'Revenue', items: [
    { id: 'payments', label: 'Billing & Plans', icon: CreditCard },
    { id: 'offers', label: 'Promotions', icon: Tag },
  ]},
  { group: 'System', items: [
    { id: 'settings', label: 'Platform Settings', icon: Settings },
    { id: 'security', label: 'Security Logs', icon: Shield },
  ]}
]

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [recentStores, setRecentStores] = useState<AdminStore[]>([])
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [stores, setStores] = useState<AdminStore[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [domains, setDomains] = useState<{ id: string; domain: string; isVerified: boolean; sslStatus: string; store: { name: string; slug: string } }[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/overview')
      const data = await res.json()
      setStats(data.stats)
      setRecentStores(data.recentStores)
      setRecentUsers(data.recentUsers)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  const fetchStores = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/stores?search=${search}`)
      const data = await res.json()
      setStores(data.stores || [])
    } catch {}
    setLoading(false)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?search=${search}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch {}
    setLoading(false)
  }, [search])

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/domains')
      const data = await res.json()
      setDomains(data.domains || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'overview') fetchOverview()
    if (activeTab === 'stores') fetchStores()
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'domains') fetchDomains()
  }, [activeTab, fetchOverview, fetchStores, fetchUsers, fetchDomains])

  const toggleStore = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/stores/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) })
    fetchStores()
  }

  const verifyDomain = async (id: string) => {
    await fetch('/api/admin/domains', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, isVerified: true, sslStatus: 'active' }) })
    fetchDomains()
  }

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#0052FF]/30 overflow-hidden">
      
      {/* Sidebar - Matching Enterprise Style */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${sidebarOpen ? 'w-[280px] translate-x-0' : '-translate-x-full lg:w-[80px]'}
        bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-r border-slate-200/60 dark:border-white/10
        flex flex-col transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      `}>
        <div className={`h-20 flex items-center shrink-0 border-b border-slate-200/40 dark:border-white/5 ${!sidebarOpen ? 'justify-center px-0' : 'px-6'}`}>
          <div className="w-9 h-9 bg-gradient-to-br from-slate-800 to-black dark:from-white dark:to-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-black/10 dark:shadow-white/10">
            <Shield size={18} className="text-white dark:text-black" />
          </div>
          {sidebarOpen && (
            <div className="ml-3 flex flex-col items-start min-w-0">
              <span className="font-bold tracking-tight text-slate-900 dark:text-white text-lg leading-tight">Super Admin</span>
              <span className="text-[10px] font-bold tracking-widest text-[#0052FF] uppercase">OmniBuilder OS</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          {NAVIGATION.map((group, idx) => (
            <div key={idx} className="space-y-1.5">
              {sidebarOpen && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                  {group.group}
                </p>
              )}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 relative group
                    ${!sidebarOpen ? 'justify-center px-0' : 'px-3'}
                    ${activeTab === item.id 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-md' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}
                  `}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {activeTab === item.id && sidebarOpen && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white dark:bg-black rounded-r-full" />
                  )}
                  <item.icon size={18} className={`shrink-0 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {sidebarOpen && <span className="tracking-wide truncate">{item.label}</span>}
                  {sidebarOpen && item.badge && (
                    <Badge variant="secondary" className="ml-auto text-[9px] py-0 px-1.5 h-4 bg-[#0052FF]/10 text-[#0052FF] border-0 shadow-sm font-bold">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200/40 dark:border-white/5">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-3 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Header - Floating Glassmorphism */}
        <header className="h-20 px-6 sm:px-10 flex items-center justify-between shrink-0 z-30 transition-all border-b border-slate-200/40 dark:border-white/5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              {NAVIGATION.flatMap(g => g.items).find(i => i.id === activeTab)?.label || activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { if (activeTab === 'overview') fetchOverview(); if (activeTab === 'stores') fetchStores(); if (activeTab === 'users') fetchUsers(); }} className="h-8 text-xs border-slate-200 dark:border-white/10">
              <RefreshCw size={14} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/60 dark:to-indigo-900/60 text-blue-700 dark:text-blue-400 text-xs font-bold">SA</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dynamic View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
          
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-[#0052FF]', bg: 'bg-[#0052FF]/10' },
                  { label: 'Active Stores', value: stats?.activeStores ?? '—', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                  { label: 'Platform Revenue', value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}K` : '—', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <Card key={label} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
                      <CardTitle className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</CardTitle>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-0">
                      <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {stats && stats.suspendedStores > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-800 dark:text-red-300"><strong>{stats.suspendedStores}</strong> stores are currently suspended</span>
                  <button onClick={() => setActiveTab('stores')} className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">View <ChevronRight size={14} /></button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10">
                  <CardHeader className="px-5 py-4 border-b border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Recent Stores</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-[#0052FF]" onClick={() => setActiveTab('stores')}>View all</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-200/60 dark:divide-white/10">
                      {recentStores.slice(0, 5).map(s => (
                        <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.owner.email} · {s.slug}.onlinevepar.com</p>
                          </div>
                          <Badge variant="secondary" className={`${s.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'} border-0`}>
                            {s.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10">
                  <CardHeader className="px-5 py-4 border-b border-slate-200/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base text-slate-900 dark:text-slate-100">Recent Users</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-[#0052FF]" onClick={() => setActiveTab('users')}>View all</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-200/60 dark:divide-white/10">
                      {recentUsers.slice(0, 5).map(u => (
                        <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-[#0052FF]/10 text-[#0052FF] text-xs font-bold">{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="border-0 text-[10px]">{u.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                    placeholder="Search users by email or name..." className="pl-9 h-10 bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
                </div>
                <Button onClick={fetchUsers} className="bg-[#0052FF] hover:bg-[#0039B3] text-white">Search</Button>
              </div>

              <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-200/60 dark:border-white/10">
                      <tr className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <th className="text-left px-5 py-3">User Details</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Stores Owned</th>
                        <th className="text-left px-5 py-3">Role</th>
                        <th className="text-left px-5 py-3 hidden lg:table-cell">Joined Date</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 bg-transparent">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400">
                            <Badge variant="outline" className="border-slate-200/60 dark:border-white/10">{u._count.stores} Stores</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`border-0 ${u.role === 'superadmin' ? 'bg-blue-100 text-blue-700' : ''}`}>{u.role}</Badge>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-5 py-3 text-right">
                            <Button variant="ghost" size="sm" className="text-xs h-8 text-blue-600">Edit</Button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No users found matching "{search}"</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* STORES */}
          {activeTab === 'stores' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStores()}
                    placeholder="Search stores by name or slug..." className="pl-9 h-10 bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
                </div>
                <Button onClick={fetchStores} className="bg-[#0052FF] hover:bg-[#0039B3] text-white">Search</Button>
              </div>

              <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-200/60 dark:border-white/10">
                      <tr className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <th className="text-left px-5 py-3">Store Identity</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Owner</th>
                        <th className="text-left px-5 py-3 hidden lg:table-cell">Metrics</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 bg-transparent">
                      {stores.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.slug}.onlinevepar.com</p>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell text-slate-500 dark:text-slate-400">
                            <span className="block text-xs">{s.owner.name}</span>
                            <span className="block text-xs truncate max-w-[150px]">{s.owner.email}</span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <Badge variant="outline" className="text-[10px] border-slate-200/60 dark:border-white/10">{s._count.products} Prod</Badge>
                              <Badge variant="outline" className="text-[10px] border-slate-200/60 dark:border-white/10">{s._count.orders} Ord</Badge>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`${s.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'} border-0`}>
                              {s.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a href={`/store/${s.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100" title="Preview Store">
                                <Eye size={16} />
                              </a>
                              <button onClick={() => toggleStore(s.id, s.isActive)}
                                className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors ${s.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                                title={s.isActive ? "Suspend Store" : "Activate Store"}>
                                {s.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {stores.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">No stores found matching "{search}"</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* PAYMENTS & PLANS */}
          {activeTab === 'payments' && <SubscriptionsTab />}

          {/* OFFERS (NEW) */}
          {activeTab === 'offers' && <OffersTab />}

          {/* DOMAINS */}
          {activeTab === 'domains' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 overflow-hidden">
                <CardHeader className="px-5 py-4 border-b border-slate-200/60 dark:border-white/10">
                  <CardTitle className="text-base text-slate-900 dark:text-slate-100">Custom Domains</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage merchant DNS and SSL connections</p>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-200/60 dark:border-white/10">
                      <tr className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                        <th className="text-left px-5 py-3">Domain</th>
                        <th className="text-left px-5 py-3">Mapped Store</th>
                        <th className="text-left px-5 py-3">SSL Status</th>
                        <th className="text-left px-5 py-3">DNS Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 bg-transparent">
                      {domains.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm text-slate-900 dark:text-slate-100">{d.domain}</td>
                          <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{d.store.name}</td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`border-0 ${d.sslStatus === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>{d.sslStatus}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`border-0 ${d.isVerified ? 'bg-[#0052FF]/10 text-[#0052FF]' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'}`}>
                              {d.isVerified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {!d.isVerified && (
                              <Button size="sm" onClick={() => verifyDomain(d.id)} className="h-8 text-xs bg-[#0052FF] hover:bg-[#0039B3] text-white">Force Verify</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {domains.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">No custom domains linked yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && <PlatformSettingsTab />}

          {/* PLACEHOLDERS */}
          {(activeTab === 'analytics' || activeTab === 'security') && (
            <div className="h-[60vh] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="relative">
                <div className="absolute inset-0 bg-[#0052FF]/10 blur-[80px] rounded-full" />
                <div className="relative bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-12 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.04)] text-center max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#0052FF] to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                    {activeTab === 'analytics' ? <TrendingUp size={36} className="text-white" /> : <Shield size={36} className="text-white" />}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 capitalize">
                    {activeTab === 'analytics' ? 'Platform Analytics' : 'Security Logs'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                    This module is currently being built to international enterprise standards. It will be available in an upcoming OmniBuilder OS update.
                  </p>
                  <Button onClick={() => setActiveTab('overview')} className="bg-[#0052FF] text-white hover:bg-[#0052FF]/90 rounded-full px-8 py-6 shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all">
                    Return to Overview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function SubscriptionsTab() {
  const [plans, setPlans] = useState<{ id: string; name: string; price: number; currency: string; interval: string; isActive: boolean; _count: { subscriptions: number } }[]>([])
  const [form, setForm] = useState({ name: '', price: '', currency: 'INR', interval: 'month' })

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
  }, [])

  const createPlan = async () => {
    await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, features: [] }) })
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans || []))
    setForm({ name: '', price: '', currency: 'INR', interval: 'month' })
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/10 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100"><Plus size={16} className="text-[#0052FF]" /> Create New Plan</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Plan Name (e.g. Pro)" className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
            <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g. 999)" className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200/60 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:border-[#0052FF] text-slate-900 dark:text-slate-100">
              <option value="INR">INR ₹</option><option value="USD">USD $</option>
            </select>
            <Button onClick={createPlan} className="bg-[#0052FF] hover:bg-[#0039B3] text-white w-full">Create Plan</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 relative overflow-hidden transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 dark:text-slate-100">
              <CreditCard size={100} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{p.name}</h3>
                <Badge variant="secondary" className={`border-0 ${p.isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{p.isActive ? 'Active' : 'Archived'}</Badge>
              </div>
              <p className="text-4xl font-black text-[#0052FF] mb-1">{p.currency === 'INR' ? '₹' : '$'}{p.price}<span className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">/{p.interval}</span></p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10 text-sm text-slate-500 dark:text-slate-400">
                <UserCheck size={16} className="text-[#0052FF]" /> {p._count.subscriptions} active merchants
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-400 border border-dashed border-slate-200/60 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-zinc-800/50">No billing plans found. Create one to allow merchant upgrades.</div>}
      </div>
    </div>
  )
}

function OffersTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/10 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100"><Tag size={16} className="text-[#0052FF]" /> Platform Promotions & Offers</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create global discount codes and promotional banners for merchants to upgrade their SaaS plans.</p>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Input placeholder="Promo Code (e.g. DIWALI50)" className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
            <Input type="number" placeholder="Discount %" className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
            <Input type="date" placeholder="Expiry Date" className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
            <Button className="bg-[#0052FF] hover:bg-[#0039B3] text-white">Create Promo Code</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 dark:bg-zinc-800/50 border-b border-slate-200/60 dark:border-white/10">
            <tr className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              <th className="text-left px-5 py-3">Offer Code</th>
              <th className="text-left px-5 py-3">Discount</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Usage Limit</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/10 bg-transparent">
            <tr className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
              <td className="px-5 py-3 font-mono font-medium text-[#0052FF]">LAUNCH99</td>
              <td className="px-5 py-3 text-slate-900 dark:text-slate-100">99% OFF (First Month)</td>
              <td className="px-5 py-3"><Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-0">Active</Badge></td>
              <td className="px-5 py-3 text-slate-500 dark:text-slate-400">14 / 100 Uses</td>
              <td className="px-5 py-3 text-right">
                <Button variant="ghost" size="sm" className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">Revoke</Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function PlatformSettingsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border-slate-200/60 dark:border-white/10">
        <CardHeader className="border-b border-slate-200/60 dark:border-white/10 pb-4">
          <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-slate-100"><Settings size={18} className="text-[#0052FF]" /> Global Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {[
            { label: 'Platform Base Domain', placeholder: 'onlinevepar.com', desc: 'Used to generate merchant subdomains automatically.' },
            { label: 'Support Email Address', placeholder: 'support@onlinevepar.com', desc: 'Where merchants can reach you for help.' },
            { label: 'Razorpay Key ID (Platform)', placeholder: 'rzp_live_xxxx', desc: 'Required for accepting merchant SaaS subscription payments.' },
            { label: 'Razorpay Secret', placeholder: '••••••••••••••••', desc: 'Your private Razorpay API secret.' },
          ].map(({ label, placeholder, desc }) => (
            <div key={label} className="max-w-xl">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100 block mb-1.5">{label}</label>
              <Input placeholder={placeholder} className="bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-white/10" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{desc}</p>
            </div>
          ))}
          <Button className="mt-4 bg-[#0052FF] hover:bg-[#0039B3] text-white">Save Configuration</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/30 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-red-50/50 dark:bg-red-900/10 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400"><AlertTriangle size={18} /> Danger Zone</CardTitle>
          <p className="text-sm text-red-800/70 dark:text-red-300/70">These actions instantly affect all merchants on the platform.</p>
        </CardHeader>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Enable Maintenance Mode</Button>
          <Button variant="outline" className="bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">Lock New Signups</Button>
        </CardContent>
      </Card>
    </div>
  )
}
