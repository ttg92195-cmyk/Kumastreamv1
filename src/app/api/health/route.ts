export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { validateAdminAuth } from '@/lib/auth';
import { safeRead, checkDatabaseConnection, verifySSLConfig } from '@/lib/db';

export async function GET(request: NextRequest) {
  // 🔐 Admin authentication required - health endpoint exposes DB info
  const authResult = validateAdminAuth(request);
  if (!authResult.authorized) return authResult.response!;

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
      tablesExist: false,
    },
    environment: {
      hasDatabaseUrl: !!(process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL),
      hasReadOnlyUrl: !!process.env.DATABASE_READ_ONLY_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  // Check if DATABASE_URL is configured
  if (!process.env.POSTGRES_PRISMA_URL && !process.env.DATABASE_URL) {
    health.status = 'error';
    health.database.error = 'Database URL not configured (need POSTGRES_PRISMA_URL or DATABASE_URL)';
    return NextResponse.json({
      ...health,
      hint: 'Set POSTGRES_PRISMA_URL or DATABASE_URL in Vercel environment variables.',
    }, { status: 500 });
  }

  try {
    // Test database connection
    const connectionCheck = await checkDatabaseConnection();

    if (!connectionCheck.connected) {
      health.status = 'error';
      health.database.error = connectionCheck.error || 'Unknown error';
      return NextResponse.json({
        ...health,
        hint: 'Check if Neon database is active and DATABASE_URL is correct in Vercel.',
      }, { status: 500 });
    }

    health.database.connected = true;

    // Check if tables exist by trying to count
    try {
      const movieCount = await safeRead(client => client.movie.count());
      const seriesCount = await safeRead(client => client.series.count());

      health.database.tablesExist = true;

      // Check SSL and connection pooling status
      const sslCheck = verifySSLConfig();

      return NextResponse.json({
        ...health,
        status: 'ok',
        stats: {
          movies: movieCount,
          series: seriesCount,
        },
        security: {
          ssl: sslCheck.readWrite,
          connectionPooling: !!process.env.POSTGRES_PRISMA_URL,
          readOnlyUser: !!process.env.DATABASE_READ_ONLY_URL,
          warnings: sslCheck.warnings.length > 0 ? sslCheck.warnings : undefined,
        },
        message: 'Database is fully operational!',
      });
    } catch (tableError: any) {
      // Tables don't exist
      return NextResponse.json({
        ...health,
        message: 'Database connected but tables do not exist. Visit /api/setup-db to create tables.',
        setupUrl: '/api/setup-db',
      });
    }

  } catch (error: any) {
    health.status = 'error';
    health.database.error = error?.message || 'Unknown database error';

    return NextResponse.json({
      ...health,
      hint: 'Check if Neon database is active and DATABASE_URL is correct in Vercel.',
    }, { status: 500 });
  }
}
