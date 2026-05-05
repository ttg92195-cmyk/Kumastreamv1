// ============================================================
// EDGE-RUNTIME COMPATIBLE AUTH CHECK
// This file is used by middleware.ts which runs in Edge Runtime.
// It uses Web Crypto API (crypto.subtle) instead of Node.js crypto.
// ============================================================

import type { NextRequest } from 'next/server';

// Must match auth.ts constants
const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_VERSION = 1;
const AUTH_COOKIE_NAME = 'admin_token';

/**
 * Extract auth token from request - checks both Authorization header and cookie.
 * Edge-compatible: No Node.js APIs used.
 */
function extractAuthToken(request: NextRequest): string | null {
  // 1. Check Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. Check cookie
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Base64 decode - Edge-compatible (no Buffer)
 */
function base64Decode(str: string): string {
  // atob is available in Edge Runtime
  return atob(str);
}

/**
 * Verify HMAC-SHA256 signature using Web Crypto API.
 * Edge-compatible: Uses crypto.subtle instead of Node.js crypto.
 */
async function verifyHmacSignature(payload: string, providedSignature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Compute the expected signature
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison
    if (expectedSignature.length !== providedSignature.length) return false;

    let result = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

/**
 * Lightweight async auth check for middleware.
 * Edge-compatible: Uses Web Crypto API for HMAC verification.
 * Returns true if the request has a valid admin token.
 */
export async function isAuthValid(request: NextRequest): Promise<boolean> {
  try {
    const token = extractAuthToken(request);
    if (!token) return false;

    // Decode token (Edge-compatible base64 decode)
    const decoded = base64Decode(token);
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

    // Get auth secret (environment variables are available in Edge Runtime)
    const secret = process.env.AUTH_SECRET;
    if (!secret) return false;

    // Verify HMAC signature using Web Crypto API
    const payload = `${version}:${timestamp}:${username}`;
    const isValidSignature = await verifyHmacSignature(payload, providedSignature, secret);
    if (!isValidSignature) return false;

    // Verify username matches admin credentials
    const adminUsername = process.env.ADMIN_USERNAME;
    if (!adminUsername || username !== adminUsername) return false;

    return true;
  } catch {
    return false;
  }
}
