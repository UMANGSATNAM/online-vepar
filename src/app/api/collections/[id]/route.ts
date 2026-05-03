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

    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        collectionProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                status: true,
                featured: true,
                category: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: { id: collection.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ collection: { ...collection, productCount: collection.collectionProducts.length } }, { status: 200 });
  } catch (error) {
    console.error('Get collection error:', error);
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
    const body = await request.json();
    const {
      name, slug, description, image, type,
      conditions, sortOrder, status, featured,
      addProductIds, removeProductIds,
    } = body;

    // Verify collection exists and ownership
    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const store = await db.store.findFirst({
      where: { id: collection.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check for duplicate slug if changing
    if (slug && slug !== collection.slug) {
      const existing = await db.collection.findFirst({
        where: { storeId: collection.storeId, slug, NOT: { id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'A collection with this slug already exists' },
          { status: 409 }
        );
      }
    }

    // Update collection details
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (type !== undefined) updateData.type = type;
    if (conditions !== undefined) updateData.conditions = conditions;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (status !== undefined) updateData.status = status;
    if (featured !== undefined) updateData.featured = featured;

    if (Object.keys(updateData).length > 0) {
      await db.collection.update({
        where: { id },
        data: updateData,
      });
    }

    // Add products to collection
    if (addProductIds && Array.isArray(addProductIds) && addProductIds.length > 0) {
      // Get current max position
      const existingProducts = await db.collectionProduct.findMany({
        where: { collectionId: id },
        orderBy: { position: 'desc' },
        take: 1,
      });
      const maxPosition = existingProducts.length > 0 ? existingProducts[0].position : -1;

      await db.collectionProduct.createMany({
        data: addProductIds.map((productId: string, index: number) => ({
          collectionId: id,
          productId,
          position: maxPosition + 1 + index,
        })),
        skipDuplicates: true,
      });
    }

    // Remove products from collection
    if (removeProductIds && Array.isArray(removeProductIds) && removeProductIds.length > 0) {
      await db.collectionProduct.deleteMany({
        where: {
          collectionId: id,
          productId: { in: removeProductIds },
        },
      });
    }

    // Fetch updated collection
    const updated = await db.collection.findUnique({
      where: { id },
      include: {
        collectionProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                status: true,
                featured: true,
                category: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    return NextResponse.json({ collection: { ...updated, productCount: updated?.collectionProducts.length || 0 } }, { status: 200 });
  } catch (error) {
    console.error('Update collection error:', error);
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

    // Verify collection exists and ownership
    const collection = await db.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    const store = await db.store.findFirst({
      where: { id: collection.storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete collection products first, then the collection
    await db.collectionProduct.deleteMany({
      where: { collectionId: id },
    });

    await db.collection.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Collection deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
