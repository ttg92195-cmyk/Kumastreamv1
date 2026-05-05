import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaReadOnly: PrismaClient | undefined
  readOnlyFailed: boolean | undefined
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
 * Validate that a database URL looks like a real, usable URL.
 * Catches placeholder/example URLs that users might accidentally set.
 * e.g. "ep-xxxxx-pooler", "your-hostname", "example.com"
 */
function isValidDatabaseUrl(url: string | undefined): { valid: boolean; reason?: string } {
  if (!url) return { valid: false, reason: 'URL is empty' }

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    // Check for common placeholder patterns
    const placeholderPatterns = [
      /xxxxx/i,
      /your[-_]/i,
      /example/i,
      /placeholder/i,
      /replace[-_]?me/i,
      /change[-_]?me/i,
      /localhost/i,          // Neon doesn't use localhost
    ]

    for (const pattern of placeholderPatterns) {
      if (pattern.test(hostname)) {
        return { valid: false, reason: `Hostname "${hostname}" looks like a placeholder` }
      }
    }

    // Must be a Neon hostname (ends with .neon.tech) or a known cloud DB provider
    const validHostSuffixes = [
      '.neon.tech',
      '.aws.neon.tech',
      '.azure.neon.tech',
      '.gcp.neon.tech',
    ]

    const isNeonHost = validHostSuffixes.some(suffix => hostname.endsWith(suffix))

    if (!isNeonHost) {
      // Not a Neon host — warn but still allow (could be a different provider)
      console.warn(`[db] Read-only URL hostname "${hostname}" is not a recognized Neon host. Proceeding with caution.`)
    }

    return { valid: true }
  } catch {
    return { valid: false, reason: 'URL is malformed' }
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
 * If not set, or if the URL looks like a placeholder, falls back to the
 * regular URL (read-only enforced at app level).
 */
function getReadOnlyDatabaseUrl(): { url: string | undefined; isDedicated: boolean } {
  const readOnlyEnvUrl = process.env.DATABASE_READ_ONLY_URL

  // If DATABASE_READ_ONLY_URL is set, validate it first
  if (readOnlyEnvUrl) {
    const validation = isValidDatabaseUrl(readOnlyEnvUrl)
    if (!validation.valid) {
      console.error(`[db] ⚠️ DATABASE_READ_ONLY_URL is invalid: ${validation.reason}`)
      console.error('[db] ⚠️ Falling back to read-write URL. Please update DATABASE_READ_ONLY_URL with a valid connection string.')
      console.error('[db] ⚠️ The read-only user should use the SAME pooler hostname as your regular URL, just with different username/password.')
      console.error('[db] ⚠️ Example: postgresql://readonly_user:password@ep-YOUR-ACTUAL-POOLER.aws.neon.tech/neondb?sslmode=require')
    } else {
      let url = sanitizeDatabaseUrl(readOnlyEnvUrl)
      url = enforceSSL(url)
      return { url, isDedicated: true }
    }
  }

  // Fall back to regular URL
  const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
  let url = sanitizeDatabaseUrl(rawUrl)
  url = enforceSSL(url)
  return { url, isDedicated: false }
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
 * 1. If DATABASE_READ_ONLY_URL is set AND valid → Uses a separate Neon role
 *    with SELECT-only permissions (most secure, requires Neon setup).
 * 2. If not set or invalid → Uses the same URL as the read-write client
 *    (read-only enforced at app level — public routes only use dbRead).
 *
 * IMPORTANT: The read-only user should use the SAME pooler hostname as your
 * regular database URL, just with a different username and password.
 *
 * To set up DATABASE_READ_ONLY_URL in Neon:
 * 1. Go to Neon Console → SQL Editor
 * 2. Run: CREATE ROLE readonly_user WITH PASSWORD 'your_password' LOGIN;
 * 3. Run: GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
 * 4. Run: ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
 * 5. Copy your pooler hostname from the read-write URL (e.g., ep-round-firefly-anpw1qos-pooler)
 * 6. Create connection string: postgresql://readonly_user:password@ep-YOUR-POOLER.aws.neon.tech/neondb?sslmode=require
 * 7. Set DATABASE_READ_ONLY_URL in Vercel Environment Variables
 */
function createReadOnlyPrismaClient(): PrismaClient {
  const { url: readOnlyUrl, isDedicated } = getReadOnlyDatabaseUrl()

  if (!readOnlyUrl) {
    console.error('[db] No database URL available for read-only client!')
  }

  // Log connection info (without revealing credentials)
  if (readOnlyUrl) {
    try {
      const parsed = new URL(readOnlyUrl)
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
// SAFE READ WITH FALLBACK
// ============================================================

/**
 * Track if read-only client has failed — once it fails, skip it for
 * the rest of the process lifetime to avoid repeated timeouts.
 */
function hasReadOnlyFailed(): boolean {
  return globalForPrisma.readOnlyFailed === true
}

function markReadOnlyFailed() {
  globalForPrisma.readOnlyFailed = true
  console.warn('[db] ⚠️ Read-only client marked as failed. All reads will use read-write client.')
}

/**
 * Execute a read query with automatic fallback.
 *
 * If the read-only client (dbRead) works → use it (more secure, separate permissions).
 * If the read-only client fails → fall back to the read-write client (db) and
 * mark the read-only client as failed for future requests.
 *
 * This ensures the site ALWAYS works, even if DATABASE_READ_ONLY_URL is misconfigured.
 */
export async function safeRead<T>(queryFn: (client: PrismaClient) => Promise<T>): Promise<T> {
  // If read-only already failed before, go straight to db
  if (hasReadOnlyFailed()) {
    return queryFn(db)
  }

  try {
    return await queryFn(dbRead)
  } catch (error: any) {
    const errorMsg = error?.message || String(error)

    // Check if this is a connection error (not a data/logic error)
    const isConnectionError =
      errorMsg.includes('connect') ||
      errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('ENOTFOUND') ||
      errorMsg.includes('timeout') ||
      errorMsg.includes('getaddrinfo') ||
      errorMsg.includes('fetch failed') ||
      errorMsg.includes('P1001') ||  // Prisma: Can't reach database server
      errorMsg.includes('P1002') ||  // Prisma: Database server timeout
      errorMsg.includes('P1003') ||  // Prisma: Database does not exist
      errorMsg.includes('P1008') ||  // Prisma: Operations timed out
      errorMsg.includes('P1009') ||  // Prisma: Database already exists
      errorMsg.includes('P1010') ||  // Prisma: Access denied
      errorMsg.includes('P1011') ||  // Prisma: TLS/SSL error
      errorMsg.includes('P1013') ||  // Prisma: Invalid database URL
      errorMsg.includes('P1015') ||  // Prisma: Unsupported URL scheme
      errorMsg.includes('P1017') ||  // Prisma: Server closed connection
      errorMsg.includes('permission denied') ||
      errorMsg.includes('relation')    // Table doesn't exist for this user

    if (isConnectionError) {
      console.error(`[db] ⚠️ Read-only client query failed: ${errorMsg}`)
      console.error('[db] ⚠️ Falling back to read-write client for this and future read queries')
      markReadOnlyFailed()
      return queryFn(db)
    }

    // Not a connection error — re-throw (it's a data/logic error)
    throw error
  }
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

  // Validate the read-only URL
  if (process.env.DATABASE_READ_ONLY_URL) {
    const validation = isValidDatabaseUrl(process.env.DATABASE_READ_ONLY_URL)
    if (!validation.valid) {
      warnings.push(`DATABASE_READ_ONLY_URL is invalid: ${validation.reason}. Falling back to read-write URL.`)
    }
  } else {
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
export async function checkDatabaseConnection(): Promise<{ connected: boolean; error?: string; ssl?: boolean; pooling?: boolean; readOnlyWorking?: boolean }> {
  try {
    const rawUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
    const dbUrl = sanitizeDatabaseUrl(rawUrl)
    if (!dbUrl) {
      return { connected: false, error: 'Database URL not configured (need POSTGRES_PRISMA_URL or DATABASE_URL)' }
    }

    await db.$queryRaw`SELECT 1`

    // Also check read-only client
    let readOnlyWorking = false
    try {
      await dbRead.$queryRaw`SELECT 1`
      readOnlyWorking = true
    } catch {
      readOnlyWorking = false
    }

    return {
      connected: true,
      ssl: isSSLRequired(dbUrl),
      pooling: !!process.env.POSTGRES_PRISMA_URL,
      readOnlyWorking,
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
