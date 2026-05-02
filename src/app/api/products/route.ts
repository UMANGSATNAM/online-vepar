import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, generateSlug } from '@/lib/auth';
import { logActivity } from '@/lib/activity-logger';

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
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

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
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.categoryId = category;
    }

    if (featured !== null && featured !== '') {
      where.featured = featured === 'true';
    }

    const total = await db.product.count({ where });

    const products = await db.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        categoryRef: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
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
      name, description, price, comparePrice, cost, images,
      category, tags, sku, barcode, stock, trackInventory,
      weight, weightUnit, status, featured, storeId, categoryId,
    } = body;

    if (!name || price === undefined || !storeId) {
      return NextResponse.json(
        { error: 'Name, price, and storeId are required' },
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

    const slug = generateSlug(name);

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(String(price)),
        comparePrice: comparePrice ? parseFloat(String(comparePrice)) : null,
        cost: cost ? parseFloat(String(cost)) : null,
        images: images ? JSON.stringify(images) : '[]',
        category,
        tags: tags ? JSON.stringify(tags) : '[]',
        sku,
        barcode,
        stock: stock || 0,
        trackInventory: trackInventory !== undefined ? trackInventory : true,
        weight: weight ? parseFloat(String(weight)) : null,
        weightUnit: weightUnit || 'kg',
        status: status || 'draft',
        featured: featured || false,
        storeId,
        categoryId,
      },
      include: {
        categoryRef: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Log activity
    await logActivity({
      storeId,
      userId: user.id,
      userName: user.name,
      action: 'product.created',
      entity: 'product',
      entityId: product.id,
      entityName: product.name,
      details: { price: product.price, status: product.status },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
