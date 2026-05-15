import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyStoreAccess } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const slug = searchParams.get('slug');

    if (!storeId || !slug) {
      return NextResponse.json({ error: 'storeId and slug are required' }, { status: 400 });
    }

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'dashboard');
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Try to get latest version
    const pageVersion = await db.pageVersion.findFirst({
      where: { storeId, pageSlug: slug },
      orderBy: { versionNum: 'desc' },
    });

    if (!pageVersion) {
      // Return empty default state if none exists
      return NextResponse.json({ 
        pageVersion: { 
          sectionsJson: '[]',
          isPublished: false 
        } 
      });
    }

    return NextResponse.json({ pageVersion });
  } catch (error) {
    console.error('Get page version error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { storeId, pageSlug, sectionsJson, isPublished = true } = await request.json();

    if (!storeId || !pageSlug || !sectionsJson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'dashboard');
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Get current max version
    const currentMax = await db.pageVersion.findFirst({
      where: { storeId, pageSlug },
      orderBy: { versionNum: 'desc' },
      select: { versionNum: true },
    });

    const nextVersion = (currentMax?.versionNum || 0) + 1;

    // Create new version
    const newVersion = await db.pageVersion.create({
      data: {
        storeId,
        pageSlug,
        versionNum: nextVersion,
        sectionsJson,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        createdBy: user.id,
      },
    });

    // If published, maybe unpublish others? (The schema doesn't strictly enforce one published version, but conventionally we might want to).
    if (isPublished) {
      await db.pageVersion.updateMany({
        where: {
          storeId,
          pageSlug,
          id: { not: newVersion.id },
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error) {
    console.error('Save page version error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
