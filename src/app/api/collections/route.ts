import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const where: Record<string, unknown> = { storeId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    let collections;
    try {
      collections = await db.collection.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          collectionProducts: {
            select: { id: true, productId: true, position: true },
          },
        },
      });
    } catch {
      // Fallback to raw SQL if Prisma Client is stale
      let whereClause = 'WHERE c.storeId = ?';
      const params: unknown[] = [storeId];
      if (search) {
        whereClause += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.slug LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      if (status) {
        whereClause += ' AND c.status = ?';
        params.push(status);
      }
      collections = await db.$queryRawUnsafe(
        `SELECT c.*, COUNT(cp.id) as productCount FROM Collection c LEFT JOIN CollectionProduct cp ON c.id = cp.collectionId ${whereClause} GROUP BY c.id ORDER BY c.createdAt DESC`,
        ...params
      );
    }

    // Add product count to each collection
    const enrichedCollections = collections.map((collection: Record<string, unknown>) => ({
      ...collection,
      productCount: Array.isArray(collection.collectionProducts)
        ? collection.collectionProducts.length
        : Number(collection.productCount || 0),
    }));

    return NextResponse.json({ collections: enrichedCollections }, { status: 200 });
  } catch (error) {
    console.error('Get collections error:', error);
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
    const {
      storeId, name, slug, description, image, type,
      conditions, sortOrder, status, featured, productIds,
    } = body;

    if (!storeId || !name) {
      return NextResponse.json(
        { error: 'storeId and name are required' },
        { status: 400 }
      );
    }

    if (type && type !== 'manual' && type !== 'auto') {
      return NextResponse.json(
        { error: 'type must be "manual" or "auto"' },
        { status: 400 }
      );
    }

    if (status && status !== 'active' && status !== 'draft') {
      return NextResponse.json(
        { error: 'status must be "active" or "draft"' },
        { status: 400 }
      );
    }

    // Verify user owns this store
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Generate slug from name if not provided
    const collectionSlug = slug || name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check for duplicate slug within store
    const existing = await db.collection.findFirst({
      where: { storeId, slug: collectionSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A collection with this slug already exists for this store' },
        { status: 409 }
      );
    }

    const collection = await db.collection.create({
      data: {
        storeId,
        name,
        slug: collectionSlug,
        description: description || null,
        image: image || null,
        type: type || 'manual',
        conditions: conditions || '{}',
        sortOrder: sortOrder || 'best-selling',
        status: status || 'active',
        featured: featured || false,
      },
    });

    // Add products to collection if provided (manual type)
    if (type === 'manual' && productIds && Array.isArray(productIds) && productIds.length > 0) {
      await db.collectionProduct.createMany({
        data: productIds.map((productId: string, index: number) => ({
          collectionId: collection.id,
          productId,
          position: index,
        })),
      });
    }

    // Fetch the collection with product count
    const result = await db.collection.findUnique({
      where: { id: collection.id },
      include: {
        collectionProducts: {
          select: { id: true, productId: true, position: true },
        },
      },
    });

    return NextResponse.json({ collection: { ...result, productCount: result?.collectionProducts.length || 0 } }, { status: 201 });
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
