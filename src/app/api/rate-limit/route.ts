import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

// ─── Rate Limiting Middleware Logic ──────────────────────────────────────────
// Uses in-memory store when Redis is not configured (dev mode)
// Switches to Redis-backed via @upstash/ratelimit in production

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory fallback (for dev or no-Redis envs)
const inMemoryStore = new Map<string, RateLimitEntry>()

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function rateLimit(
  request: NextRequest,
  options: { limit: number; windowMs: number }
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const ip = getClientIp(request)
  const key = `rl:${ip}:${request.nextUrl.pathname}`
  const now = Date.now()

  // Try Upstash Redis first
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')

      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })

      const limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs}ms`),
        prefix: 'omni:rl',
      })

      const result = await limiter.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch (err) {
      console.warn('Upstash rate limit failed, using in-memory fallback:', err)
    }
  }

  // In-memory fallback
  const entry = inMemoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + options.windowMs })
    return { success: true, remaining: options.limit - 1, reset: now + options.windowMs }
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, reset: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: options.limit - entry.count, reset: entry.resetAt }
}

// ─── Route Handler for Auth Rate Limiting Status ────────────────────────────
export async function GET() {
  return NextResponse.json({
    rateLimiting: 'active',
    provider: process.env.UPSTASH_REDIS_REST_URL ? 'upstash-redis' : 'in-memory',
  })
}
