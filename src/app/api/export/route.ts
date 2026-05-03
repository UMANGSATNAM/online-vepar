import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const type = searchParams.get('type'); // products | orders | customers

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    if (!type || !['products', 'orders', 'customers'].includes(type)) {
      return NextResponse.json({ error: 'type must be products, orders, or customers' }, { status: 400 });
    }

    // Verify the store belongs to the user
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    let csvContent = '';
    let filename = '';

    if (type === 'products') {
      const products = await db.product.findMany({
        where: { storeId },
        include: { categoryRef: true },
        orderBy: { createdAt: 'desc' },
      });

      const headers = ['Name', 'SKU', 'Price', 'Compare Price', 'Cost', 'Category', 'Stock', 'Status', 'Featured'];
      csvContent = headers.join(',') + '\n';

      for (const p of products) {
        const row = [
          escapeCSV(p.name),
          escapeCSV(p.sku),
          escapeCSV(p.price),
          escapeCSV(p.comparePrice),
          escapeCSV(p.cost),
          escapeCSV(p.categoryRef?.name || p.category),
          escapeCSV(p.stock),
          escapeCSV(p.status),
          escapeCSV(p.featured ? 'Yes' : 'No'),
        ];
        csvContent += row.join(',') + '\n';
      }

      filename = `products-${store.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'orders') {
      const orders = await db.order.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
      });

      const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Total', 'Status', 'Payment Status', 'Fulfillment Status', 'Date'];
      csvContent = headers.join(',') + '\n';

      for (const o of orders) {
        const row = [
          escapeCSV(o.orderNumber),
          escapeCSV(o.customerName),
          escapeCSV(o.customerEmail),
          escapeCSV(o.total),
          escapeCSV(o.status),
          escapeCSV(o.paymentStatus),
          escapeCSV(o.fulfillmentStatus),
          escapeCSV(new Date(o.createdAt).toISOString().split('T')[0]),
        ];
        csvContent += row.join(',') + '\n';
      }

      filename = `orders-${store.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'customers') {
      const customers = await db.customer.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
      });

      const headers = ['Name', 'Email', 'Phone', 'City', 'State', 'Total Orders', 'Total Spent', 'Created Date'];
      csvContent = headers.join(',') + '\n';

      for (const c of customers) {
        const row = [
          escapeCSV(c.name),
          escapeCSV(c.email),
          escapeCSV(c.phone),
          escapeCSV(c.city),
          escapeCSV(c.state),
          escapeCSV(c.totalOrders),
          escapeCSV(c.totalSpent),
          escapeCSV(new Date(c.createdAt).toISOString().split('T')[0]),
        ];
        csvContent += row.join(',') + '\n';
      }

      filename = `customers-${store.slug}-${new Date().toISOString().split('T')[0]}.csv`;
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
