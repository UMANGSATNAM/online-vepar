import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'

export async function POST(request: Request) {
  try {
    const {
      storeId,
      orderId,
      paymentMethod = 'cod',
      customerDetails,
      cartItems,
      amount,
      notes,
    } = await request.json()

    if (!storeId || !orderId) {
      return NextResponse.json({ error: 'Missing storeId or orderId' }, { status: 400 })
    }

    // Verify the store has COD enabled
    const store = await db.store.findFirst({
      where: { id: storeId },
      select: { id: true, name: true, settings: true },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Check if COD is enabled for this store (default: enabled)
    const storeSettings = store.settings as any || {}
    if (storeSettings.codEnabled === false) {
      return NextResponse.json({ error: 'Cash on Delivery is not available for this store' }, { status: 400 })
    }

    // Update order to COD pending
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        fulfillmentStatus: 'unfulfilled',
        notes: JSON.stringify({
          payment_method: 'cod',
          cod_amount: amount,
          cod_notes: notes || 'Cash on Delivery — collect at delivery',
          created_at: new Date().toISOString(),
        }),
      },
    })

    // Deduct stock
    if (cartItems && Array.isArray(cartItems)) {
      for (const item of cartItems) {
        await db.product.updateMany({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => { /* non-blocking */ })
      }
    }

    await logActivity({
      storeId,
      userId: customerDetails?.email || 'customer',
      action: 'COD Order Placed',
      details: `COD order #${updatedOrder.orderNumber} confirmed. Amount: ₹${amount}`,
    })

    return NextResponse.json({
      success: true,
      paymentMethod: 'cod',
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      message: 'Order placed successfully! Pay on delivery.',
    })
  } catch (error: any) {
    console.error('COD order error:', error)
    return NextResponse.json({ error: 'Failed to confirm COD order' }, { status: 500 })
  }
}
