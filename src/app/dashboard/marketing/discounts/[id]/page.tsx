'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditDiscountPage() {
  const router = useRouter();
  const { id } = useParams();
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const { data, isLoading } = useSWR(storeId && id ? `/api/discounts/${id}?storeId=${storeId}` : null, fetcher);

  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'percentage', // percentage or fixed_amount
    value: '',
    minOrderAmount: '',
    usageLimit: '',
    startsAt: '',
    endsAt: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (data?.discount) {
      const d = data.discount;
      setForm({
        code: d.code || '',
        name: d.name || '',
        type: d.type || 'percentage',
        value: d.value?.toString() || '',
        minOrderAmount: d.minOrderAmount?.toString() || '',
        usageLimit: d.usageLimit?.toString() || '',
        startsAt: d.startsAt ? d.startsAt.split('T')[0] : '',
        endsAt: d.endsAt ? d.endsAt.split('T')[0] : '',
        isActive: d.isActive ?? true,
      });
    }
  }, [data]);

  const set = (field: string, val: any) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        storeId,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };

      const res = await fetch(`/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      
      toast.success('Discount updated');
      router.push('/dashboard/marketing/discounts');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update discount');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/discounts/${id}?storeId=${storeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      
      toast.success('Discount deleted');
      router.push('/dashboard/marketing/discounts');
    } catch (err) {
      toast.error('Could not delete discount');
      setDeleting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/marketing/discounts">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Edit Discount</h2>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Discount Details</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-1">
              <Label>Discount Code</Label>
              <Input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} required className="uppercase" />
            </div>

            <div className="space-y-1">
              <Label>Discount Name / Title</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => set('type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Value</Label>
                <div className="relative">
                  {form.type === 'fixed_amount' && <span className="absolute left-3 top-2.5 text-gray-500">₹</span>}
                  <Input type="number" min="0" step={form.type === 'percentage' ? '1' : '0.01'} max={form.type === 'percentage' ? '100' : undefined} value={form.value} onChange={e => set('value', e.target.value)} required className={form.type === 'fixed_amount' ? 'pl-7' : ''} />
                  {form.type === 'percentage' && <span className="absolute right-3 top-2.5 text-gray-500">%</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Requirements & Limits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Minimum Purchase Amount (₹)</Label>
              <Input type="number" min="0" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Maximum Total Uses</Label>
              <Input type="number" min="1" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} placeholder="Unlimited" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Active Dates</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input type="date" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>End Date</Label>
              <Input type="date" value={form.endsAt} onChange={e => set('endsAt', e.target.value)} />
            </div>
            <div className="col-span-2 pt-2 flex items-center space-x-2">
              <Checkbox id="active" checked={form.isActive} onCheckedChange={(checked) => set('isActive', !!checked)} />
              <Label htmlFor="active">Discount is active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href="/dashboard/marketing/discounts">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
