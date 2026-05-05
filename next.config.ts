import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true, // TODO: Set to false after fixing all TypeScript errors
  },
  reactStrictMode: true,
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
  // Build-time env fallbacks for database URLs
  // SECURITY: No hardcoded connection strings - if env vars are missing, use empty strings
  // Prisma will throw a clear error at runtime if DATABASE_URL is not configured
  env: {
    DATABASE_URL: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL || '',
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL || '',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || '',
  },

  // ============================================================
  // SECURITY HEADERS - Applied to ALL responses including static files
  // These cover static assets (images, fonts, JS, CSS) that
  // middleware doesn't handle due to its matcher pattern.
  // Middleware adds additional headers for dynamic routes.
  // ============================================================
  async headers() {
    return [
      {
        // Apply security headers to ALL routes
        source: '/(.*)',
        headers: [
          // ── Core Security Headers ─────────────────────────────
          // Prevent MIME type sniffing (force declared content-type)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Prevent clickjacking - no framing allowed
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Enable browser XSS filter (legacy but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information sent to other sites
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Disable browser features that could be abused
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },

          // ── HTTPS Enforcement ─────────────────────────────────
          // HSTS: Force HTTPS for 1 year, include subdomains, allow preload
          // Only effective after first HTTPS visit
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },

          // ── Content Security Policy ──────────────────────────
          // Prevent XSS, code injection, and unauthorized resource loading
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // unsafe needed for Next.js runtime
              "style-src 'self' 'unsafe-inline'",                  // unsafe-inline needed for Tailwind CSS
              "img-src 'self' data: https://image.tmdb.org https://via.placeholder.com blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.themoviedb.org https://*.vercel.app",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },

          // ── Cross-Origin Policies ─────────────────────────────
          // Prevent other origins from reading responses
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Prevent other origins from embedding resources
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // Allow TMDB images to be loaded (must be unsafe-none)
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
        ],
      },
      {
        // ── Static Assets: Aggressive caching + security ───────
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // Static assets don't need to be framed or sniffed
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // ── Images: Long cache + security ──────────────────────
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // ── API Routes: No caching (prevent stale data) ────────
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
      {
        // ── Admin Pages: No caching (prevent leaking admin data) ──
        source: '/admin/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
