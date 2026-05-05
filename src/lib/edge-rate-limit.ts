// ============================================================
// EDGE-RUNTIME COMPATIBLE RATE LIMITER
// Used by middleware.ts which runs in Edge Runtime.
// Uses in-memory Map (resets on cold start, but still effective).
// ============================================================

interface EdgeRateEntry {
  count: number;
  resetTime: number;
}

// In-memory store for Edge Runtime rate limiting
// Note: In Vercel serverless, this resets on each cold start,
// but still provides effective protection against rapid abuse.
const edgeRateStore = new Map<string, EdgeRateEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastEdgeCleanup = Date.now();

function cleanupEdgeStore() {
  const now = Date.now();
  if (now - lastEdgeCleanup < CLEANUP_INTERVAL) return;
  lastEdgeCleanup = now;

  for (const [key, entry] of edgeRateStore) {
    if (now > entry.resetTime) {
      edgeRateStore.delete(key);
    }
  }
}

export interface EdgeRateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum number of requests in the window */
  maxRequests: number;
  /** Key prefix for grouping */
  keyPrefix: string;
}

// Pre-configured rate limits for public routes
export const EDGE_RATE_LIMITS = {
  /** Public API (movies, series, genres): 60 per minute per IP */
  PUBLIC_API: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'pub-api' } as EdgeRateLimitConfig,
  /** Search API: 20 per minute per IP (searches are expensive) */
  SEARCH_API: { windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'search' } as EdgeRateLimitConfig,
  /** Login: 5 per 15 minutes per IP */
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 5, keyPrefix: 'login' } as EdgeRateLimitConfig,
  /** Global per-IP limit: 120 per minute */
  GLOBAL: { windowMs: 60 * 1000, maxRequests: 120, keyPrefix: 'global' } as EdgeRateLimitConfig,
} as const;

/**
 * Check if a request should be rate limited (Edge Runtime compatible).
 * @param identifier - IP address or identifier
 * @param config - Rate limit configuration
 * @returns true if rate limited (should block), false if allowed
 */
export function isEdgeRateLimited(identifier: string, config: EdgeRateLimitConfig): boolean {
  cleanupEdgeStore();

  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const entry = edgeRateStore.get(key);

  // If no entry or window has expired, start fresh
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs;
    edgeRateStore.set(key, { count: 1, resetTime });
    return false; // Not rate limited
  }

  // Increment counter
  entry.count++;

  if (entry.count > config.maxRequests) {
    return true; // Rate limited
  }

  return false; // Not rate limited
}

/**
 * Get client IP from request headers (Edge Runtime compatible).
 */
export function getEdgeClientIp(request: import('next/server').NextRequest): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
