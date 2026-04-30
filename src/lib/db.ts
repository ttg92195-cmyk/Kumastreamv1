import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with explicit datasource URL for Vercel + Neon
// Prefer POSTGRES_PRISMA_URL (Neon's Prisma-optimized URL without channel_binding)
// Fall back to DATABASE_URL if POSTGRES_PRISMA_URL is not available
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('POSTGRES_PRISMA_URL or DATABASE_URL is not set!')
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: databaseUrl,
  })
}

// Use singleton pattern for Prisma client
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Helper to check database connection
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const dbUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (!dbUrl) {
      return { connected: false, error: 'Database URL not configured (need POSTGRES_PRISMA_URL or DATABASE_URL)' }
    }
    await db.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error: any) {
    return { connected: false, error: error?.message || 'Database connection failed' }
  }
}
