'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const params = new URLSearchParams({
    ...(storeId ? { storeId } : {}),
    ...(search ? { search } : {}),
    ...(status !== 'all' ? { status } : {}),
    page: String(page),
    limit: '20',
  });

  const { data, isLoading, mutate } = useSWR(storeId ? `/api/products?${params}` : null, fetcher);

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? { totalPages: 1, page: 1 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Products</h2>
        <Link href="/dashboard/products/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search products…"
          className="max-w-sm"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-500">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <p className="text-sm text-gray-500">No products yet.</p>
              <Link href="/dashboard/products/new">
                <Button size="sm">Add your first product</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 w-12"></th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Inventory</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {product.images?.[0] ? (
                        <img src={JSON.parse(product.images)[0]} alt={product.name} className="h-10 w-10 object-cover rounded" />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">?</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 line-clamp-1">{product.name}</div>
                      <div className="text-xs text-gray-400">{product.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{product.category?.name ?? '—'}</td>
                    <td className="px-6 py-4 font-medium">₹{Number(product.price).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={product.stock <= 5 ? 'text-red-600 font-medium' : 'text-gray-700'}>{product.stock}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : product.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/dashboard/products/${product.id}`} className="text-xs font-medium text-indigo-600 hover:underline">Edit</Link>
                    </td>
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
