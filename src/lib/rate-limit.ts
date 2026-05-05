// ============================================================
// RATE LIMITER - In-memory rate limiting for API routes
// ============================================================
// Uses a sliding window approach with automatic cleanup.
// For Vercel serverless, this resets on each cold start,
// but still provides effective protection against rapid abuse.

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on serverless cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Key prefix for grouping (e.g., 'login', 'tmdb') */
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfterMs?: number;
}

// Pre-configured rate limits
export const RATE_LIMITS = {
  /** Login attempts: 5 per 15 minutes per IP */
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5, keyPrefix: 'login' } as RateLimitConfig,
  /** TMDB API calls: 30 per minute per user */
  TMDB: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'tmdb' } as RateLimitConfig,
  /** Admin write operations: 60 per minute per user */
  ADMIN_WRITE: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'admin-write' } as RateLimitConfig,
  /** General API: 100 per minute per IP */
  GENERAL: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'general' } as RateLimitConfig,
} as const;

/**
 * Check if a request should be rate limited.
 * @param identifier - IP address or user identifier
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and remaining count
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  cleanupStore();

  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has expired, start fresh
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  // Increment counter
  entry.count++;

  if (entry.count > config.maxRequests) {
    const retryAfterMs = entry.resetTime - now;
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfterMs,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request | import('next/server').NextRequest): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

/**
 * Create a rate limit error response with proper headers.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
      retryAfter: Math.ceil((result.retryAfterMs || 60000) / 1000),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil((result.retryAfterMs || 60000) / 1000)),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
      },
    }
  );
}
