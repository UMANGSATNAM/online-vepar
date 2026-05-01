import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, generateSlug } from '@/lib/auth';

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

    const existingCategory = await db.category.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (existingCategory.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, image } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }
    if (image !== undefined) updateData.image = image;

    const category = await db.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error('Update category error:', error);
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

    const existingCategory = await db.category.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (existingCategory.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
