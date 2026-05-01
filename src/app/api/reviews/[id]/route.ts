import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let review;
    try {
      review = await db.review.findUnique({
        where: { id },
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true },
          },
        },
      });
    } catch {
      // Fallback to raw SQL
      const results = await db.$queryRawUnsafe(
        `SELECT r.*, p.name as productName, p.slug as productSlug, p.images as productImages
         FROM Review r
         LEFT JOIN Product p ON r.productId = p.id
         WHERE r.id = ?`,
        id
      );
      const rows = results as Record<string, unknown>[];
      if (rows.length === 0) {
        review = null;
      } else {
        const r = rows[0];
        review = {
          id: r.id,
          productId: r.productId,
          storeId: r.storeId,
          customerName: r.customerName,
          customerEmail: r.customerEmail,
          rating: r.rating,
          title: r.title,
          content: r.content,
          isVerified: r.isVerified,
          isApproved: r.isApproved,
          response: r.response,
          respondedAt: r.respondedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          product: {
            id: r.productId,
            name: r.productName,
            slug: r.productSlug,
            images: r.productImages,
          },
        };
      }
    }

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ review }, { status: 200 });
  } catch (error) {
    console.error('Get review error:', error);
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
    const { isApproved, response, rating, title, content, isVerified } = body;

    // Find the review and verify ownership
    let review;
    try {
      review = await db.review.findUnique({ where: { id } });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Review WHERE id = ?',
        id
      );
      const rows = results as Record<string, unknown>[];
      review = rows.length > 0 ? rows[0] : null;
    }

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify user owns the store
    const storeId = (review as Record<string, unknown>).storeId as string;
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (isApproved !== undefined) {
      updateData.isApproved = isApproved;
    }

    if (isVerified !== undefined) {
      updateData.isVerified = isVerified;
    }

    if (response !== undefined) {
      updateData.response = response;
      updateData.respondedAt = response ? new Date() : null;
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
      updateData.rating = parseInt(String(rating));
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
    }

    let updatedReview;
    try {
      updatedReview = await db.review.update({
        where: { id },
        data: updateData,
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true },
          },
        },
      });
    } catch {
      // Fallback to raw SQL
      const setClauses: string[] = ['updatedAt = datetime(\'now\')'];
      const sqlParams: unknown[] = [];

      if (updateData.isApproved !== undefined) {
        setClauses.push('isApproved = ?');
        sqlParams.push(updateData.isApproved ? 1 : 0);
      }
      if (updateData.isVerified !== undefined) {
        setClauses.push('isVerified = ?');
        sqlParams.push(updateData.isVerified ? 1 : 0);
      }
      if (updateData.response !== undefined) {
        setClauses.push('response = ?');
        sqlParams.push(updateData.response);
        setClauses.push('respondedAt = ?');
        sqlParams.push(updateData.respondedAt ? new Date().toISOString() : null);
      }
      if (updateData.rating !== undefined) {
        setClauses.push('rating = ?');
        sqlParams.push(updateData.rating);
      }
      if (updateData.title !== undefined) {
        setClauses.push('title = ?');
        sqlParams.push(updateData.title);
      }
      if (updateData.content !== undefined) {
        setClauses.push('content = ?');
        sqlParams.push(updateData.content);
      }

      sqlParams.push(id);
      await db.$executeRawUnsafe(
        `UPDATE Review SET ${setClauses.join(', ')} WHERE id = ?`,
        ...sqlParams
      );
      updatedReview = { id, ...updateData };
    }

    return NextResponse.json({ review: updatedReview }, { status: 200 });
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Find the review and verify ownership
    let review;
    try {
      review = await db.review.findUnique({ where: { id } });
    } catch {
      const results = await db.$queryRawUnsafe(
        'SELECT * FROM Review WHERE id = ?',
        id
      );
      const rows = results as Record<string, unknown>[];
      review = rows.length > 0 ? rows[0] : null;
    }

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const storeId = (review as Record<string, unknown>).storeId as string;
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    try {
      await db.review.delete({ where: { id } });
    } catch {
      await db.$executeRawUnsafe('DELETE FROM Review WHERE id = ?', id);
    }

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
