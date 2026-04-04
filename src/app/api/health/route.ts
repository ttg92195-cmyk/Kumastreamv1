export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db, checkDatabaseConnection } from '@/lib/db';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
      tablesExist: false,
    },
    environment: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
  };

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    health.status = 'error';
    health.database.error = 'DATABASE_URL not configured';
    return NextResponse.json({
      ...health,
      hint: 'Set DATABASE_URL in Vercel environment variables.',
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
      const movieCount = await db.movie.count();
      const seriesCount = await db.series.count();

      health.database.tablesExist = true;

      return NextResponse.json({
        ...health,
        status: 'ok',
        stats: {
          movies: movieCount,
          series: seriesCount,
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
