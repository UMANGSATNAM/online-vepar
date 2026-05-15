'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewProductPage() {
  const router = useRouter();
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const { data: categoriesData } = useSWR(storeId ? `/api/categories?storeId=${storeId}` : null, fetcher);
  const categories = categoriesData?.categories ?? [];

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    sku: '',
    stock: '0',
    categoryId: '',
    status: 'draft',
    tags: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          storeId,
          price: parseFloat(form.price),
          comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
          stock: parseInt(form.stock),
          tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Product created');
      router.push('/dashboard/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">New Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Product Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Premium Cotton T-Shirt" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your product…" rows={4} />
            </div>
            <div className="space-y-1">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="cotton, summer, casual" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing & Inventory</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Price (₹) *</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Compare at Price (₹)</Label>
              <Input type="number" min="0" step="0.01" value={form.comparePrice} onChange={e => set('comparePrice', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="PROD-001" />
            </div>
            <div className="space-y-1">
              <Label>Stock</Label>
              <Input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Organisation</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={form.categoryId} onValueChange={v => set('categoryId', v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/products">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
