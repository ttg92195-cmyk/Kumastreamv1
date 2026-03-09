import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

  try {
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    health.database.connected = true;
    
    // Check if tables exist by trying to count
    try {
      const movieCount = await prisma.movie.count();
      const seriesCount = await prisma.series.count();
      
      health.database.tablesExist = true;
      
      await prisma.$disconnect();
      
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
      await prisma.$disconnect();
      
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
