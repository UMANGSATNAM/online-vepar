import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateSlug } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'owner',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Auto-create a default store for the user
    const storeSlug = generateSlug(`${name}'s Store`);
    const store = await db.store.create({
      data: {
        name: `${name}'s Store`,
        slug: storeSlug,
        description: `Welcome to ${name}'s online store on Online Vepar!`,
        theme: 'modern',
        primaryColor: '#10b981',
        currency: 'INR',
        isActive: true,
        ownerId: user.id,
      },
    });

    const stores = [store];

    // Set session cookie
    const response = NextResponse.json(
      { user, stores, message: 'Registration successful' },
      { status: 201 }
    );

    response.cookies.set('ov_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
