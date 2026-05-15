'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [inventoryEdits, setInventoryEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const params = new URLSearchParams({
    ...(storeId ? { storeId } : {}),
    ...(search ? { search } : {}),
    page: String(page),
    limit: '50',
  });

  const { data, isLoading, mutate } = useSWR(storeId ? `/api/products?${params}` : null, fetcher);

  const products = data?.products ?? [];
  const pagination = data?.pagination ?? { totalPages: 1, page: 1 };

  const handleEdit = (id: string, val: string) => {
    setInventoryEdits(prev => ({ ...prev, [id]: val }));
  };

  const saveInventory = async () => {
    if (Object.keys(inventoryEdits).length === 0) return;
    
    setSaving(true);
    try {
      const updates = Object.entries(inventoryEdits).map(([id, stock]) => ({ id, stock: parseInt(stock, 10) }));
      
      const res = await fetch('/api/products/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates, storeId }),
      });
      
      if (!res.ok) throw new Error('Failed to update inventory');
      
      toast.success('Inventory updated');
      setInventoryEdits({});
      mutate();
    } catch (err) {
      toast.error('Could not save inventory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Inventory</h2>
        <Button 
          className="gap-2" 
          onClick={saveInventory} 
          disabled={saving || Object.keys(inventoryEdits).length === 0}
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Input
        placeholder="Search products to update stock…"
        className="max-w-sm"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-500">Loading inventory…</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-sm text-gray-500">No products found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 w-48 text-right">Available Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 text-gray-500">{p.sku || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Input 
                        type="number" 
                        min="0"
                        className="w-24 text-right ml-auto" 
                        value={inventoryEdits[p.id] !== undefined ? inventoryEdits[p.id] : p.stock}
                        onChange={(e) => handleEdit(p.id, e.target.value)}
                      />
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
