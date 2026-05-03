'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  LayoutDashboard, Store, Users, CreditCard, Globe, Settings,
  TrendingUp, ShoppingBag, UserCheck, AlertTriangle, CheckCircle,
  XCircle, Eye, Trash2, RefreshCw, Search, ChevronRight, ArrowUpRight,
  Shield, BarChart3, Bell, Menu, X, LogOut
} from 'lucide-react'

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
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'sync', label: 'Platform Sync', icon: RefreshCw },
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
    const res = await fetch(`/api/admin/stores?search=${search}`)
    const data = await res.json()
    setStores(data.stores || [])
    setLoading(false)
  }, [search])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?search=${search}`)
    const data = await res.json()
    setUsers(data.users || [])
    setLoading(false)
  }, [search])

  const fetchDomains = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/domains')
    const data = await res.json()
    setDomains(data.domains || [])
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
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          {sidebarOpen && <span className="font-bold text-sm text-white">Super Admin</span>}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
            <Menu size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            <p className="text-xs text-gray-500">Online Vepar Platform Control</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { if (activeTab === 'overview') fetchOverview(); if (activeTab === 'stores') fetchStores() }}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
              <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">A</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Users', value: stats?.totalUsers ?? '—', icon: Users, color: 'blue' },
                  { label: 'Active Stores', value: stats?.activeStores ?? '—', icon: Store, color: 'green' },
                  { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'emerald' },
                  { label: 'Platform Revenue', value: stats ? `₹${(stats.totalRevenue / 1000).toFixed(1)}K` : '—', icon: TrendingUp, color: 'amber' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-${color}-500/10`}>
                      <Icon size={20} className={`text-${color}-400`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Suspended alert */}
              {stats && stats.suspendedStores > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300"><strong>{stats.suspendedStores}</strong> stores are currently suspended</span>
                  <button onClick={() => setActiveTab('stores')} className="ml-auto text-xs text-red-400 hover:text-red-200 flex items-center gap-1">View <ChevronRight size={14} /></button>
                </div>
              )}

              {/* Recent Stores */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <h2 className="font-semibold text-white">Recent Stores</h2>
                  <button onClick={() => setActiveTab('stores')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">View all <ArrowUpRight size={12} /></button>
                </div>
                <div className="divide-y divide-gray-800">
                  {recentStores.slice(0, 5).map(s => (
                    <div key={s.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.owner.email} · {s.slug}.onlinevepar.com</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  ))}
                  {recentStores.length === 0 && <p className="px-5 py-8 text-center text-gray-500 text-sm">No stores yet</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── STORES ── */}
          {activeTab === 'stores' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchStores()}
                    placeholder="Search stores..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
                </div>
                <button onClick={fetchStores} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">Search</button>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-800">
                    <tr className="text-gray-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Store</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Owner</th>
                      <th className="text-left px-5 py-3 hidden lg:table-cell">Products</th>
                      <th className="text-left px-5 py-3 hidden lg:table-cell">Orders</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-right px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {stores.map(s => (
                      <tr key={s.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{s.name}</p>
                          <p className="text-xs text-gray-500">{s.slug}.onlinevepar.com</p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-gray-400">{s.owner.name}</td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-400">{s._count.products}</td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-400">{s._count.orders}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                            {s.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <a href={`/store/${s.slug}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                              <Eye size={15} />
                            </a>
                            <button onClick={() => toggleStore(s.id, s.isActive)}
                              className={`p-1.5 rounded-lg hover:bg-gray-700 transition-colors ${s.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                              {s.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {stores.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No stores found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                    placeholder="Search users..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
                </div>
                <button onClick={fetchUsers} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">Search</button>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-800">
                    <tr className="text-gray-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-left px-5 py-3 hidden md:table-cell">Stores</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3 hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <p className="font-medium text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </td>
                        <td className="px-5 py-3 hidden md:table-cell text-gray-400">{u._count.stores}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.role === 'superadmin' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-300'}`}>{u.role}</span>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={4} className="px-5 py-12 text-center text-gray-500">No users found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── DOMAINS ── */}
          {activeTab === 'domains' && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white">Custom Domains</h2>
                <p className="text-xs text-gray-500 mt-1">Verify and manage merchant custom domains</p>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b border-gray-800">
                  <tr className="text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Domain</th>
                    <th className="text-left px-5 py-3">Store</th>
                    <th className="text-left px-5 py-3">SSL</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {domains.map(d => (
                    <tr key={d.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-5 py-3 font-mono text-sm text-white">{d.domain}</td>
                      <td className="px-5 py-3 text-gray-400">{d.store.name}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${d.sslStatus === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>{d.sslStatus}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${d.isVerified ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'}`}>
                          {d.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!d.isVerified && (
                          <button onClick={() => verifyDomain(d.id)} className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors">Verify</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {domains.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">No custom domains yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── SUBSCRIPTIONS ── */}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && <PlatformSettingsTab />}

          {/* ── SYNC & FEATURES ── */}
          {activeTab === 'sync' && <PlatformSyncTab />}
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
    <div className="space-y-6">
      {/* Create plan */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="font-semibold text-white mb-4">Create Subscription Plan</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Plan Name (e.g. Pro)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
          <input value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="Price (e.g. 999)"
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
          <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
            <option value="INR">INR ₹</option><option value="USD">USD $</option><option value="EUR">EUR €</option>
          </select>
          <button onClick={createPlan} className="bg-emerald-600 hover:bg-emerald-700 rounded-lg px-4 py-2 text-sm font-medium transition-colors">Create Plan</button>
        </div>
      </div>

      {/* Plans list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">{p.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <p className="text-3xl font-bold text-white">{p.currency === 'INR' ? '₹' : '$'}{p.price}<span className="text-sm font-normal text-gray-500">/{p.interval}</span></p>
            <p className="text-sm text-gray-500 mt-2"><UserCheck size={14} className="inline mr-1" />{p._count.subscriptions} active subscribers</p>
          </div>
        ))}
        {plans.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500">No plans yet. Create one above.</div>}
      </div>
    </div>
  )
}

function PlatformSettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><Settings size={18} /> Platform Settings</h2>
        <div className="space-y-4">
          {[
            { label: 'Platform Domain', placeholder: 'onlinevepar.com', desc: 'Your main platform domain for subdomains' },
            { label: 'Support Email', placeholder: 'support@onlinevepar.com', desc: 'Shown to merchants on billing issues' },
            { label: 'Razorpay Key ID', placeholder: 'rzp_live_xxxx', desc: 'For accepting subscription payments' },
            { label: 'Razorpay Secret', placeholder: 'rzp_secret_xxxx', desc: 'Keep this secret' },
          ].map(({ label, placeholder, desc }) => (
            <div key={label}>
              <label className="text-sm font-medium text-gray-300 block mb-1">{label}</label>
              <input placeholder={placeholder} className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" />
              <p className="text-xs text-gray-600 mt-1">{desc}</p>
            </div>
          ))}
          <button className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors">Save Settings</button>
        </div>
      </div>

      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
        <h2 className="font-semibold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle size={18} /> Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">These actions affect the entire platform.</p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors">Enable Maintenance Mode</button>
          <button className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors">Disable New Signups</button>
        </div>
      </div>
    </div>
  )
}

function PlatformSyncTab() {
  const [syncing, setSyncing] = useState(false)
  const [broadcasting, setBroadcasting] = useState(false)

  const handleGlobalSync = () => {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  const handleBroadcast = () => {
    setBroadcasting(true)
    setTimeout(() => setBroadcasting(false), 1500)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Master Theme Sync */}
        <div className="bg-gray-900 border border-emerald-500/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RefreshCw size={100} />
          </div>
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2 text-lg">
            <RefreshCw size={20} className="text-emerald-500" /> Master Theme Sync
          </h2>
          <p className="text-sm text-gray-400 mb-6 relative z-10">
            Force update all merchant stores to the latest layout engine and UI components. This will synchronize the newest design tokens across all 21 niche templates without overriding merchant data.
          </p>
          <button 
            onClick={handleGlobalSync}
            disabled={syncing}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${syncing ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}
          >
            {syncing ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {syncing ? 'Synchronizing 541 components...' : 'Trigger Global Sync'}
          </button>
        </div>

        {/* Global Broadcast */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-2 flex items-center gap-2 text-lg">
            <Bell size={20} className="text-emerald-500" /> Global Merchant Broadcast
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Push an alert banner to every single merchant dashboard on the platform instantly.
          </p>
          <div className="space-y-3">
            <input 
              placeholder="E.g. We are deploying a massive new update tonight!" 
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-emerald-500" 
            />
            <div className="flex gap-2">
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500">
                <option value="info">Info (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="danger">Critical (Red)</option>
              </select>
              <button 
                onClick={handleBroadcast}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {broadcasting ? 'Broadcasting...' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Feature Flags */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
          <Settings size={20} className="text-emerald-500" /> Platform Feature Flags
        </h2>
        <div className="space-y-1 divide-y divide-gray-800 border border-gray-800 rounded-lg">
          {[
            { name: 'AI Store Generator', desc: 'Enable the AI prompt-to-store feature for all merchants.', active: true },
            { name: 'Advanced Theme Editor', desc: 'Roll out the new drag-and-drop React Dnd-kit editor.', active: true },
            { name: 'Razorpay Auto-Billing', desc: 'Enable automatic deduction of platform fees via Razorpay.', active: false },
            { name: 'Multi-Language Support', desc: 'Allow merchants to localize their storefronts in 12 languages.', active: false },
          ].map((feature, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors">
              <div>
                <h3 className="font-medium text-white">{feature.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{feature.desc}</p>
              </div>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${feature.active ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
