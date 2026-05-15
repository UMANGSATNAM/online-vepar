'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp, Users, ShoppingBag, DollarSign,
  ArrowUpRight, ArrowDownRight, Package,
  MoreHorizontal, Eye, Truck, CheckCircle, Activity,
  Globe, Clock, CreditCard
} from 'lucide-react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useAppStore } from '@/lib/store'

const data = [
  { name: 'Mon', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Tue', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Wed', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Thu', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Fri', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Sat', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Sun', total: Math.floor(Math.random() * 5000) + 1000 },
]

export default function DashboardHome() {
  const { currentUser: user } = useAppStore()

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Welcome Section - Floating Glass Effect */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#0052FF] to-indigo-600 text-white shadow-[0_20px_40px_rgba(0,82,255,0.15)] p-10">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">
            Good morning, {user?.name || 'Store Owner'} 👋
          </h2>
          <p className="text-blue-100 text-lg font-medium leading-relaxed mb-8">
            Your store is performing brilliantly. Revenue is up <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-lg">+14.5%</span> compared to last week. Let's keep the momentum going!
          </p>
          <div className="flex flex-wrap gap-4">
            <Button className="bg-white text-[#0052FF] hover:bg-slate-50 hover:scale-105 transition-all shadow-xl rounded-full px-8 py-6 font-bold">
              Add New Product
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all rounded-full px-8 py-6 font-bold">
              View Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats - Antigravity Hover Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Revenue", icon: DollarSign, value: "₹45,231.89", subtext: "+20.1% from last month", trend: "up" },
          { title: "Active Orders", icon: ShoppingBag, value: "+2350", subtext: "+180.1% from last month", trend: "up" },
          { title: "Store Views", icon: Globe, value: "12,234", subtext: "+19% from last month", trend: "up" },
          { title: "Conversion Rate", icon: Activity, value: "4.3%", subtext: "-0.5% from last month", trend: "down" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-3xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {stat.title}
              </CardTitle>
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center border border-slate-100 dark:border-zinc-700">
                <stat.icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{stat.value}</div>
              <p className="text-xs font-semibold flex items-center gap-1 text-slate-500">
                {stat.trend === 'up' ? (
                  <span className="text-emerald-500 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md"><ArrowUpRight className="w-3 h-3 mr-1" />{stat.subtext.split(' ')[0]}</span>
                ) : (
                  <span className="text-red-500 flex items-center bg-red-50 px-1.5 py-0.5 rounded-md"><ArrowDownRight className="w-3 h-3 mr-1" />{stat.subtext.split(' ')[0]}</span>
                )}
                {' '}{stat.subtext.split(' ').slice(1).join(' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Main Chart */}
        <Card className="lg:col-span-4 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl bg-white/80 backdrop-blur-xl p-2">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Revenue Overview</CardTitle>
            <CardDescription className="font-medium text-slate-500">Daily revenue across all sales channels.</CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0052FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`} 
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#0052FF" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders - Floating List */}
        <Card className="lg:col-span-3 border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl bg-white/80 backdrop-blur-xl p-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Recent Orders</CardTitle>
              <CardDescription className="font-medium text-slate-500">Live order feed.</CardDescription>
            </div>
            <Button variant="ghost" className="text-[#0052FF] font-semibold hover:bg-blue-50">View all</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: 'Olivia Martin', email: 'olivia.martin@email.com', amount: '₹1,999.00', status: 'Processing' },
                { name: 'Jackson Lee', email: 'jackson.lee@email.com', amount: '₹39.00', status: 'Completed' },
                { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', amount: '₹299.00', status: 'Completed' },
                { name: 'William Kim', email: 'will@email.com', amount: '₹99.00', status: 'Pending' },
                { name: 'Sofia Davis', email: 'sofia.davis@email.com', amount: '₹39.00', status: 'Completed' },
              ].map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 group-hover:bg-[#0052FF]/10 group-hover:text-[#0052FF] transition-colors">
                      {order.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{order.name}</p>
                      <p className="text-xs text-slate-500 font-medium">{order.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-900">{order.amount}</p>
                    <Badge variant="outline" className={`
                      border-0 text-[10px] font-bold mt-1 uppercase tracking-wider
                      ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : ''}
                      ${order.status === 'Processing' ? 'bg-blue-50 text-[#0052FF]' : ''}
                      ${order.status === 'Pending' ? 'bg-amber-50 text-amber-600' : ''}
                    `}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
