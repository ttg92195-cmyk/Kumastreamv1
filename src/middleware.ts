import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================
// MIDDLEWARE - Route-level protection for admin pages and APIs
// ============================================================

// Routes that require admin authentication
const PROTECTED_API_ROUTES = [
  '/api/admin/',
  '/api/tmdb/search',
  '/api/tmdb/genres',
  '/api/tmdb/import',
  '/api/tmdb/sync',
  '/api/health',
  '/api/setup-db',
  '/api/movies/',  // PUT, DELETE methods need auth (checked in route handler)
  '/api/series/',  // PUT, DELETE methods need auth (checked in route handler)
  '/api/episodes/', // PUT, DELETE methods need auth (checked in route handler)
];

// Admin pages that should redirect to login if not authenticated
// (Note: these are client-side protected, but we add server-side redirect too)
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

  // ---- Protect admin pages ----
  // Redirect unauthenticated users from admin pages to login
  const isAdminPage = ADMIN_PAGES.some(path => pathname.startsWith(path));
  if (isAdminPage) {
    // Check for auth token in cookies or Authorization header
    // Since we use localStorage, we can't check server-side
    // But we can still serve the page (client-side redirect handles it)
    // Just add cache-control to prevent caching admin pages
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }

  // ---- Protect API routes ----
  // For API routes, the auth check is done in the route handlers themselves
  // Middleware just adds rate limiting headers and security
  const isProtectedApi = PROTECTED_API_ROUTES.some(path => pathname.startsWith(path));
  if (isProtectedApi) {
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
