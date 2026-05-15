import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';

import * as jwt from 'jsonwebtoken';

// Get current user from cookie or Authorization header
export async function getCurrentUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    let token: string | undefined;

    // Try cookie first
    const cookieStore = await cookies();
    const session = cookieStore.get('auth-token');
    
    if (session?.value) {
      token = session.value;
    }
    
    // Fallback: check Authorization header
    if (!token) {
      const headersList = await headers();
      const authHeader = headersList.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) return null;
    
    // Verify JWT
    const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string };
    
    if (!decoded || !decoded.userId) return null;

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });
    
    return user;
  } catch (err) {
    console.error('getCurrentUser Error:', err);
    return null;
  }
}

// Check if user has access to a store, either as Owner or Staff with specific permission
export async function verifyStoreAccess(storeId: string, userId: string, requiredPermission?: string): Promise<{ authorized: boolean; store?: any; error?: string }> {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return { authorized: false, error: 'User not found' };

    const store = await db.store.findUnique({
      where: { id: storeId }
    });

    if (!store) return { authorized: false, error: 'Store not found' };

    // Owner has full access
    if (store.ownerId === userId) {
      return { authorized: true, store };
    }

    // Check staff access
    const staff = await db.staff.findFirst({
      where: { storeId, email: user.email, status: 'active' }
    });

    if (!staff) {
      return { authorized: false, error: 'Unauthorized access to this store' };
    }

    if (requiredPermission) {
      try {
        const perms = JSON.parse(staff.permissions);
        if (!perms[requiredPermission] && staff.role !== 'admin') {
          return { authorized: false, error: 'Missing required permissions' };
        }
      } catch {
        return { authorized: false, error: 'Invalid permissions format' };
      }
    }

    return { authorized: true, store };
  } catch (err) {
    return { authorized: false, error: 'Internal auth error' };
  }
}


// Generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Generate order number
export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `OV-${dateStr}-${random}`;
}
