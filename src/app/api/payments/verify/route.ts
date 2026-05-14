import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      storeId,
      orderId,
      customerDetails,
      cartItems,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 })
    }

    // ─── Signature Verification ─────────────────────────────────────────────
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature mismatch', { razorpay_order_id })
      return NextResponse.json({ error: 'Payment verification failed. Invalid signature.' }, { status: 400 })
    }

    // ─── Update Order in DB ─────────────────────────────────────────────────
    let updatedOrder
    if (orderId) {
      updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          paymentId: razorpay_payment_id,
          fulfillmentStatus: 'unfulfilled',
          notes: JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            paid_at: new Date().toISOString(),
          }),
        },
      })
    }

    // ─── Deduct Stock ───────────────────────────────────────────────────────
    if (cartItems && Array.isArray(cartItems)) {
      for (const item of cartItems) {
        await db.product.updateMany({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        }).catch(() => { /* non-blocking */ })
      }
    }

    if (storeId) {
      await logActivity({
        storeId,
        userId: customerDetails?.email || 'customer',
        action: 'Payment Received',
        details: `Razorpay payment ${razorpay_payment_id} verified for order ${razorpay_order_id}`,
      })
    }

    return NextResponse.json({
      success: true,
      paymentId: razorpay_payment_id,
      orderId: updatedOrder?.id || orderId,
      orderNumber: updatedOrder?.orderNumber,
      message: 'Payment verified successfully',
    })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
