import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper to check database connection
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await db.$queryRaw`SELECT 1`
    return { connected: true }
  } catch {
    return { connected: false, error: 'Database connection failed' }
  }
}
