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

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Manage Users', icon: Users },
  { id: 'stores', label: 'Manage Stores', icon: Store },
  { id: 'payments', label: 'Payments & Plans', icon: CreditCard },
  { id: 'offers', label: 'Platform Offers', icon: Tag },
  { id: 'domains', label: 'Custom Domains', icon: Globe },
  { id: 'settings', label: 'Platform Settings', icon: Settings },
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
    <div className="flex h-screen bg-muted/20 text-foreground font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-[70px]'} flex-shrink-0 bg-card border-r border-border/60 flex flex-col transition-all duration-300 z-20 shadow-sm`}>
        <div className={`h-14 flex items-center shrink-0 border-b border-border/40 ${!sidebarOpen ? 'justify-center px-2' : 'gap-2.5 px-4'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/20">
            <Shield size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-bold truncate">Super Admin</span>
              <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-0 text-[9px] px-1.5 h-4 font-bold shrink-0">OS</Badge>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 py-1.5 rounded-lg text-sm transition-all duration-150 group ${
                activeTab === id
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 font-medium'
              } ${!sidebarOpen ? 'justify-center px-2' : 'px-3'}`}>
              <Icon size={16} className={`shrink-0 ${activeTab === id ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-110'}`} />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border/40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all">
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 bg-card/80 backdrop-blur-md border-b border-border/40 flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-bold text-foreground flex items-center gap-2 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { if (activeTab === 'overview') fetchOverview(); if (activeTab === 'stores') fetchStores(); if (activeTab === 'users') fetchUsers(); }} className="h-8 text-xs border-border/50">
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
                  { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { label: 'Active Stores', value: stats?.activeStores ?? '—', icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                  { label: 'Platform Revenue', value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}K` : '—', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <Card key={label} className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-5">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</CardTitle>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 pt-0">
                      <div className="text-2xl font-bold text-foreground">{value}</div>
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
                <Card className="shadow-sm border-border/60">
                  <CardHeader className="px-5 py-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Stores</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => setActiveTab('stores')}>View all</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {recentStores.slice(0, 5).map(s => (
                        <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.owner.email} · {s.slug}.onlinevepar.com</p>
                          </div>
                          <Badge variant="secondary" className={`${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                            {s.isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-border/60">
                  <CardHeader className="px-5 py-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Recent Users</CardTitle>
                      <Button variant="ghost" size="sm" className="text-xs text-blue-600" onClick={() => setActiveTab('users')}>View all</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/40">
                      {recentUsers.slice(0, 5).map(u => (
                        <div key={u.id} className="px-5 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{u.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                    placeholder="Search users by email or name..." className="pl-9 h-10 bg-background" />
                </div>
                <Button onClick={fetchUsers} className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
              </div>

              <Card className="shadow-sm border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr className="text-muted-foreground text-xs font-medium">
                        <th className="text-left px-5 py-3">User Details</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Stores Owned</th>
                        <th className="text-left px-5 py-3">Role</th>
                        <th className="text-left px-5 py-3 hidden lg:table-cell">Joined Date</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-card">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                            <Badge variant="outline">{u._count.stores} Stores</Badge>
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
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStores()}
                    placeholder="Search stores by name or slug..." className="pl-9 h-10 bg-background" />
                </div>
                <Button onClick={fetchStores} className="bg-blue-600 hover:bg-blue-700 text-white">Search</Button>
              </div>

              <Card className="shadow-sm border-border/60 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr className="text-muted-foreground text-xs font-medium">
                        <th className="text-left px-5 py-3">Store Identity</th>
                        <th className="text-left px-5 py-3 hidden md:table-cell">Owner</th>
                        <th className="text-left px-5 py-3 hidden lg:table-cell">Metrics</th>
                        <th className="text-left px-5 py-3">Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-card">
                      {stores.map(s => (
                        <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.slug}.onlinevepar.com</p>
                          </td>
                          <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                            <span className="block text-xs">{s.owner.name}</span>
                            <span className="block text-xs truncate max-w-[150px]">{s.owner.email}</span>
                          </td>
                          <td className="px-5 py-3 hidden lg:table-cell">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-[10px]">{s._count.products} Prod</Badge>
                              <Badge variant="outline" className="text-[10px]">{s._count.orders} Ord</Badge>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} border-0`}>
                              {s.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a href={`/store/${s.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="Preview Store">
                                <Eye size={16} />
                              </a>
                              <button onClick={() => toggleStore(s.id, s.isActive)}
                                className={`p-1.5 rounded-lg hover:bg-accent transition-colors ${s.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                                title={s.isActive ? "Suspend Store" : "Activate Store"}>
                                {s.isActive ? <XCircle size={16} /> : <CheckCircle size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {stores.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No stores found matching "{search}"</td></tr>}
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
              <Card className="shadow-sm border-border/60 overflow-hidden">
                <CardHeader className="px-5 py-4 border-b border-border/40">
                  <CardTitle className="text-base">Custom Domains</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Manage merchant DNS and SSL connections</p>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border/40">
                      <tr className="text-muted-foreground text-xs font-medium">
                        <th className="text-left px-5 py-3">Domain</th>
                        <th className="text-left px-5 py-3">Mapped Store</th>
                        <th className="text-left px-5 py-3">SSL Status</th>
                        <th className="text-left px-5 py-3">DNS Status</th>
                        <th className="text-right px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 bg-card">
                      {domains.map(d => (
                        <tr key={d.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-5 py-3 font-mono text-sm text-foreground">{d.domain}</td>
                          <td className="px-5 py-3 text-muted-foreground">{d.store.name}</td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`border-0 ${d.sslStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.sslStatus}</Badge>
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={`border-0 ${d.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {d.isVerified ? 'Verified' : 'Pending Verification'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {!d.isVerified && (
                              <Button size="sm" onClick={() => verifyDomain(d.id)} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">Force Verify</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {domains.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No custom domains linked yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && <PlatformSettingsTab />}
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
      <Card className="shadow-sm border-border/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base flex items-center gap-2"><Plus size={16} className="text-blue-600" /> Create New Plan</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Plan Name (e.g. Pro)" />
            <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g. 999)" />
            <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <option value="INR">INR ₹</option><option value="USD">USD $</option>
            </select>
            <Button onClick={createPlan} className="bg-blue-600 hover:bg-blue-700 text-white w-full">Create Plan</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="shadow-sm border-border/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CreditCard size={100} />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">{p.name}</h3>
                <Badge variant="secondary" className={`border-0 ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{p.isActive ? 'Active' : 'Archived'}</Badge>
              </div>
              <p className="text-4xl font-bold text-blue-600 mb-1">{p.currency === 'INR' ? '₹' : '$'}{p.price}<span className="text-sm font-medium text-muted-foreground ml-1">/{p.interval}</span></p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40 text-sm text-muted-foreground">
                <UserCheck size={16} className="text-blue-500" /> {p._count.subscriptions} active merchants
              </div>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-xl bg-muted/20">No billing plans found. Create one to allow merchant upgrades.</div>}
      </div>
    </div>
  )
}

function OffersTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="shadow-sm border-border/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base flex items-center gap-2"><Tag size={16} className="text-blue-600" /> Platform Promotions & Offers</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Create global discount codes and promotional banners for merchants to upgrade their SaaS plans.</p>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Input placeholder="Promo Code (e.g. DIWALI50)" />
            <Input type="number" placeholder="Discount %" />
            <Input type="date" placeholder="Expiry Date" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Promo Code</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border/40">
            <tr className="text-muted-foreground text-xs font-medium">
              <th className="text-left px-5 py-3">Offer Code</th>
              <th className="text-left px-5 py-3">Discount</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Usage Limit</th>
              <th className="text-right px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 bg-card">
            <tr className="hover:bg-accent/30 transition-colors">
              <td className="px-5 py-3 font-mono font-medium text-blue-600">LAUNCH99</td>
              <td className="px-5 py-3">99% OFF (First Month)</td>
              <td className="px-5 py-3"><Badge className="bg-emerald-100 text-emerald-700 border-0">Active</Badge></td>
              <td className="px-5 py-3 text-muted-foreground">14 / 100 Uses</td>
              <td className="px-5 py-3 text-right">
                <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50">Revoke</Button>
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
      <Card className="shadow-sm border-border/60">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base flex items-center gap-2"><Settings size={18} className="text-blue-600" /> Global Configuration</CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-5">
          {[
            { label: 'Platform Base Domain', placeholder: 'onlinevepar.com', desc: 'Used to generate merchant subdomains automatically.' },
            { label: 'Support Email Address', placeholder: 'support@onlinevepar.com', desc: 'Where merchants can reach you for help.' },
            { label: 'Razorpay Key ID (Platform)', placeholder: 'rzp_live_xxxx', desc: 'Required for accepting merchant SaaS subscription payments.' },
            { label: 'Razorpay Secret', placeholder: '••••••••••••••••', desc: 'Your private Razorpay API secret.' },
          ].map(({ label, placeholder, desc }) => (
            <div key={label} className="max-w-xl">
              <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
              <Input placeholder={placeholder} className="bg-background" />
              <p className="text-xs text-muted-foreground mt-1.5">{desc}</p>
            </div>
          ))}
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">Save Configuration</Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/30 shadow-sm bg-red-50/50 dark:bg-red-950/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400"><AlertTriangle size={18} /> Danger Zone</CardTitle>
          <p className="text-sm text-red-800/70 dark:text-red-300/70">These actions instantly affect all merchants on the platform.</p>
        </CardHeader>
        <CardContent className="pt-4 flex flex-wrap gap-3">
          <Button variant="outline" className="bg-background border-red-200 hover:bg-red-50 text-red-600">Enable Maintenance Mode</Button>
          <Button variant="outline" className="bg-background border-red-200 hover:bg-red-50 text-red-600">Lock New Signups</Button>
        </CardContent>
      </Card>
    </div>
  )
}
