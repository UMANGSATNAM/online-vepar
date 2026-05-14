import Razorpay from 'razorpay'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

let razorpay: any = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export async function POST(request: Request) {
  try {
    const { storeId, amount, currency = 'INR', receipt, notes } = await request.json()

    if (!storeId || !amount) {
      return NextResponse.json({ error: 'Missing storeId or amount' }, { status: 400 })
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway not configured. Contact store owner.' }, { status: 503 })
    }

    // Verify store exists
    const store = await db.store.findFirst({ where: { id: storeId } })
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Create Razorpay order — amount in paise (multiply by 100)
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
      payment_capture: true,
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json({ error: error?.error?.description || 'Payment order creation failed' }, { status: 500 })
  }
}
