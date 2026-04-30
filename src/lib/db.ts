import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Strip problematic query parameters from a database URL.
 * Neon integration may add `channel_binding=require` which is incompatible
 * with Prisma's connection pooling. This function removes it at runtime
 * so we don't need to edit Vercel's read-only integration variables.
 */
function sanitizeDatabaseUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  try {
    const parsed = new URL(url)

    // Remove channel_binding parameter — Prisma/Neon pooler doesn't support it
    if (parsed.searchParams.has('channel_binding')) {
      parsed.searchParams.delete('channel_binding')
      console.log('[db] Removed channel_binding from database URL')
    }

    return parsed.toString()
  } catch {
    // If URL parsing fails, return as-is (Prisma will handle the error)
    return url
  }
}

// Create Prisma client with explicit datasource URL for Vercel + Neon
// Prefer POSTGRES_PRISMA_URL (Neon's Prisma-optimized URL without channel_binding)
// Fall back to DATABASE_URL if POSTGRES_PRISMA_URL is not available
function createPrismaClient(): PrismaClient {
  const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  const databaseUrl = sanitizeDatabaseUrl(rawUrl)

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
    const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    const dbUrl = sanitizeDatabaseUrl(rawUrl);
    if (!dbUrl) {
      return { connected: false, error: 'Database URL not configured (need POSTGRES_PRISMA_URL or DATABASE_URL)' }
    }
    await db.$queryRaw`SELECT 1`
    return { connected: true }
  } catch (error: any) {
    return { connected: false, error: error?.message || 'Database connection failed' }
  }
}
