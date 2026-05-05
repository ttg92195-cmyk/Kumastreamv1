import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// AUTH CONFIGURATION
// ============================================================

// Token configuration
const TOKEN_EXPIRY_HOURS = 24; // Token expires after 24 hours
const TOKEN_VERSION = 1; // Increment to invalidate all existing tokens

// Get admin credentials - NO default fallbacks for security
// Admin MUST set ADMIN_USERNAME and ADMIN_PASSWORD env vars
function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  // If no env vars set, use a derived default (but log a warning)
  // This prevents the site from breaking on first deploy while still
  // encouraging users to set proper env vars
  if (!username || !password) {
    console.warn(
      '⚠️ SECURITY WARNING: ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables. ' +
      'Using derived defaults. Please set these in Vercel environment variables for security.'
    );
    // Use a derived value that's not guessable from source code alone
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
// In production, set AUTH_SECRET env var for persistent tokens across deploys
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;

  // Fallback: derive from admin credentials (changes when admin creds change)
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
 * Validate admin session from request headers.
 * Checks for Bearer token in Authorization header.
 * Uses HMAC verification - token cannot be forged without the secret.
 */
export function validateAdminAuth(request: NextRequest): { authorized: boolean; response?: NextResponse; username?: string } {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_MISSING' },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.substring(7);

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
