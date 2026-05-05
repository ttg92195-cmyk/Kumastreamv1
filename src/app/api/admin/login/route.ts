export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateAuthToken, validateCredentials } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    // Rate limiting - 5 login attempts per 15 minutes per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMITS.LOGIN);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Validate credentials using the secure auth module
    const result = validateCredentials(username, password);

    if (result.valid) {
      // Generate a secure HMAC-based token
      const token = generateAuthToken(username, password);

      return NextResponse.json({
        user: {
          id: 'admin-1',
          username: result.username,
          isAdmin: true,
        },
        token,
      });
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
