'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Mail, Phone } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const params = new URLSearchParams({
    ...(storeId ? { storeId } : {}),
    ...(search ? { search } : {}),
    page: String(page),
    limit: '20',
  });

  const { data, isLoading } = useSWR(storeId ? `/api/customers?${params}` : null, fetcher);

  const customers = data?.customers ?? [];
  const pagination = data?.pagination ?? { totalPages: 1, page: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h2>
        <Button className="gap-2" disabled>
          <PlusCircle className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Input
        placeholder="Search by name, email or phone…"
        className="max-w-sm"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-500">Loading customers…</div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm text-gray-500">No customers yet. Customers appear once they place an order.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3">Total Spent</th>
                  <th className="px-6 py-3">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      <div className="flex flex-col gap-0.5">
                        {c.email && <span className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" />{c.phone}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{c.totalOrders}</td>
                    <td className="px-6 py-4 font-medium">₹{Number(c.totalSpent).toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
