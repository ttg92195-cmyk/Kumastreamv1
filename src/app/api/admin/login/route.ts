export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { generateAuthToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Read credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'Admin8676';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin8676';

    if (username === adminUsername && password === adminPassword) {
      // Generate a token for subsequent API calls
      const token = generateAuthToken(username, password);

      return NextResponse.json({
        user: {
          id: 'admin-1',
          username: adminUsername,
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
