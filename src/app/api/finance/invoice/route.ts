import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GST Invoice data generator (returns JSON for PDF rendering)
// Use this with @react-pdf/renderer on the frontend

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(date)
}

function calculateGST(amount: number, gstRate: number, isInterState: boolean) {
  const gstAmount = (amount * gstRate) / 100
  if (isInterState) {
    return { igst: gstAmount, cgst: 0, sgst: 0, total: gstAmount }
  }
  return { igst: 0, cgst: gstAmount / 2, sgst: gstAmount / 2, total: gstAmount }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 })
  }

  try {
    const user = await getCurrentUser()

    const order = await db.order.findFirst({
      where: { id: orderId },
      include: {
        store: {
          select: {
            id: true, name: true, email: true, phone: true, logo: true,
            address: true, city: true, state: true, country: true,
            settings: true,
          },
        },
        lineItems: {
          include: {
            product: {
              select: { name: true, hsnCode: true, gstRate: true, sku: true },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Authorization: merchant or superadmin
    if (user?.role !== 'superadmin') {
      const store = await db.store.findFirst({
        where: { id: order.storeId, ownerId: user?.id },
      })
      if (!store) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const storeSettings = order.store.settings as any || {}
    const gstin = storeSettings.gstin || null
    const shippingAddress = order.shippingAddress as any || {}
    const customerState = shippingAddress.state || ''
    const storeState = order.store.state || ''

    // Determine IGST vs CGST+SGST based on whether inter-state
    const isInterState = customerState !== storeState

    // Build line items with GST
    const lineItems = (order.lineItems || []).map((item: any) => {
      const product = item.product || {}
      const hsnCode = product.hsnCode || '9999'
      const gstRate = product.gstRate || 18
      const baseAmount = (item.price || 0) * (item.quantity || 1)
      const gst = calculateGST(baseAmount, gstRate, isInterState)

      return {
        productName: product.name || item.productId,
        sku: product.sku || '-',
        hsnCode,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        baseAmount,
        gstRate,
        igst: gst.igst,
        cgst: gst.cgst,
        sgst: gst.sgst,
        totalGst: gst.total,
        totalAmount: baseAmount + gst.total,
      }
    })

    const subtotal = lineItems.reduce((s: number, i: any) => s + i.baseAmount, 0)
    const totalIgst = lineItems.reduce((s: number, i: any) => s + i.igst, 0)
    const totalCgst = lineItems.reduce((s: number, i: any) => s + i.cgst, 0)
    const totalSgst = lineItems.reduce((s: number, i: any) => s + i.sgst, 0)
    const totalGst = totalIgst + totalCgst + totalSgst
    const grandTotal = subtotal + totalGst
    const discount = order.discountAmount || 0
    const finalTotal = Math.max(grandTotal - discount, 0)

    const invoiceData = {
      invoiceNumber: `INV-${order.orderNumber || order.id.slice(-8).toUpperCase()}`,
      invoiceDate: formatDate(order.createdAt),
      orderNumber: order.orderNumber,
      orderId: order.id,

      // Seller (store)
      seller: {
        name: order.store.name,
        gstin: gstin,
        address: order.store.address,
        city: order.store.city,
        state: order.store.state,
        country: order.store.country || 'India',
        email: order.store.email,
        phone: order.store.phone,
        logo: order.store.logo,
      },

      // Buyer (customer)
      buyer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: shippingAddress.phone || '',
        address: shippingAddress.address || '',
        city: shippingAddress.city || '',
        state: shippingAddress.state || '',
        pincode: shippingAddress.zip || '',
        country: shippingAddress.country || 'India',
      },

      lineItems,
      isInterState,
      subtotal,
      discount,
      totalIgst,
      totalCgst,
      totalSgst,
      totalGst,
      grandTotal: finalTotal,
      paymentMethod: order.paymentMethod || 'Online',
      paymentStatus: order.paymentStatus,
      paymentId: order.paymentId,
    }

    return NextResponse.json({ success: true, invoice: invoiceData })
  } catch (error: any) {
    console.error('GST invoice error:', error)
    return NextResponse.json({ error: 'Failed to generate invoice data' }, { status: 500 })
  }
}
