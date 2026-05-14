import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity-logger'

// ─── WhatsApp Business API (Meta WABA) ──────────────────────────────────────
// Template messages for order notifications

const WA_API_URL = 'https://graph.facebook.com/v19.0'

interface WaTextPayload {
  messaging_product: 'whatsapp'
  to: string
  type: 'template'
  template: {
    name: string
    language: { code: string }
    components?: Array<{
      type: string
      parameters: Array<{ type: string; text?: string; currency?: any }>
    }>
  }
}

async function sendWhatsAppMessage(to: string, payload: WaTextPayload): Promise<boolean> {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('WhatsApp not configured — WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing')
    return false
  }

  const phone = to.replace(/\D/g, '')
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`

  try {
    const res = await fetch(
      `${WA_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, to: formattedPhone }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      console.error('WhatsApp send failed:', data)
      return false
    }
    return true
  } catch (err) {
    console.error('WhatsApp API error:', err)
    return false
  }
}

// ─── Notification Types ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { type, orderId, storeId, phone, customerName, orderNumber, amount, items } = await request.json()

    if (!type || !orderId) {
      return NextResponse.json({ error: 'Missing type or orderId' }, { status: 400 })
    }

    const order = await db.order.findFirst({
      where: { id: orderId },
      include: { store: { select: { name: true, phone: true } } },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const customerPhone = phone || (order.shippingAddress as any)?.phone
    if (!customerPhone) {
      return NextResponse.json({ error: 'No phone number available for this order' }, { status: 400 })
    }

    let sent = false
    const storeName = order.store?.name || 'Online Vepar Store'

    // ─── ORDER CONFIRMED ─────────────────────────────────────────────────────
    if (type === 'order_confirmed') {
      const payload: WaTextPayload = {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'template',
        template: {
          name: 'order_confirmation',
          language: { code: 'en_IN' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName || order.customerName || 'Customer' },
                { type: 'text', text: order.orderNumber?.toString() || orderId.slice(-6) },
                { type: 'text', text: `₹${amount || order.totalAmount}` },
                { type: 'text', text: storeName },
              ],
            },
          ],
        },
      }
      sent = await sendWhatsAppMessage(customerPhone, payload)
    }

    // ─── ORDER SHIPPED ────────────────────────────────────────────────────────
    else if (type === 'order_shipped') {
      const trackingInfo = (order as any).trackingNumber || 'Track via our website'
      const payload: WaTextPayload = {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'template',
        template: {
          name: 'order_shipped',
          language: { code: 'en_IN' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName || order.customerName || 'Customer' },
                { type: 'text', text: order.orderNumber?.toString() || orderId.slice(-6) },
                { type: 'text', text: trackingInfo },
              ],
            },
          ],
        },
      }
      sent = await sendWhatsAppMessage(customerPhone, payload)
    }

    // ─── COD REMINDER ────────────────────────────────────────────────────────
    else if (type === 'cod_reminder') {
      const payload: WaTextPayload = {
        messaging_product: 'whatsapp',
        to: customerPhone,
        type: 'template',
        template: {
          name: 'cod_reminder',
          language: { code: 'en_IN' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: customerName || 'Customer' },
                { type: 'text', text: `₹${amount || order.totalAmount}` },
                { type: 'text', text: storeName },
              ],
            },
          ],
        },
      }
      sent = await sendWhatsAppMessage(customerPhone, payload)
    }

    // Log notification attempt
    if (storeId) {
      await logActivity({
        storeId,
        userId: 'system',
        action: 'WhatsApp Notification',
        details: `${type} notification ${sent ? 'sent' : 'failed'} to ${customerPhone.slice(-4).padStart(customerPhone.length, '*')}`,
      })
    }

    return NextResponse.json({
      success: true,
      sent,
      message: sent
        ? 'WhatsApp notification sent successfully'
        : 'WhatsApp not configured — notification logged only',
    })
  } catch (error: any) {
    console.error('WhatsApp notification error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}

// ─── WhatsApp Webhook Verification ──────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}
