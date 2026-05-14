import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/app/api/rate-limit/route'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  // ─── Rate Limit: 5 login attempts per 15 minutes ─────────────────────────
  const limit = await rateLimit(request, { limit: 5, windowMs: 15 * 60 * 1000 })
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': limit.reset.toString(),
          'Retry-After': '900',
        },
      }
    )
  }

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase()

    const user = await db.user.findUnique({
      where: { email: sanitizedEmail },
      include: {
        stores: {
          select: {
            id: true, name: true, slug: true, logo: true, primaryColor: true,
            description: true, currency: true, isActive: true, theme: true,
          },
        },
      },
    })

    if (!user) {
      // Use consistent error to prevent user enumeration
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.password) {
      return NextResponse.json({ error: 'Account requires social login. Use Google sign-in.' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'dev-secret-change-in-production',
      { expiresIn: '7d' }
    )

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      stores: user.stores,
    })

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
  }
}
