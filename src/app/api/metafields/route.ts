import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const ownerResource = searchParams.get('ownerResource') || 'store';
    const ownerId = searchParams.get('ownerId') || storeId;
    const namespace = searchParams.get('namespace');

    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });

    const where: Record<string, unknown> = { storeId, ownerResource };
    if (ownerId) where.ownerId = ownerId;
    if (namespace) where.namespace = namespace;

    const metafields = await db.metafield.findMany({
      where,
      orderBy: [{ namespace: 'asc' }, { key: 'asc' }],
    });

    return NextResponse.json({ metafields });
  } catch (error) {
    console.error('GET metafields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { storeId, namespace, key, value, type, description, ownerResource, ownerId } = body;

    if (!storeId || !namespace || !key || !type || !ownerResource) {
      return NextResponse.json({ error: 'storeId, namespace, key, type, and ownerResource are required' }, { status: 400 });
    }

    // Upsert: update if namespace+key+ownerResource+ownerId already exists
    const metafield = await db.metafield.upsert({
      where: {
        storeId_namespace_key_ownerResource_ownerId: {
          storeId,
          namespace,
          key,
          ownerResource,
          ownerId: ownerId || storeId,
        }
      },
      update: { value: value || '', type, description },
      create: {
        storeId,
        namespace,
        key,
        value: value || '',
        type,
        description,
        ownerResource,
        ownerId: ownerId || storeId,
      },
    });

    return NextResponse.json({ metafield }, { status: 201 });
  } catch (error) {
    console.error('POST metafield error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
