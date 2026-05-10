import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyStoreAccess } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const dateRange = searchParams.get('dateRange') || '30d'; // 7d, 30d, 90d, all
    
    if (!storeId) return NextResponse.json({ error: 'storeId required' }, { status: 400 });

    const { authorized } = await verifyStoreAccess(storeId, user.id, 'analytics');
    if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Determine date range
    let startDate = new Date(0); // Epoch
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // 1. Fetch Orders (Revenue & COGS)
    // We only count paid orders towards revenue
    const orders = await db.order.findMany({
      where: {
        storeId,
        paymentStatus: 'paid',
        status: { notIn: ['cancelled', 'refunded'] },
        createdAt: { gte: startDate }
      },
      include: {
        items: {
          include: { product: { select: { cost: true } } }
        }
      }
    });

    let totalRevenue = 0;
    let totalShippingCollected = 0;
    let totalTaxCollected = 0;
    let totalCOGS = 0; // Cost of Goods Sold

    orders.forEach(order => {
      totalRevenue += order.total;
      totalShippingCollected += order.shipping;
      totalTaxCollected += order.tax;

      order.items.forEach(item => {
        // If product has a cost defined, multiply by quantity
        if (item.product?.cost) {
          totalCOGS += item.product.cost * item.quantity;
        }
      });
    });

    // 2. Fetch Expenses (Marketing, Shipping Paid, etc.)
    const expenses = await db.expense.findMany({
      where: {
        storeId,
        date: { gte: startDate }
      }
    });

    let totalMarketing = 0;
    let totalShippingPaid = 0; // Cost of shipping labels
    let totalMiscExpenses = 0;

    expenses.forEach(exp => {
      if (exp.category === 'marketing') totalMarketing += exp.amount;
      else if (exp.category === 'shipping') totalShippingPaid += exp.amount;
      else totalMiscExpenses += exp.amount;
    });

    // 3. Calculate Master Hisab (P&L)
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = totalMarketing + totalShippingPaid + totalMiscExpenses;
    const netProfit = grossProfit - totalExpenses;
    const roi = totalExpenses > 0 ? ((netProfit / totalExpenses) * 100).toFixed(2) : '100.00';
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00';

    return NextResponse.json({
      overview: {
        totalRevenue,
        totalShippingCollected,
        totalTaxCollected,
        totalCOGS,
        expenses: {
          marketing: totalMarketing,
          shippingPaid: totalShippingPaid,
          misc: totalMiscExpenses,
          total: totalExpenses
        },
        profitability: {
          grossProfit,
          netProfit,
          margin: parseFloat(margin),
          roi: parseFloat(roi)
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
