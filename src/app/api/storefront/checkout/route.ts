import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateOrderNumber } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId,
      items,
      customer,
      discountCode,
    } = body as {
      storeId: string;
      items: { productId: string; quantity: number }[];
      customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zip: string;
      };
      discountCode?: string;
    };

    // Validate required fields
    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 });
    }
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json({ error: 'Customer name, email, and phone are required' }, { status: 400 });
    }
    if (!customer?.address || !customer?.city) {
      return NextResponse.json({ error: 'Address and city are required' }, { status: 400 });
    }

    // Verify store exists and is active
    const store = await db.store.findFirst({
      where: { id: storeId, isActive: true },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch all products in the order
    const productIds = items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
        status: 'active',
      },
    });

    // Validate all products exist
    if (products.length !== items.length) {
      const foundIds = new Set(products.map((p) => p.id));
      const missing = items.filter((item) => !foundIds.has(item.productId));
      return NextResponse.json(
        { error: `Products not found: ${missing.map((m) => m.productId).join(', ')}` },
        { status: 400 }
      );
    }

    // Check stock and build order items
    const orderItems: { productId: string; name: string; price: number; quantity: number; total: number }[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.trackInventory && product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${product.name}". Available: ${product.stock}` },
          { status: 400 }
        );
      }
      const itemTotal = product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
      });
    }

    // Calculate subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    // Validate and apply discount code if provided
    let discountAmount = 0;
    let discountId: string | null = null;
    if (discountCode) {
      const discount = await db.discount.findFirst({
        where: {
          storeId: store.id,
          code: discountCode.toUpperCase(),
          isActive: true,
        },
      });

      if (!discount) {
        return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 });
      }

      // Check dates
      const now = new Date();
      if (discount.startsAt && now < discount.startsAt) {
        return NextResponse.json({ error: 'Discount code is not yet active' }, { status: 400 });
      }
      if (discount.endsAt && now > discount.endsAt) {
        return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 });
      }

      // Check usage limit
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        return NextResponse.json({ error: 'Discount code has reached its usage limit' }, { status: 400 });
      }

      // Check minimum order amount
      if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
        return NextResponse.json(
          { error: `Minimum order amount of ${store.currency === 'INR' ? '₹' : '$'}${discount.minOrderAmount} required for this discount` },
          { status: 400 }
        );
      }

      // Calculate discount
      if (discount.type === 'percentage') {
        discountAmount = subtotal * (discount.value / 100);
        if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
          discountAmount = discount.maxDiscount;
        }
      } else {
        // fixed_amount
        discountAmount = discount.value;
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
      }

      discountId = discount.id;
    }

    const total = Math.max(subtotal - discountAmount, 0);

    // Generate order number
    const orderNumber = generateOrderNumber();

    // Build shipping address
    const shippingAddress = [customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ');

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal,
        tax: 0,
        shipping: 0,
        discount: discountAmount,
        total,
        currency: store.currency,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress,
        notes: null,
        storeId: store.id,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Decrement product stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.trackInventory) {
        await db.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // Increment discount usage count
    if (discountId) {
      await db.discount.update({
        where: { id: discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Upsert customer
    try {
      const existingCustomer = await db.customer.findFirst({
        where: {
          storeId: store.id,
          email: customer.email,
        },
      });
      if (existingCustomer) {
        await db.customer.update({
          where: { id: existingCustomer.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
            name: customer.name,
            phone: customer.phone || existingCustomer.phone,
            address: customer.address || existingCustomer.address,
            city: customer.city || existingCustomer.city,
            state: customer.state || existingCustomer.state,
            zip: customer.zip || existingCustomer.zip,
          },
        });
      } else {
        await db.customer.create({
          data: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            totalOrders: 1,
            totalSpent: total,
            storeId: store.id,
          },
        });
      }
    } catch {
      // Customer creation is non-critical, don't fail the order
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        currency: order.currency,
        items: order.items,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
