'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Users, Package, IndianRupee } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Mock analytics data until real analytics pipeline is set up
const MOCK_REVENUE = [
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 58000 },
  { month: 'Mar', revenue: 51000 },
  { month: 'Apr', revenue: 73000 },
  { month: 'May', revenue: 89000 },
  { month: 'Jun', revenue: 112000 },
];

const MOCK_ORDERS = [
  { day: 'Mon', orders: 12 },
  { day: 'Tue', orders: 19 },
  { day: 'Wed', orders: 9 },
  { day: 'Thu', orders: 26 },
  { day: 'Fri', orders: 31 },
  { day: 'Sat', orders: 45 },
  { day: 'Sun', orders: 38 },
];

function StatCard({ title, value, change, icon: Icon, prefix = '' }: {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  prefix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{prefix}{value}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        </div>
        <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(change)}% vs last month
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const { data: statsData } = useSWR(storeId ? `/api/analytics/stats?storeId=${storeId}` : null, fetcher);

  const stats = statsData ?? {
    totalRevenue: 112000,
    revenueChange: 25.8,
    totalOrders: 48,
    ordersChange: 12.3,
    totalProducts: 23,
    productsChange: 4.5,
    totalCustomers: 31,
    customersChange: 8.9,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-500 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">Using sample data — real analytics coming soon</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={(stats.totalRevenue / 1000).toFixed(1) + 'K'} change={stats.revenueChange} icon={IndianRupee} prefix="₹" />
        <StatCard title="Total Orders" value={stats.totalOrders} change={stats.ordersChange} icon={ShoppingCart} />
        <StatCard title="Products" value={stats.totalProducts} change={stats.productsChange} icon={Package} />
        <StatCard title="Customers" value={stats.totalCustomers} change={stats.customersChange} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MOCK_REVENUE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Orders This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_ORDERS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
