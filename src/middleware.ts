import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAuthValid } from '@/lib/auth';

// ============================================================
// MIDDLEWARE - Route-level protection for admin pages and APIs
// ============================================================

// Admin API routes that require authentication
// (Write operations are checked in route handlers, middleware adds extra protection layer)
const PROTECTED_API_ROUTES = [
  '/api/admin/',
  '/api/tmdb/',
  '/api/health',
  '/api/setup-db',
];

// Admin write API routes that need extra rate limit protection
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ---- Security Headers for ALL responses ----
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // ---- Protect admin pages with server-side auth check ----
  const isAdminPage = ADMIN_PAGES.some(path => pathname.startsWith(path));
  if (isAdminPage) {
    // Server-side auth check using cookie or Authorization header
    const isAuthenticated = isAuthValid(request);

    if (!isAuthenticated) {
      // Redirect to login page instead of serving the page
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated - serve page with no-cache headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // ---- Protect admin API routes ----
  const isProtectedApi = PROTECTED_API_ROUTES.some(path => pathname.startsWith(path));
  if (isProtectedApi) {
    // Allow login route without auth
    if (pathname === '/api/admin/login') {
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
    const isAuthenticated = isAuthValid(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_MISSING' },
        { status: 401 }
      );
    }

    response.headers.set('Cache-Control', 'no-store');
    return response;
  }

  // ---- Admin write API routes - middleware level rate limiting ----
  const isAdminWriteRoute = ADMIN_WRITE_ROUTES.some(path => pathname.startsWith(path));
  if (isAdminWriteRoute) {
    const method = request.method;
    // Only protect write operations (PUT, DELETE, POST)
    if (method === 'PUT' || method === 'DELETE' || method === 'POST') {
      // Auth check at middleware level (double protection with route handler)
      const isAuthenticated = isAuthValid(request);
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

  // ---- Public API routes: add rate limiting headers ----
  const isPublicApi = pathname.startsWith('/api/');
  if (isPublicApi) {
    response.headers.set('X-RateLimit-Policy', '60;w=60'); // 60 requests per 60 seconds
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
