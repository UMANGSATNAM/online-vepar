'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: storeData, mutate } = useSWR('/api/stores/mine', fetcher);
  const store = storeData?.store;

  const [form, setForm] = useState({
    name: store?.name ?? '',
    description: store?.description ?? '',
    email: store?.email ?? '',
    phone: store?.phone ?? '',
    currency: store?.currency ?? 'INR',
  });
  const [saving, setSaving] = useState(false);

  // Keep form in sync after load
  if (store && form.name === '' && store.name) {
    setForm({
      name: store.name,
      description: store.description ?? '',
      email: store.email ?? '',
      phone: store.phone ?? '',
      currency: store.currency ?? 'INR',
    });
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await mutate();
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h2>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Store Details</CardTitle>
            <CardDescription>Public-facing information about your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Store Name *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Store Email</Label>
              <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>Platform URL</Label>
            {store?.slug ? (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                <code className="text-sm text-gray-600">{store.slug}.onlinevepar.com</code>
                <a href={`https://${store.slug}.onlinevepar.com`} target="_blank" className="text-xs text-indigo-600 ml-auto">Visit ↗</a>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Your store URL will appear here once created.</p>
            )}
            {store?.domain && (
              <>
                <Label className="mt-3 block">Custom Domain</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <code className="text-sm text-gray-600">{store.domain}</code>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-md border border-yellow-200 bg-yellow-50">
              <div>
                <p className="text-sm font-medium text-yellow-800">Trial Plan</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Your trial {store?.trialEndsAt ? `ends on ${new Date(store.trialEndsAt).toLocaleDateString('en-IN')}` : 'is active'}.
                </p>
              </div>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">Upgrade Now</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  );
}
