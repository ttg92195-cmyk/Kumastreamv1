import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with explicit datasource URL for Vercel
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set!')
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
    if (!process.env.DATABASE_URL) {
      return { connected: false, error: 'DATABASE_URL not configured' }
    }
    await db.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error: any) {
    return { connected: false, error: error?.message || 'Database connection failed' }
  }
}
