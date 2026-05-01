import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, generateSlug } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const stores = await db.store.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true, orders: true, customers: true },
        },
      },
    });

    return NextResponse.json({ stores }, { status: 200 });
  } catch (error) {
    console.error('Get stores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug: customSlug, description, logo, banner, theme, primaryColor, currency, domain } = body;

    if (!name) {
      return NextResponse.json({ error: 'Store name is required' }, { status: 400 });
    }

    const slug = customSlug || generateSlug(name);

    // Check if slug already exists
    const existingStore = await db.store.findUnique({ where: { slug } });
    if (existingStore) {
      return NextResponse.json({ error: 'Store with this name already exists' }, { status: 409 });
    }

    const store = await db.store.create({
      data: {
        name,
        slug,
        description,
        logo,
        banner,
        theme: theme || 'modern',
        primaryColor: primaryColor || '#10b981',
        currency: currency || 'INR',
        domain,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    console.error('Create store error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
