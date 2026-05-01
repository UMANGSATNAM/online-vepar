import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/notification-preferences?storeId=xxx
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get or create preferences
    let preferences = await db.notificationPreference.findUnique({
      where: { storeId },
    });

    if (!preferences) {
      preferences = await db.notificationPreference.create({
        data: { storeId },
      });
    }

    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notification-preferences
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId,
      newOrderEmail,
      orderStatusEmail,
      paymentReceivedEmail,
      lowStockEmail,
      lowStockThreshold,
      reviewEmail,
      abandonedCartEmail,
      abandonedCartReminderDelay,
      weeklyReportEmail,
      monthlyReportEmail,
      newsletterEmail,
      reportEmail,
    } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // Verify ownership
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (newOrderEmail !== undefined) updateData.newOrderEmail = newOrderEmail;
    if (orderStatusEmail !== undefined) updateData.orderStatusEmail = orderStatusEmail;
    if (paymentReceivedEmail !== undefined) updateData.paymentReceivedEmail = paymentReceivedEmail;
    if (lowStockEmail !== undefined) updateData.lowStockEmail = lowStockEmail;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
    if (reviewEmail !== undefined) updateData.reviewEmail = reviewEmail;
    if (abandonedCartEmail !== undefined) updateData.abandonedCartEmail = abandonedCartEmail;
    if (abandonedCartReminderDelay !== undefined) updateData.abandonedCartReminderDelay = abandonedCartReminderDelay;
    if (weeklyReportEmail !== undefined) updateData.weeklyReportEmail = weeklyReportEmail;
    if (monthlyReportEmail !== undefined) updateData.monthlyReportEmail = monthlyReportEmail;
    if (newsletterEmail !== undefined) updateData.newsletterEmail = newsletterEmail;
    if (reportEmail !== undefined) updateData.reportEmail = reportEmail;

    // Upsert preferences
    const preferences = await db.notificationPreference.upsert({
      where: { storeId },
      update: updateData,
      create: {
        storeId,
        ...updateData,
      },
    });

    return NextResponse.json({ preferences }, { status: 200 });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
