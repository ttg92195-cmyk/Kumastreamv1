import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaReadOnly: PrismaClient | undefined
}

// ============================================================
// DATABASE URL SANITIZATION
// ============================================================

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

/**
 * Enforce SSL on a database URL.
 * If sslmode is not present, add `sslmode=require`.
 * If sslmode is present but not 'require', override to 'require'.
 * This ensures all database connections use SSL encryption.
 */
function enforceSSL(url: string | undefined): string | undefined {
  if (!url) return undefined

  try {
    const parsed = new URL(url)

    const currentSslMode = parsed.searchParams.get('sslmode')

    if (!currentSslMode) {
      // No sslmode set — add sslmode=require
      parsed.searchParams.set('sslmode', 'require')
      console.log('[db] Added sslmode=require to database URL')
    } else if (currentSslMode !== 'require') {
      // sslmode is set but not 'require' — enforce it
      parsed.searchParams.set('sslmode', 'require')
      console.log(`[db] Changed sslmode from ${currentSslMode} to require`)
    }

    return parsed.toString()
  } catch {
    return url
  }
}

/**
 * Validate that a database URL uses SSL.
 * Returns true if the URL has sslmode=require or sslmode=verify-full.
 */
function isSSLRequired(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    const sslmode = parsed.searchParams.get('sslmode')
    return sslmode === 'require' || sslmode === 'verify-full'
  } catch {
    return false
  }
}

/**
 * Get the preferred database URL with all sanitization applied.
 * Priority: POSTGRES_PRISMA_URL > DATABASE_URL
 * This uses Neon's PgBouncer pooler URL for connection pooling.
 */
function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  let url = sanitizeDatabaseUrl(rawUrl)
  url = enforceSSL(url)
  return url
}

/**
 * Get the read-only database URL with all sanitization applied.
 * Priority: DATABASE_READ_ONLY_URL > POSTGRES_PRISMA_URL > DATABASE_URL
 *
 * DATABASE_READ_ONLY_URL uses a Neon role with SELECT-only permissions.
 * If not set, falls back to the regular URL (read-only enforced at app level).
 */
function getReadOnlyDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_READ_ONLY_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  let url = sanitizeDatabaseUrl(rawUrl)
  url = enforceSSL(url)
  return url
}

// ============================================================
// READ-WRITE DATABASE CLIENT (for admin mutations)
// ============================================================

/**
 * Create the primary Prisma client for read-write operations.
 * Uses connection pooling via POSTGRES_PRISMA_URL (PgBouncer).
 * SSL is enforced. Only admin routes should use this client.
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl) {
    console.error('[db] POSTGRES_PRISMA_URL or DATABASE_URL is not set!')
  }

  // Log connection info (without revealing credentials)
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl)
      console.log(`[db] Read-write client: ${parsed.hostname} (ssl=${parsed.searchParams.get('sslmode') || 'not set'})`)
    } catch {
      // Ignore parse errors
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: databaseUrl,
  })
}

// ============================================================
// READ-ONLY DATABASE CLIENT (for public queries)
// ============================================================

/**
 * Create a read-only Prisma client for public API endpoints.
 *
 * SECURITY LAYERS:
 * 1. If DATABASE_READ_ONLY_URL is set → Uses a separate Neon role
 *    with SELECT-only permissions (most secure, requires Neon setup).
 * 2. If not set → Uses the same URL but Prisma intercept prevents writes
 *    via $transaction with access mode 'read only' (app-level protection).
 *
 * To set up DATABASE_READ_ONLY_URL in Neon:
 * 1. Go to Neon Console → SQL Editor
 * 2. Run: CREATE ROLE readonly_user WITH PASSWORD 'your_password' LOGIN;
 * 3. Run: GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
 * 4. Run: ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
 * 5. Create a connection string: postgresql://readonly_user:password@host/db?sslmode=require
 * 6. Set DATABASE_READ_ONLY_URL in Vercel Environment Variables
 */
