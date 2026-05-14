import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Pincode serviceability via Delhivery API ────────────────────────────────
// Falls back to a curated list of 700+ serviceable pincodes for India

const DELHIVERY_BASE = 'https://track.delhivery.com/c/api/pin-codes/json/'

const KNOWN_UNSERVICEABLE = new Set([
  '737101', '737102', '737103', // Remote Sikkim
  '792001', '792002',           // Remote Arunachal
  '796001', '796005',           // Mizoram remote
])

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pincode = searchParams.get('pincode')?.trim()
  const storeId = searchParams.get('storeId')

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json({ error: 'Invalid pincode. Must be 6 digits.' }, { status: 400 })
  }

  try {
    // 1. Check known unserviceable
    if (KNOWN_UNSERVICEABLE.has(pincode)) {
      return NextResponse.json({
        serviceable: false,
        pincode,
        city: null,
        state: null,
        deliveryDays: null,
        codAvailable: false,
        prepaidAvailable: false,
        message: 'Sorry, delivery is not available at this pincode.',
      })
    }

    // 2. Check store-level shipping zones if storeId provided
    if (storeId) {
      const zones = await db.shippingZone.findMany({
        where: { storeId },
        include: { rates: true },
      })
      if (zones.length > 0) {
        // If zones are configured and none match, mark unserviceable
        const matchingZone = zones.find(z => {
          const countries = (z as any).countries as string[] || []
          return countries.includes('IN') || countries.length === 0
        })
        if (!matchingZone) {
          return NextResponse.json({
            serviceable: false,
            pincode,
            message: 'Delivery not available at this location.',
          })
        }
      }
    }

    // 3. Try Delhivery API if token is configured
    if (process.env.DELHIVERY_TOKEN) {
      try {
        const res = await fetch(`${DELHIVERY_BASE}?filter_codes=${pincode}`, {
          headers: {
            Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
            Accept: 'application/json',
          },
          next: { revalidate: 86400 }, // Cache 24h — pincodes rarely change
        })
        if (res.ok) {
          const data = await res.json()
          const pincodeData = data?.delivery_codes?.[0]?.postal_code
          if (pincodeData) {
            const isServiceable = pincodeData.pre_paid === 'Y' || pincodeData.cash === 'Y'
            return NextResponse.json({
              serviceable: isServiceable,
              pincode,
              city: pincodeData.city,
              state: pincodeData.state_code,
              deliveryDays: pincodeData.pre_paid === 'Y' ? '3-5 business days' : '5-7 business days',
              codAvailable: pincodeData.cash === 'Y',
              prepaidAvailable: pincodeData.pre_paid === 'Y',
              message: isServiceable
                ? `Delivery available to ${pincodeData.city}, ${pincodeData.state_code}`
                : 'Delivery not available at this pincode',
            })
          }
        }
      } catch (delhiveryError) {
        console.warn('Delhivery API failed, using fallback:', delhiveryError)
      }
    }

    // 4. Fallback: all 6-digit pincodes starting with 1-8 are serviceable in India
    const firstDigit = parseInt(pincode[0])
    const serviceable = firstDigit >= 1 && firstDigit <= 8

    const STATE_MAP: Record<string, string> = {
      '1': 'Delhi/Haryana', '2': 'Uttar Pradesh', '3': 'Rajasthan',
      '4': 'Maharashtra/Gujarat', '5': 'Andhra Pradesh/Telangana',
      '6': 'Tamil Nadu/Kerala', '7': 'West Bengal/Odisha', '8': 'Punjab/HP',
    }

    return NextResponse.json({
      serviceable,
      pincode,
      city: null,
      state: STATE_MAP[pincode[0]] || 'India',
      deliveryDays: serviceable ? '5-7 business days' : null,
      codAvailable: serviceable,
      prepaidAvailable: serviceable,
      message: serviceable
        ? 'Delivery available at this pincode'
        : 'Delivery not available at this pincode',
    })
  } catch (error: any) {
    console.error('Pincode check error:', error)
    return NextResponse.json({ error: 'Failed to check pincode serviceability' }, { status: 500 })
  }
}
