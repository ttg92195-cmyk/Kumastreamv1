import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Hardcoded admin credentials for Vercel deployment
    // Username: Admin8676, Password: Admin8676
    if (username === 'Admin8676' && password === 'Admin8676') {
      return NextResponse.json({
        user: {
          id: 'admin-1',
          username: 'Admin8676',
          isAdmin: true,
        },
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
