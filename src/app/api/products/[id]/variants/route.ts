import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/products/[id]/variants - List variants for a product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Verify product exists and user owns the store
    const product = await db.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const variants = await db.productVariant.findMany({
      where: { productId: id },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ variants }, { status: 200 });
  } catch (error) {
    console.error('Get variants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products/[id]/variants - Create a new variant
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Verify product exists and user owns the store
    const product = await db.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true, id: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, sku, price, comparePrice, stock, options, position, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Variant name is required' }, { status: 400 });
    }

    // Get the max position for ordering
    const maxPositionVariant = await db.productVariant.findFirst({
      where: { productId: id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = position !== undefined ? position : (maxPositionVariant?.position ?? -1) + 1;

    const variant = await db.productVariant.create({
      data: {
        productId: id,
        storeId: product.store.id,
        name: name.trim(),
        sku: sku?.trim() || null,
        price: price !== undefined && price !== null ? parseFloat(String(price)) : null,
        comparePrice: comparePrice ? parseFloat(String(comparePrice)) : null,
        stock: stock !== undefined ? parseInt(String(stock)) : 0,
        options: options ? JSON.stringify(options) : '{}',
        position: nextPosition,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error('Create variant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
