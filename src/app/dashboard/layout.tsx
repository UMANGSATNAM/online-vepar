import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Find the first store for this user
  const store = await db.store.findFirst({
    where: { ownerId: user.id },
  });

  if (!store && user.role !== 'superadmin' && user.role !== 'subadmin') {
    // If no store, they probably need to create one, but for now we'll just show a placeholder
    // Or we could redirect to an onboarding page. Let's render children which might handle it.
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">OmniBuilder</h2>
          {store && <p className="text-sm text-gray-500 mt-1 truncate">{store.name}</p>}
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Dashboard</Link>
          <Link href="/dashboard/orders" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Orders</Link>
          <div className="space-y-1">
            <Link href="/dashboard/products" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Products</Link>
            <Link href="/dashboard/products/inventory" className="block pl-8 pr-4 py-1.5 rounded-md hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm">Inventory</Link>
          </div>
          <Link href="/dashboard/customers" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Customers</Link>
          <Link href="/dashboard/analytics" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Analytics</Link>
          <div className="space-y-1">
            <Link href="/dashboard/marketing" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Marketing</Link>
            <Link href="/dashboard/marketing/discounts" className="block pl-8 pr-4 py-1.5 rounded-md hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm">Discounts</Link>
          </div>
          <Link href="/dashboard/builder" className="block px-4 py-2 rounded-md hover:bg-indigo-50 text-indigo-700 hover:text-indigo-900 font-medium">Store Builder</Link>
          <Link href="/dashboard/settings" className="block px-4 py-2 rounded-md hover:bg-gray-50 text-gray-700 hover:text-gray-900 font-medium">Settings</Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-800">
            {store?.name || 'Dashboard'}
            {!store?.isActive && store?.name && (
              <span className="ml-3 text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded-full">
                Suspended
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4">
            <Link 
              href={store?.domain ? `https://${store.domain}` : '#'} 
              target="_blank"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View Store
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
