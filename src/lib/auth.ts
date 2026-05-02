import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';

// Simple hash function for passwords
export function hashPassword(password: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ov_salt_2024');
  // Simple hash using basic algorithm
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36) + '_' + Buffer.from(password + 'ov_salt_2024').toString('base64');
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Get current user from cookie or X-User-Id header (fallback for sandbox environments)
export async function getCurrentUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    // Try cookie first
    const cookieStore = await cookies();
    const session = cookieStore.get('ov_session');
    
    let userId = session?.value;
    
    // Fallback: check X-User-Id header (for sandbox environments where cookies may not work)
    if (!userId) {
      const headersList = await headers();
      userId = headersList.get('x-user-id') || undefined;
    }
    
    if (!userId) return null;
    
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });
    
    return user;
  } catch {
    return null;
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
