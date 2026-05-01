import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, generateSlug } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

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

    const pages = await db.page.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pages }, { status: 200 });
  } catch (error) {
    console.error('Get pages error:', error);
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
    const { title, content, type, published, storeId } = body;

    if (!title || !storeId) {
      return NextResponse.json(
        { error: 'Title and storeId are required' },
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

    const slug = generateSlug(title);

    const page = await db.page.create({
      data: {
        title,
        slug,
        content,
        type: type || 'page',
        published: published || false,
        storeId,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Create page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
