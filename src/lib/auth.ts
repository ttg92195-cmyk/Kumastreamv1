import { NextRequest, NextResponse } from 'next/server';

/**
 * Validate admin session from request headers.
 * Checks for Bearer token in Authorization header.
 * Returns { authorized: boolean, response?: NextResponse }
 */
export function validateAdminAuth(request: NextRequest): { authorized: boolean; response?: NextResponse } {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);

  // Validate token against environment variable
  // The token is a base64-encoded string of "username:password" that was set during login
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, password] = decoded.split(':');

    const adminUsername = process.env.ADMIN_USERNAME || 'Admin8676';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin8676';

    if (username !== adminUsername || password !== adminPassword) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Invalid credentials' }, { status: 403 }),
      };
    }

    return { authorized: true };
  } catch {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    };
  }
}

/**
 * Generate an auth token from username and password.
 * Returns a base64-encoded token for use in Authorization header.
 */
export function generateAuthToken(username: string, password: string): string {
  return Buffer.from(`${username}:${password}`).toString('base64');
}

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
