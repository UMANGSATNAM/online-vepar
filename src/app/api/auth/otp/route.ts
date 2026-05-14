import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// ─── OTP Store (in-memory for dev, Redis in production) ──────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number; attempts: number }>()

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendSMS(phone: string, otp: string): Promise<boolean> {
  const formattedPhone = phone.replace(/\D/g, '')
  const e164Phone = formattedPhone.startsWith('91') ? `+${formattedPhone}` : `+91${formattedPhone}`

  // ─── MSG91 (recommended for India) ─────────────────────────────────────
  if (process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID) {
    try {
      const res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: process.env.MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: e164Phone.replace('+', ''),
          otp,
        }),
      })
      const data = await res.json()
      return data.type === 'success'
    } catch (err) {
      console.error('MSG91 error:', err)
    }
  }

  // ─── Twilio Fallback ─────────────────────────────────────────────────────
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE) {
    try {
      const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: e164Phone,
            From: process.env.TWILIO_PHONE,
            Body: `Your Online Vepar OTP is: ${otp}. Valid for 10 minutes. Do not share.`,
          }).toString(),
        }
      )
      const data = await res.json()
      return !!data.sid
    } catch (err) {
      console.error('Twilio error:', err)
    }
  }

  // Dev mode: log OTP
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV MODE] OTP for ${phone}: ${otp}\n`)
    return true
  }

  return false
}

// ─── SEND OTP ────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'send'

  if (action === 'send') {
    const { phone } = await request.json()

    if (!phone || !/^\d{10}$/.test(phone.replace(/\D/g, '').slice(-10))) {
      return NextResponse.json({ error: 'Invalid phone number. Enter 10-digit mobile number.' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)

    // Rate limiting: 1 OTP per 60 seconds
    const existing = otpStore.get(cleanPhone)
    if (existing && existing.expiresAt - 9 * 60 * 1000 > Date.now()) {
      return NextResponse.json({ error: 'OTP already sent. Please wait before requesting again.' }, { status: 429 })
    }

    const otp = generateOTP()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

    otpStore.set(cleanPhone, { otp, expiresAt, attempts: 0 })

    const sent = await sendSMS(cleanPhone, otp)

    if (!sent && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Failed to send OTP. Check SMS configuration.' }, { status: 503 })
    }

    return NextResponse.json({
      success: true,
      message: sent ? `OTP sent to +91 ${cleanPhone.slice(0, 2)}XXXXXX${cleanPhone.slice(-2)}` : `[DEV] OTP: ${otp}`,
      dev: process.env.NODE_ENV !== 'production' ? otp : undefined,
    })
  }

  if (action === 'verify') {
    const { phone, otp } = await request.json()

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const stored = otpStore.get(cleanPhone)

    if (!stored) {
      return NextResponse.json({ error: 'OTP expired or not found. Request a new OTP.' }, { status: 400 })
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanPhone)
      return NextResponse.json({ error: 'OTP has expired. Request a new one.' }, { status: 400 })
    }

    if (stored.attempts >= 3) {
      otpStore.delete(cleanPhone)
      return NextResponse.json({ error: 'Too many incorrect attempts. Request a new OTP.' }, { status: 429 })
    }

    if (stored.otp !== otp.toString()) {
      stored.attempts++
      return NextResponse.json({ error: `Incorrect OTP. ${3 - stored.attempts} attempts remaining.` }, { status: 400 })
    }

    otpStore.delete(cleanPhone)

    // Find or create user by phone
    let user = await db.user.findFirst({ where: { phone: cleanPhone } })
    if (!user) {
      user = await db.user.create({
        data: {
          phone: cleanPhone,
          name: `User ${cleanPhone.slice(-4)}`,
          email: `${cleanPhone}@phone.onlineverpar.com`,
          role: 'merchant',
        },
      })
    }

    return NextResponse.json({
      success: true,
      verified: true,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
      message: 'Phone number verified successfully',
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
