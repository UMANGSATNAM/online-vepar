import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const storeId = searchParams.get('storeId');

    let store;
    if (slug) {
      store = await db.store.findFirst({
        where: { slug, isActive: true },
      });
    } else if (storeId) {
      store = await db.store.findFirst({
        where: { id: storeId, isActive: true },
      });
    }

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const products = await db.product.findMany({
      where: {
        storeId: store.id,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        images: true,
        sku: true,
        stock: true,
        trackInventory: true,
        featured: true,
        category: true,
        tags: true,
      },
    });

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        logo: store.logo,
        banner: store.banner,
        theme: store.theme,
        primaryColor: store.primaryColor,
        currency: store.currency,
      },
      products: products.map((p) => ({
        ...p,
        images: p.images ? JSON.parse(p.images) : [],
        tags: p.tags ? JSON.parse(p.tags) : [],
      })),
    }, { status: 200 });
  } catch (error) {
    console.error('Storefront GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
