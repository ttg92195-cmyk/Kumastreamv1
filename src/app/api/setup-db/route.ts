export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Execute a single SQL statement
async function executeSQL(sql: string, description: string) {
  try {
    await db.$executeRawUnsafe(sql);
    console.log(`✓ ${description}`);
    return { success: true };
  } catch (error: any) {
    // Ignore "already exists" errors
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`→ ${description} (already exists)`);
      return { success: true, skipped: true };
    }
    console.error(`✗ ${description}:`, error.message);
    return { success: false, error: error.message };
  }
}

export async function GET() {
  console.log('=== Database Setup Started ===');

  const results: string[] = [];
  const errors: string[] = [];

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not configured',
      hint: 'Set DATABASE_URL in Vercel environment variables.',
    }, { status: 500 });
  }

  try {
    console.log('Connecting to database...');
    await db.$connect();
    results.push('Connected to database');

    // Create tables one by one
    const tables = [
      {
        name: 'User',
        sql: `CREATE TABLE IF NOT EXISTS "User" (
          "id" TEXT NOT NULL,
          "username" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "isAdmin" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Movie',
        sql: `CREATE TABLE IF NOT EXISTS "Movie" (
          "id" TEXT NOT NULL,
          "tmdbId" INTEGER,
          "title" TEXT NOT NULL,
          "year" INTEGER NOT NULL DEFAULT 0,
          "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "duration" INTEGER NOT NULL DEFAULT 0,
          "poster" TEXT,
          "backdrop" TEXT,
          "description" TEXT NOT NULL DEFAULT '',
          "review" TEXT,
          "genres" TEXT NOT NULL DEFAULT '',
          "quality4k" BOOLEAN NOT NULL DEFAULT false,
          "director" TEXT,
          "fileSize" TEXT,
          "quality" TEXT,
          "format" TEXT,
          "subtitle" TEXT,
          "imdbRating" DOUBLE PRECISION,
          "rtRating" INTEGER,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Series',
        sql: `CREATE TABLE IF NOT EXISTS "Series" (
          "id" TEXT NOT NULL,
          "tmdbId" INTEGER,
          "title" TEXT NOT NULL,
          "year" INTEGER NOT NULL DEFAULT 0,
          "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "poster" TEXT,
          "backdrop" TEXT,
          "description" TEXT NOT NULL DEFAULT '',
          "genres" TEXT NOT NULL DEFAULT '',
          "quality4k" BOOLEAN NOT NULL DEFAULT false,
          "seasons" INTEGER NOT NULL DEFAULT 1,
          "totalEpisodes" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Episode',
        sql: `CREATE TABLE IF NOT EXISTS "Episode" (
          "id" TEXT NOT NULL,
          "tmdbId" INTEGER,
          "seriesId" TEXT NOT NULL,
          "season" INTEGER NOT NULL,
          "episode" INTEGER NOT NULL,
          "title" TEXT NOT NULL,
          "duration" INTEGER NOT NULL DEFAULT 0,
          "fileSize" TEXT,
          "quality" TEXT,
          "format" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Cast',
        sql: `CREATE TABLE IF NOT EXISTS "Cast" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "photo" TEXT,
          "role" TEXT,
          "movieId" TEXT,
          "seriesId" TEXT,
          CONSTRAINT "Cast_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'DownloadLink',
        sql: `CREATE TABLE IF NOT EXISTS "DownloadLink" (
          "id" TEXT NOT NULL,
          "movieId" TEXT,
          "seriesId" TEXT,
          "episodeId" TEXT,
          "server" TEXT NOT NULL DEFAULT 'Server 1',
          "quality" TEXT NOT NULL,
          "url" TEXT NOT NULL,
          "size" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "DownloadLink_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Genre',
        sql: `CREATE TABLE IF NOT EXISTS "Genre" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Bookmark',
        sql: `CREATE TABLE IF NOT EXISTS "Bookmark" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "movieId" TEXT,
          "seriesId" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'RecentView',
        sql: `CREATE TABLE IF NOT EXISTS "RecentView" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "movieId" TEXT,
          "seriesId" TEXT,
          "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RecentView_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Collection',
        sql: `CREATE TABLE IF NOT EXISTS "Collection" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
        )`
      },
      {
        name: 'Tag',
        sql: `CREATE TABLE IF NOT EXISTS "Tag" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "type" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
        )`
      }
    ];

    // Create each table
    for (const table of tables) {
      const result = await executeSQL(table.sql, `Create ${table.name} table`);
      if (result.success) {
        results.push(`Table ${table.name} created`);
      } else {
        errors.push(`Failed to create ${table.name}: ${result.error}`);
      }
    }

    // Create indexes
    const indexes = [
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Movie_tmdbId_key" ON "Movie"("tmdbId")`,
      `CREATE INDEX IF NOT EXISTS "Movie_tmdbId_idx" ON "Movie"("tmdbId")`,
      `CREATE INDEX IF NOT EXISTS "Movie_genres_idx" ON "Movie"("genres")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Series_tmdbId_key" ON "Series"("tmdbId")`,
      `CREATE INDEX IF NOT EXISTS "Series_tmdbId_idx" ON "Series"("tmdbId")`,
      `CREATE INDEX IF NOT EXISTS "Series_genres_idx" ON "Series"("genres")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Episode_tmdbId_key" ON "Episode"("tmdbId")`,
      `CREATE INDEX IF NOT EXISTS "Episode_seriesId_idx" ON "Episode"("seriesId")`,
      `CREATE INDEX IF NOT EXISTS "Episode_season_episode_idx" ON "Episode"("season", "episode")`,
      `CREATE INDEX IF NOT EXISTS "Cast_movieId_idx" ON "Cast"("movieId")`,
      `CREATE INDEX IF NOT EXISTS "Cast_seriesId_idx" ON "Cast"("seriesId")`,
      `CREATE INDEX IF NOT EXISTS "Bookmark_userId_idx" ON "Bookmark"("userId")`,
      `CREATE INDEX IF NOT EXISTS "RecentView_userId_idx" ON "RecentView"("userId")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Genre_name_type_key" ON "Genre"("name", "type")`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "Collection_name_type_key" ON "Collection"("name", "type")`
    ];

    for (const indexSql of indexes) {
      await executeSQL(indexSql, 'Create index');
    }
    results.push('Indexes created');

    // Create foreign keys (only if they don't exist)
    const foreignKeys = [
      `DO $$ BEGIN ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "Cast" ADD CONSTRAINT "Cast_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "Cast" ADD CONSTRAINT "Cast_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "DownloadLink" ADD CONSTRAINT "DownloadLink_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "DownloadLink" ADD CONSTRAINT "DownloadLink_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "DownloadLink" ADD CONSTRAINT "DownloadLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "Bookmark" ADD CONSTRAINT "Bookmark_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "RecentView" ADD CONSTRAINT "RecentView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "RecentView" ADD CONSTRAINT "RecentView_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`,
      `DO $$ BEGIN ALTER TABLE "RecentView" ADD CONSTRAINT "RecentView_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$`
    ];

    for (const fkSql of foreignKeys) {
      await executeSQL(fkSql, 'Create foreign key');
    }
    results.push('Foreign keys created');

    // Add server column to DownloadLink if it doesn't exist
    await executeSQL(
      `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DownloadLink' AND column_name = 'server') THEN
          ALTER TABLE "DownloadLink" ADD COLUMN "server" TEXT NOT NULL DEFAULT 'Server 1';
        END IF;
      END $$`,
      'Add server column to DownloadLink'
    );

    // Create admin user
    try {
      const hashedPassword = await bcrypt.hash('Admin8676', 10);

      // Check if user exists first
      const existingUsers = await db.$queryRaw`SELECT * FROM "User" WHERE username = 'Admin8676'`;

      if (!Array.isArray(existingUsers) || existingUsers.length === 0) {
        await db.$executeRawUnsafe(`
          INSERT INTO "User" (id, username, password, "isAdmin", "createdAt", "updatedAt")
          VALUES ('admin-001', 'Admin8676', '${hashedPassword}', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
        results.push('Admin user created: Admin8676 / Admin8676');
        console.log('Admin user created');
      } else {
        results.push('Admin user already exists');
        console.log('Admin user already exists');
      }
    } catch (userError: any) {
      results.push(`Admin user: ${userError.message}`);
    }

    console.log('=== Database Setup Complete ===');

    return NextResponse.json({
      success: true,
      message: 'Database setup completed!',
      results,
      errors: errors.length > 0 ? errors : undefined,
      tables: ['User', 'Movie', 'Series', 'Episode', 'Cast', 'DownloadLink', 'Genre', 'Bookmark', 'RecentView', 'Collection', 'Tag'],
      admin: {
        username: 'Admin8676',
        password: 'Admin8676'
      },
      nextSteps: [
        '1. Visit /api/health to verify tables exist',
        '2. Visit /admin/tmdb to start importing movies/series'
      ]
    });

  } catch (error: any) {
    console.error('Database setup error:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to setup database',
      details: error?.message || 'Unknown error',
      results,
      errors,
    }, { status: 500 });
  }
}
