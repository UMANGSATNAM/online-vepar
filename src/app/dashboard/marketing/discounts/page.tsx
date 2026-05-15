'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DiscountsPage() {
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const { data, isLoading } = useSWR(storeId ? `/api/discounts?storeId=${storeId}` : null, fetcher);

  const discounts = data?.discounts ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Discounts</h2>
        <Link href="/dashboard/marketing/discounts/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Discount
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-500">Loading discounts…</div>
          ) : discounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                <Tag className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-sm text-gray-500">No discounts active right now.</p>
              <Link href="/dashboard/marketing/discounts/new">
                <Button size="sm">Create a discount code</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Value</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Uses</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {discounts.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{d.code}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{d.type === 'fixed_amount' ? 'Fixed Amount' : d.type}</td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {d.type === 'percentage' ? `${d.value}% OFF` : `₹${d.value} OFF`}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={d.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{d.usedCount || 0} / {d.usageLimit || '∞'}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/marketing/discounts/${d.id}`} className="text-xs font-medium text-indigo-600 hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