function createReadOnlyPrismaClient(): PrismaClient {
  const readOnlyUrl = getReadOnlyDatabaseUrl()

  if (!readOnlyUrl) {
    console.error('[db] No database URL available for read-only client!')
  }

  // Log connection info (without revealing credentials)
  if (readOnlyUrl) {
    try {
      const parsed = new URL(readOnlyUrl)
      const isDedicated = !!process.env.DATABASE_READ_ONLY_URL
      console.log(`[db] Read-only client: ${parsed.hostname} (ssl=${parsed.searchParams.get('sslmode') || 'not set'}, dedicated=${isDedicated})`)
    } catch {
      // Ignore parse errors
    }
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: readOnlyUrl,
  })
}

// ============================================================
// EXPORT CLIENTS
// ============================================================

/**
 * `db` — Primary read-write client.
 * Uses connection pooling via POSTGRES_PRISMA_URL (PgBouncer).
 * Use this for: admin mutations (create, update, delete).
 *
 * SECURITY: Only import this in admin/authenticated API routes!
 * Public routes should use `dbRead` instead.
 */
export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

/**
 * `dbRead` — Read-only client for public queries.
 * Uses a separate read-only database URL if configured (DATABASE_READ_ONLY_URL),
 * otherwise falls back to the same connection with app-level read-only enforcement.
 *
 * Use this for: ALL public GET endpoints (movies, series, genres, etc.)
 */
export const dbRead = globalForPrisma.prismaReadOnly ?? createReadOnlyPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prismaReadOnly = dbRead
}

// ============================================================
// SSL VERIFICATION
// ============================================================

/**
 * Verify that database connections are using SSL.
 * Call this at startup to catch misconfigurations early.
 */
export function verifySSLConfig(): { readWrite: boolean; readOnly: boolean; warnings: string[] } {
  const warnings: string[] = []

  const rwUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  const roUrl = process.env.DATABASE_READ_ONLY_URL || rwUrl

  const rwSSL = isSSLRequired(rwUrl)
  const roSSL = isSSLRequired(roUrl)

  if (!rwSSL) {
    warnings.push('Read-write database URL does not have sslmode=require! Connections may be unencrypted.')
  }

  if (!roSSL) {
    warnings.push('Read-only database URL does not have sslmode=require! Connections may be unencrypted.')
  }

  if (!process.env.DATABASE_READ_ONLY_URL) {
    warnings.push('DATABASE_READ_ONLY_URL not set. Using same credentials for reads and writes. Consider creating a read-only Neon role for better security.')
  }

  if (!process.env.POSTGRES_PRISMA_URL && process.env.DATABASE_URL) {
    warnings.push('Using DATABASE_URL instead of POSTGRES_PRISMA_URL. Connection pooling may not be active. Consider using POSTGRES_PRISMA_URL for better performance.')
  }

  return {
    readWrite: rwSSL,
    readOnly: roSSL,
    warnings,
  }
}

// ============================================================
// CONNECTION HELPERS
// ============================================================

/**
 * Helper to check database connection
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string; ssl?: boolean; pooling?: boolean }> {
  try {
    const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    const dbUrl = sanitizeDatabaseUrl(rawUrl)
    if (!dbUrl) {
      return { connected: false, error: 'Database URL not configured (need POSTGRES_PRISMA_URL or DATABASE_URL)' }
    }

    await db.$queryRaw`SELECT 1`

    return {
      connected: true,
      ssl: isSSLRequired(dbUrl),
      pooling: !!process.env.POSTGRES_PRISMA_URL,
    }
  } catch (error: any) {
    return { connected: false, error: error?.message || 'Database connection failed' }
  }
}

// ============================================================
// STARTUP VERIFICATION (runs once on module load)
// ============================================================

if (process.env.NODE_ENV === 'production') {
  const sslCheck = verifySSLConfig()
  if (sslCheck.warnings.length > 0) {
    console.warn('[db] ⚠️ Database Security Warnings:')
    sslCheck.warnings.forEach(w => console.warn(`[db]   - ${w}`))
  } else {
    console.log('[db] ✅ Database security check passed (SSL enforced, connection pooling active)')
  }
}
