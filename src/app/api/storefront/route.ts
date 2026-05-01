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
        variants: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            comparePrice: true,
            stock: true,
            options: true,
            position: true,
            isActive: true,
          },
        },
      },
    });

    // Get approved review stats per product
    const reviewStats = await db.review.groupBy({
      by: ['productId'],
      where: { storeId: store.id, isApproved: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    const reviewStatsMap = new Map(
      reviewStats.map((s) => [s.productId, { avgRating: s._avg.rating ? Math.round(s._avg.rating * 10) / 10 : 0, reviewCount: s._count.id }])
    );

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
      products: products.map((p) => {
        const stats = reviewStatsMap.get(p.id);
        return {
          ...p,
          images: p.images ? JSON.parse(p.images) : [],
          tags: p.tags ? JSON.parse(p.tags) : [],
          variants: p.variants.map((v) => ({
            ...v,
            options: v.options ? JSON.parse(v.options) : {},
          })),
          avgRating: stats?.avgRating || 0,
          reviewCount: stats?.reviewCount || 0,
        };
      }),
    }, { status: 200 });
  } catch (error) {
    console.error('Storefront GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
