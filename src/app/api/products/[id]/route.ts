import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

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
    const product = await db.product.findUnique({
      where: { id },
      include: {
        categoryRef: {
          select: { id: true, name: true, slug: true },
        },
        store: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Verify user owns this store
    if (product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name, description, price, comparePrice, cost, images,
      category, tags, sku, barcode, stock, trackInventory,
      weight, weightUnit, status, featured, categoryId,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (name !== undefined) updateData.slug = name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(String(comparePrice)) : null;
    if (cost !== undefined) updateData.cost = cost ? parseFloat(String(cost)) : null;
    if (images !== undefined) updateData.images = JSON.stringify(images);
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (sku !== undefined) updateData.sku = sku;
    if (barcode !== undefined) updateData.barcode = barcode;
    if (stock !== undefined) updateData.stock = parseInt(String(stock));
    if (trackInventory !== undefined) updateData.trackInventory = trackInventory;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(String(weight)) : null;
    if (weightUnit !== undefined) updateData.weightUnit = weightUnit;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        categoryRef: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existingProduct = await db.product.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.product.delete({ where: { id } });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
