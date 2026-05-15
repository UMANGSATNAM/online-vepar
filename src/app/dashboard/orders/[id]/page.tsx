'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Mail, Phone, Package, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { data: storeData } = useSWR('/api/stores/mine', fetcher);
  const storeId = storeData?.store?.id;

  const { data, isLoading, mutate } = useSWR(
    storeId && id ? `/api/orders/${id}?storeId=${storeId}` : null,
    fetcher
  );

  const order = data?.order;

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`Order marked as ${status}`);
      mutate();
    } catch (err) {
      toast.error('Could not update status');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Order #{order.orderNumber}</h2>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium', timeStyle: 'short'
            })}
          </p>
        </div>
        <Badge className={`${STATUS_COLORS[order.status] ?? 'bg-gray-100'} border-0 uppercase`}>
          {order.status}
        </Badge>
        <Badge className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {order.paymentStatus.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                      {item.product?.images ? (
                        <img src={JSON.parse(item.product.images)[0]} alt={item.productName} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-gray-400 text-xs">No img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-sm text-gray-500">₹{item.price.toLocaleString()} × {item.quantity}</p>
                    </div>
                    <div className="text-right font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{order.subtotal?.toLocaleString() ?? 0}</span>
                </div>
                {order.discountTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discountTotal?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-medium">₹{order.taxTotal?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium">₹{order.shippingTotal?.toLocaleString() ?? 0}</span>
                </div>
                <div className="border-t border-gray-100 mt-2 pt-2 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>₹{order.total?.toLocaleString() ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Mail className="h-4 w-4" /> {order.customerEmail || 'No email provided'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Phone className="h-4 w-4" /> {order.customerPhone || 'No phone provided'}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-medium flex items-center gap-2 text-sm mb-2"><MapPin className="h-4 w-4" /> Shipping Address</h4>
                {order.shippingAddress ? (
                  <address className="not-italic text-sm text-gray-600 space-y-1">
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  </address>
                ) : (
                  <p className="text-sm text-gray-500">No address provided</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <Button 
                className="w-full justify-start" 
                variant={order.status === 'processing' ? 'default' : 'outline'}
                onClick={() => handleUpdateStatus('processing')}
              >
                Mark as Processing
              </Button>
              <Button 
                className="w-full justify-start" 
                variant={order.status === 'shipped' ? 'default' : 'outline'}
                onClick={() => handleUpdateStatus('shipped')}
              >
                Mark as Shipped
              </Button>
              <Button 
                className="w-full justify-start" 
                variant={order.status === 'delivered' ? 'default' : 'outline'}
                onClick={() => handleUpdateStatus('delivered')}
              >
                Mark as Delivered
              </Button>
              <Button 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
                variant="ghost"
                onClick={() => handleUpdateStatus('cancelled')}
              >
                Cancel Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
