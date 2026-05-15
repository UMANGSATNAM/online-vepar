import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Package, ShoppingCart, Users } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const store = await db.store.findFirst({
    where: { ownerId: user.id },
  });

  if (!store) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to OmniBuilder</h2>
        <p className="text-gray-600 mb-8">Let's get started by creating your first store.</p>
        <button className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700">
          Create Store
        </button>
      </div>
    );
  }

  // Fetch quick stats
  const [totalOrders, totalRevenue, totalProducts, totalCustomers] = await Promise.all([
    db.order.count({ where: { storeId: store.id } }),
    db.order.aggregate({
      where: { storeId: store.id, paymentStatus: 'paid' },
      _sum: { total: true }
    }),
    db.product.count({ where: { storeId: store.id } }),
    db.customer.count({ where: { storeId: store.id } }),
  ]);

  const recentOrders = await db.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h2>
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/products/new" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
            Add Product
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue._sum.total?.toLocaleString() || '0'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">₹{order.total.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">✓</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create store</p>
                <p className="text-xs text-gray-500">Your store is created and ready.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 text-transparent flex items-center justify-center shrink-0">○</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Add first product</p>
                <p className="text-xs text-gray-500">Add a product to start selling.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 text-transparent flex items-center justify-center shrink-0">○</div>
              <div>
                <p className="text-sm font-medium text-gray-900">Customize theme</p>
                <p className="text-xs text-gray-500">Make your store look professional.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
