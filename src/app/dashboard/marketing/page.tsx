'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Tag,
  Mail,
  Megaphone,
  Star,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TOOLS = [
  {
    id: 'discounts',
    icon: Tag,
    title: 'Discount Codes',
    description: 'Create percentage or fixed-amount coupons for your customers.',
    href: '/dashboard/marketing/discounts',
    badge: 'Active',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'email',
    icon: Mail,
    title: 'Email Campaigns',
    description: 'Send targeted emails to your customer segments.',
    href: '/dashboard/marketing/email',
    badge: 'Coming Soon',
    badgeColor: 'bg-gray-100 text-gray-600',
  },
  {
    id: 'reviews',
    icon: Star,
    title: 'Reviews',
    description: 'Manage product reviews and display social proof.',
    href: '/dashboard/marketing/reviews',
    badge: 'Active',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'abandoned',
    icon: Megaphone,
    title: 'Abandoned Cart Recovery',
    description: 'Re-engage customers who left without purchasing.',
    href: '/dashboard/marketing/abandoned-carts',
    badge: 'Coming Soon',
    badgeColor: 'bg-gray-100 text-gray-600',
  },
];

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">Marketing</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <Card key={tool.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <tool.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
              {tool.badge === 'Active' ? (
                <Link href={tool.href}>
                  <Button variant="outline" size="sm">Open</Button>
                </Link>
              ) : (
                <Button variant="outline" size="sm" disabled>Coming Soon</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
