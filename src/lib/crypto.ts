import crypto from 'crypto';

// Use a 256-bit (32 bytes) key derived from NEXTAUTH_SECRET or explicitly set
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY, 'hex') 
  : crypto.createHash('sha256').update(process.env.NEXTAUTH_SECRET || 'default-insecure-key').digest();

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts a string (e.g. Bank Account Number, API Key) using AES-256-GCM
 * Returns a string formatted as iv:authTag:encryptedData
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts a string previously encrypted with the encrypt() function
 */
export function decrypt(hash: string): string {
  try {
    const parts = hash.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Utility to log to the mandatory CERT-In Audit Log
 */
export async function logCertInAudit({
  action,
  ipAddress,
  userAgent,
  storeId,
  userId,
  details,
  severity = 'info'
}: {
  action: string;
  ipAddress: string;
  userAgent?: string;
  storeId?: string;
  userId?: string;
  details?: Record<string, any>;
  severity?: 'info' | 'warning' | 'critical';
}) {
  try {
    const { db } = await import('./db');
    await db.certInAuditLog.create({
      data: {
        action,
        ipAddress,
        userAgent: userAgent || 'Unknown',
        storeId,
        userId,
        severity,
        details: details ? JSON.stringify(details) : null,
      }
    });
  } catch (error) {
    console.error('Failed to write to CERT-In audit log:', error);
    // In strict environments, failure to audit-log should block the action.
  }
}
