import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// AUTH CONFIGURATION
// ============================================================

// Token configuration
const TOKEN_EXPIRY_HOURS = 24; // Token expires after 24 hours
const TOKEN_VERSION = 1; // Increment to invalidate all existing tokens

// Cookie name for storing auth token
const AUTH_COOKIE_NAME = 'admin_token';

// Get admin credentials from environment variables
// SECURITY: No default fallbacks - admin MUST set ADMIN_USERNAME and ADMIN_PASSWORD
function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    // In production, throw error if credentials not set
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SECURITY ERROR: ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables. ' +
        'Go to Vercel Dashboard > Settings > Environment Variables to add them.'
      );
    }
    // In development, use a derived default but log a warning
    console.warn(
      '⚠️ SECURITY WARNING: ADMIN_USERNAME or ADMIN_PASSWORD not set. ' +
      'Using derived defaults for development only. Set these in .env.local for security.'
    );
    const derivedKey = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || 'fallback';
    const hash = crypto.createHash('sha256').update(derivedKey).digest('hex').substring(0, 12);
    return {
      username: `admin_${hash.substring(0, 6)}`,
      password: hash,
    };
  }

  return { username, password };
}

// Get or generate a token signing secret
// SECURITY: AUTH_SECRET must be set in production for persistent tokens across deploys
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  // In production, throw error if AUTH_SECRET not set
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SECURITY ERROR: AUTH_SECRET must be set in environment variables. ' +
      'Generate one with: openssl rand -base64 32'
    );
  }

  // Development fallback: derive from admin credentials
  console.warn(
    '⚠️ AUTH_SECRET not set. Using derived key for development only. ' +
    'Set AUTH_SECRET in .env.local for persistent tokens.'
  );
  const { username, password } = getAdminCredentials();
  return crypto.createHash('sha256').update(`${username}:${password}:auth-secret`).digest('hex');
}

// ============================================================
// TOKEN GENERATION & VALIDATION (HMAC-based, not reversible)
// ============================================================

/**
 * Generate a secure HMAC-based auth token.
 * Format: base64(version:timestamp:signature)
 * The signature is HMAC-SHA256 of (version:timestamp:username) using the auth secret.
 * This token is NOT reversible - you cannot extract credentials from it.
 */
export function generateAuthToken(username: string, _password: string): string {
  const secret = getAuthSecret();
  const timestamp = Date.now();
  const payload = `${TOKEN_VERSION}:${timestamp}:${username}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Encode as base64 for compact token
  const token = Buffer.from(`${payload}:${signature}`).toString('base64');
  return token;
}

/**
 * Extract auth token from request - checks both Authorization header and cookie.
 * This allows API calls from both frontend (cookie) and programmatic (header) sources.
 */
function extractAuthToken(request: NextRequest): string | null {
  // 1. Check Authorization header first (for API calls from admin panel)
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookie (for browser-based requests, middleware)
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Validate admin session from request headers or cookies.
 * Checks for Bearer token in Authorization header OR admin_token cookie.
 * Uses HMAC verification - token cannot be forged without the secret.
 */
export function validateAdminAuth(request: NextRequest): { authorized: boolean; response?: NextResponse; username?: string } {
  const token = extractAuthToken(request);

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_MISSING' },
        { status: 401 }
      ),
    };
  }

  try {
    // Decode token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');

    if (parts.length !== 4) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid token format', code: 'AUTH_INVALID' },
          { status: 401 }
        ),
      };
    }

    const [versionStr, timestampStr, username, providedSignature] = parts;
    const version = parseInt(versionStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    // Check token version
    if (version !== TOKEN_VERSION) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Token version expired. Please log in again.', code: 'AUTH_VERSION' },
          { status: 401 }
        ),
      };
    }

    // Check token expiry
    const tokenAge = Date.now() - timestamp;
    const maxAge = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    if (tokenAge > maxAge) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Session expired. Please log in again.', code: 'AUTH_EXPIRED' },
          { status: 401 }
        ),
      };
    }

    // Verify HMAC signature
    const secret = getAuthSecret();
    const payload = `${version}:${timestamp}:${username}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid credentials', code: 'AUTH_FORBIDDEN' },
          { status: 403 }
        ),
      };
    }

    // Verify username matches admin credentials
    const { username: adminUsername } = getAdminCredentials();
    if (username !== adminUsername) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid credentials', code: 'AUTH_FORBIDDEN' },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, username };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid token', code: 'AUTH_INVALID' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Lightweight auth check for middleware - doesn't throw, just returns boolean.
 * Used to protect admin pages at the middleware level before rendering.
 */
export function isAuthValid(request: NextRequest): boolean {
  try {
    const token = extractAuthToken(request);
    if (!token) return false;

    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 4) return false;

    const [versionStr, timestampStr, username, providedSignature] = parts;
    const version = parseInt(versionStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    // Check version
    if (version !== TOKEN_VERSION) return false;

    // Check expiry
    const tokenAge = Date.now() - timestamp;
    const maxAge = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
    if (tokenAge > maxAge) return false;

    // Verify HMAC signature
    const secret = getAuthSecret();
    const payload = `${version}:${timestamp}:${username}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))) {
      return false;
    }

    // Verify username
    const { username: adminUsername } = getAdminCredentials();
    if (username !== adminUsername) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Validate admin credentials for login.
 * Returns { valid: boolean, username?: string }
 */
export function validateCredentials(username: string, password: string): { valid: boolean; username?: string } {
  const creds = getAdminCredentials();
  if (username === creds.username && password === creds.password) {
    return { valid: true, username: creds.username };
  }
  return { valid: false };
}

// ============================================================
// COOKIE HELPERS
// ============================================================

/**
 * Get cookie configuration for admin token.
 */
export function getAuthCookieConfig() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: TOKEN_EXPIRY_HOURS * 60 * 60, // 24 hours in seconds
  };
}

/**
 * Get the cookie name constant (for use in login route).
 */
export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

// ============================================================
// INPUT VALIDATION
// ============================================================

/**
 * Validate URL to prevent XSS/phishing via download links.
 * Only allows https:// and http:// URLs.
 */
export function isValidDownloadUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Sanitize error for production - removes sensitive details.
 */
export function sanitizeError(error: unknown, fallbackMessage: string = 'An internal error occurred'): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return fallbackMessage;
  }
  return fallbackMessage;
}
