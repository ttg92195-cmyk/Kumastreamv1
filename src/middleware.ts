import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthValid } from '@/lib/edge-auth';
import { isEdgeRateLimited, getEdgeClientIp, EDGE_RATE_LIMITS } from '@/lib/edge-rate-limit';

// ============================================================
// MIDDLEWARE - Route-level protection, rate limiting, and
// DDoS/abuse protection for all routes.
// Uses Edge-compatible auth check (Web Crypto API) and rate limiter.
// ============================================================

// Admin API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/admin/',
  '/api/tmdb/',
  '/api/health',
  '/api/setup-db',
];

// Admin write API routes that need extra protection
const ADMIN_WRITE_ROUTES = [
  '/api/movies/',  // PUT, DELETE methods need auth (checked in route handler)
  '/api/series/',  // PUT, DELETE methods need auth (checked in route handler)
  '/api/episodes/', // PUT, DELETE methods need auth (checked in route handler)
];

// Admin pages that should redirect to login if not authenticated
const ADMIN_PAGES = [
  '/admin/dashboard',
  '/admin/edit/',
  '/admin/tmdb',
];

// Search API routes (expensive, need stricter rate limiting)
const SEARCH_API_ROUTES = [
  '/api/movies?',   // When used with search param
  '/api/series?',   // When used with search param
  '/api/tmdb/search',
];

// Known bad bots / scrapers to block
const BLOCKED_USER_AGENTS = [
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'exabot',
  'megaindex',
  'majestic12',
  'siteexplorer',
  'seomoz',
  'blekkobot',
  'warobot',
  'yandexbot',  // Optional: block if not targeting Russian audience
  'baiduspider', // Optional: block if not targeting Chinese audience
  'sqlmap',      // SQL injection tool
  'nikto',       // Vulnerability scanner
  'nmap',        // Port scanner
  'masscan',     // Mass port scanner
  'dirbuster',   // Directory brute-force
  'gobuster',    // Directory brute-force
  'wfuzz',       // Web fuzzer
  'burpsuite',   // Web security testing
  'zap',         // OWASP ZAP scanner
];

// Maximum request body size (1MB for API routes)
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getEdgeClientIp(request);

  // ============================================================
  // 1. GLOBAL RATE LIMITING - Per-IP, applies to ALL requests
  // This is the first line of defense against DDoS/abuse
  // ============================================================
  if (isEdgeRateLimited(clientIp, EDGE_RATE_LIMITS.GLOBAL)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  // ============================================================
  // 2. BOT DETECTION - Block known malicious bots/scanners
  // ============================================================
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  // Block known bad bots
  const isBlockedBot = BLOCKED_USER_AGENTS.some(bot => userAgent.includes(bot));
  if (isBlockedBot) {
    return new NextResponse(null, { status: 403 });
  }

  // Block requests with no User-Agent (often bots)
  if (!userAgent || userAgent.length < 5) {
    // Allow health checks from monitoring services (they might have minimal UA)
    if (pathname !== '/api/health') {
      return new NextResponse(null, { status: 403 });
    }
  }

  // ============================================================
  // 3. REQUEST SIZE LIMITING - Block oversized requests
  // ============================================================
  if (pathname.startsWith('/api/') && request.method !== 'GET' && request.method !== 'HEAD') {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large. Maximum size is 1MB.', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 }
      );
    }
  }

  // ============================================================
  // 4. SECURITY HEADERS for dynamic responses
  // Note: Base security headers (CSP, HSTS, X-Frame-Options, etc.)
  // are set in next.config.ts headers() which covers ALL responses
  // including static files. Middleware adds additional dynamic
  // headers (rate limits, cache overrides, etc.) here.
  // ============================================================
  const response = NextResponse.next();

  // ============================================================
  // 5. PROTECT ADMIN PAGES with server-side auth check
  // ============================================================
  const isAdminPage = ADMIN_PAGES.some(path => pathname.startsWith(path));
  if (isAdminPage) {
    const isAuthenticated = await isAuthValid(request);

    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated - serve page with no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // ============================================================
  // 6. PROTECT ADMIN API ROUTES with auth check
  // ============================================================
  const isProtectedApi = PROTECTED_API_ROUTES.some(path => pathname.startsWith(path));
  if (isProtectedApi) {
    // Allow login and logout routes without auth
    if (pathname === '/api/admin/login' || pathname === '/api/admin/logout') {
      // Rate limit login attempts specifically
      if (pathname === '/api/admin/login') {
        if (isEdgeRateLimited(clientIp, EDGE_RATE_LIMITS.LOGIN)) {
          return new NextResponse(
            JSON.stringify({
              error: 'Too many login attempts. Please try again later.',
              code: 'RATE_LIMITED',
              retryAfter: 900, // 15 minutes
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': '900',
              },
            }
          );
        }
      }
      response.headers.set('Cache-Control', 'no-store');
      return response;
    }

    // For TMDB sync, allow CRON_SECRET header (for Vercel cron jobs)
    if (pathname === '/api/tmdb/sync') {
      const cronSecret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('cron_secret');
      if (cronSecret && cronSecret === process.env.CRON_SECRET) {
        response.headers.set('Cache-Control', 'no-store');
        return response;
      }
    }

    // For setup-db, allow SETUP_SECRET param
    if (pathname === '/api/setup-db') {
      const setupSecret = request.nextUrl.searchParams.get('secret');
      if (setupSecret && setupSecret === process.env.SETUP_SECRET) {
        response.headers.set('Cache-Control', 'no-store');
        return response;
      }
    }

    // Check authentication for all other protected API routes
    const isAuthenticated = await isAuthValid(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_MISSING' },
        { status: 401 }
      );
    }

    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // ============================================================
  // 7. ADMIN WRITE API ROUTES - middleware level auth
  // ============================================================
  const isAdminWriteRoute = ADMIN_WRITE_ROUTES.some(path => pathname.startsWith(path));
  if (isAdminWriteRoute) {
    const method = request.method;
    // Only protect write operations (PUT, DELETE, POST)
    if (method === 'PUT' || method === 'DELETE' || method === 'POST') {
      const isAuthenticated = await isAuthValid(request);
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'AUTH_MISSING' },
          { status: 401 }
        );
      }
    }
    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // ============================================================
  // 8. PUBLIC API RATE LIMITING
  // Apply stricter rate limits to expensive public API endpoints
  // ============================================================
  const isPublicApi = pathname.startsWith('/api/');
  if (isPublicApi) {
    // Determine rate limit based on route
    let rateLimitConfig = EDGE_RATE_LIMITS.PUBLIC_API;

    // Stricter rate limit for search endpoints
    const isSearchApi = pathname === '/api/tmdb/search' ||
      (pathname === '/api/movies' && request.nextUrl.searchParams.has('search')) ||
      (pathname === '/api/series' && request.nextUrl.searchParams.has('search'));

    if (isSearchApi) {
      rateLimitConfig = EDGE_RATE_LIMITS.SEARCH_API;
    }

    if (isEdgeRateLimited(clientIp, rateLimitConfig)) {
      const retryAfter = Math.ceil(rateLimitConfig.windowMs / 1000);
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMITED',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Policy', `${rateLimitConfig.maxRequests};w=${Math.ceil(rateLimitConfig.windowMs / 1000)}`);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
