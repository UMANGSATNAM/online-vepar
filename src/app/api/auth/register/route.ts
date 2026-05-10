import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, generateSlug } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, phone, legalName, role } = body;

    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: 'Email, password, phone, and name are required' }, { status: 400 });
    }

    // Strong password enforcement (min 12 chars, upper + lower + number + symbol)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!strongPasswordRegex.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 12 characters and include an uppercase letter, lowercase letter, number, and special symbol.' }, { status: 400 });
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email or phone already exists' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);
    const assignedRole = role === 'superadmin' ? 'superadmin' : 'owner';

    const user = await db.user.create({
      data: { 
        email, 
        password: hashedPassword, 
        name, 
        phone,
        phoneVerified: false,
        emailVerified: false,
        role: assignedRole 
      },
      select: { id: true, email: true, name: true, phone: true, role: true, avatar: true, createdAt: true },
    });

    const storeSlug = generateSlug(`${name}'s Store ${Math.floor(Math.random() * 10000)}`);
    const store = await db.store.create({
      data: {
        name: `${name}'s Store`,
        legalName: legalName || null,
        slug: storeSlug,
        description: `Welcome to ${name}'s online store!`,
        theme: 'modern',
        primaryColor: '#10b981',
        currency: 'INR',
        isActive: true,
        kycStatus: 'pending',
        ownerId: user.id,
      },
    });

    const response = NextResponse.json({ user, stores: [store], message: 'Registration successful' }, { status: 201 });
    response.cookies.set('ov_session', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
