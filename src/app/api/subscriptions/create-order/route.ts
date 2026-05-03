import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'

// POST /api/subscriptions/create-order
// Creates a Razorpay order for a subscription plan
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId, storeId } = await request.json()

  const plan = await db.subscriptionPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 })

  const store = await db.store.findFirst({ where: { id: storeId, ownerId: user.id } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID
  const razorpaySecret = process.env.RAZORPAY_SECRET

  if (!razorpayKeyId || !razorpaySecret) {
    return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 })
  }

  // Create Razorpay order
  const auth = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64')
  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: Math.round(plan.price * 100), // paise
      currency: plan.currency || 'INR',
      receipt: `sub_${storeId}_${Date.now()}`,
      notes: { storeId, planId, userId: user.id },
    }),
  })

  if (!orderRes.ok) {
    const err = await orderRes.json()
    return NextResponse.json({ error: 'Failed to create payment order', details: err }, { status: 500 })
  }

  const order = await orderRes.json()

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId,
    storeName: store.name,
    planName: plan.name,
    userEmail: user.email,
  })
}
