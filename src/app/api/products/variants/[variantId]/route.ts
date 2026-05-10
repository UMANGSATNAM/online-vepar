import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/products/variants/[variantId] - Get a single variant
export async function GET(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { variantId } = await params;

    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: { store: { select: { ownerId: true } } },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (variant.product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ variant }, { status: 200 });
  } catch (error) {
    console.error('Get variant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products/variants/[variantId] - Update a variant
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { variantId } = await params;

    const existingVariant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: { store: { select: { ownerId: true } } },
        },
      },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (existingVariant.product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.sku !== undefined) updateData.sku = body.sku?.trim() || null;
    if (body.price !== undefined) updateData.price = body.price !== null ? parseFloat(String(body.price)) : null;
    if (body.comparePrice !== undefined) updateData.comparePrice = body.comparePrice ? parseFloat(String(body.comparePrice)) : null;
    if (body.stock !== undefined) updateData.stock = parseInt(String(body.stock));
    if (body.options !== undefined) updateData.options = JSON.stringify(body.options);
    if (body.option1 !== undefined) updateData.option1 = body.option1 || null;
    if (body.option2 !== undefined) updateData.option2 = body.option2 || null;
    if (body.option3 !== undefined) updateData.option3 = body.option3 || null;
    if (body.position !== undefined) updateData.position = parseInt(String(body.position));
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const variant = await db.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    return NextResponse.json({ variant }, { status: 200 });
  } catch (error) {
    console.error('Update variant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products/variants/[variantId] - Delete a variant
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { variantId } = await params;

    const existingVariant = await db.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: { store: { select: { ownerId: true } } },
        },
      },
    });

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    if (existingVariant.product.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.productVariant.delete({ where: { id: variantId } });

    return NextResponse.json({ message: 'Variant deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete variant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
