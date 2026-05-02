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

    const existingPage = await db.page.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (existingPage.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, type, published } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = generateSlug(title);
    }
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (published !== undefined) updateData.published = published;

    const page = await db.page.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ page }, { status: 200 });
  } catch (error) {
    console.error('Update page error:', error);
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

    const existingPage = await db.page.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (existingPage.store.ownerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await db.page.delete({ where: { id } });

    return NextResponse.json({ message: 'Page deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
