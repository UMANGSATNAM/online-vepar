import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const q = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // Verify the store belongs to the user
    const store = await db.store.findFirst({
      where: { id: storeId, ownerId: user.id },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const searchQuery = q.trim();
    if (!searchQuery) {
      return NextResponse.json({ products: [], orders: [], customers: [] });
    }

    // Search Products: by name, sku, description
    const products = await db.product.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: searchQuery } },
          { sku: { contains: searchQuery } },
          { description: { contains: searchQuery } },
        ],
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        sku: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    // Search Orders: by orderNumber, customerName, customerEmail
    const orders = await db.order.findMany({
      where: {
        storeId,
        OR: [
          { orderNumber: { contains: searchQuery } },
          { customerName: { contains: searchQuery } },
          { customerEmail: { contains: searchQuery } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Search Customers: by name, email, phone
    const customers = await db.customer.findMany({
      where: {
        storeId,
        OR: [
          { name: { contains: searchQuery } },
          { email: { contains: searchQuery } },
          { phone: { contains: searchQuery } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        totalOrders: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ products, orders, customers });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
