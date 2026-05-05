export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateAuthToken, validateCredentials, getAuthCookieConfig, getAuthCookieName } from '@/lib/auth';
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

      // Set auth cookie for server-side middleware verification
      const cookieConfig = getAuthCookieConfig();
      const response = NextResponse.json({
        user: {
          id: 'admin-1',
          username: result.username,
          isAdmin: true,
        },
        token,
      });

      // Set httpOnly cookie for middleware auth check
      response.cookies.set({
        name: getAuthCookieName(),
        value: token,
        httpOnly: cookieConfig.httpOnly,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        path: cookieConfig.path,
        maxAge: cookieConfig.maxAge,
      });

      return response;
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
