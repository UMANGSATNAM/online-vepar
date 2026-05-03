import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const productId = searchParams.get('productId');
    const isApproved = searchParams.get('isApproved');
    const rating = searchParams.get('rating');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Build where clause
    const where: Record<string, unknown> = { storeId };

    if (productId) {
      where.productId = productId;
    }

    if (isApproved !== null && isApproved !== '' && isApproved !== undefined) {
      where.isApproved = isApproved === 'true';
    }

    if (rating) {
      where.rating = parseInt(rating);
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    let reviews;
    let total;
    try {
      [reviews, total] = await Promise.all([
        db.review.findMany({
          where,
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true },
            },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.review.count({ where }),
      ]);
    } catch {
      // Fallback to raw SQL if Prisma Client is stale
      let whereClause = 'WHERE r.storeId = ?';
      const params: unknown[] = [storeId];

      if (productId) {
        whereClause += ' AND r.productId = ?';
        params.push(productId);
      }
      if (isApproved !== null && isApproved !== '' && isApproved !== undefined) {
        whereClause += ' AND r.isApproved = ?';
        params.push(isApproved === 'true' ? 1 : 0);
      }
      if (rating) {
        whereClause += ' AND r.rating = ?';
        params.push(parseInt(rating));
      }
      if (search) {
        whereClause += ' AND (r.customerName LIKE ? OR r.title LIKE ? OR r.content LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      const validSortColumns = ['createdAt', 'updatedAt', 'rating', 'customerName'];
      const safeSortBy = validSortColumns.includes(sortBy) ? `r.${sortBy}` : 'r.createdAt';
      const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      reviews = await db.$queryRawUnsafe(
        `SELECT r.*, p.name as productName, p.slug as productSlug, p.images as productImages
         FROM Review r
         LEFT JOIN Product p ON r.productId = p.id
         ${whereClause}
         ORDER BY ${safeSortBy} ${safeSortOrder}
         LIMIT ? OFFSET ?`,
        ...params, limit, skip
      );

      const countResult = await db.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM Review r ${whereClause}`,
        ...params
      );
      total = Array.isArray(countResult) ? (countResult[0] as { count: number }).count : 0;

      // Transform raw results to match Prisma shape
      reviews = (reviews as Record<string, unknown>[]).map((r) => ({
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
      }));
    }

    // Get summary stats
    let stats;
    try {
      const allReviews = await db.review.findMany({
        where: { storeId },
        select: { rating: true, isApproved: true, isVerified: true },
      });

      const totalReviews = allReviews.length;
      const avgRating = totalReviews > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
      const pendingCount = allReviews.filter(r => !r.isApproved).length;
      const verifiedCount = allReviews.filter(r => r.isVerified).length;

      // Rating distribution
      const distribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: allReviews.filter(r => r.rating === star).length,
        percentage: totalReviews > 0
          ? Math.round((allReviews.filter(r => r.rating === star).length / totalReviews) * 100)
          : 0,
      }));

      stats = { totalReviews, avgRating: Math.round(avgRating * 10) / 10, pendingCount, verifiedCount, distribution };
    } catch {
      stats = { totalReviews: 0, avgRating: 0, pendingCount: 0, verifiedCount: 0, distribution: [] };
    }

    return NextResponse.json({
      reviews,
      total: Number(total),
      page,
      totalPages: Math.ceil(Number(total) / limit),
      stats,
    }, { status: 200 });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId, productId, customerName, customerEmail,
      rating, title, content, isVerified,
    } = body;

    // Public endpoint - no auth required for submitting reviews
    if (!storeId || !productId || !customerName || !rating) {
      return NextResponse.json(
        { error: 'storeId, productId, customerName, and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify store exists
    const store = await db.store.findFirst({
      where: { id: storeId, isActive: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Verify product exists
    const product = await db.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let review;
    try {
      review = await db.review.create({
        data: {
          storeId,
          productId,
          customerName,
          customerEmail: customerEmail || null,
          rating: parseInt(String(rating)),
          title: title || null,
          content: content || null,
          isVerified: isVerified || false,
          isApproved: false, // Default: needs merchant approval
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true },
          },
        },
      });
    } catch {
      // Fallback to raw SQL
      await db.$executeRawUnsafe(
        `INSERT INTO Review (id, productId, storeId, customerName, customerEmail, rating, title, content, isVerified, isApproved, response, respondedAt, createdAt, updatedAt)
         VALUES (lower(hex(randomblob(8)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(4)) || '-' || hex(randomblob(8))), ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, datetime('now'), datetime('now'))`,
        productId, storeId, customerName, customerEmail || null,
        parseInt(String(rating)), title || null, content || null,
        isVerified ? 1 : 0
      );
      review = { productId, storeId, customerName, rating, isApproved: false };
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
