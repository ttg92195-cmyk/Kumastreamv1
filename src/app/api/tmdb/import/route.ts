export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminAuth, sanitizeError } from '@/lib/auth';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getTmdbApiKey() {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error('TMDB_API_KEY environment variable is not set');
  return key;
}

// Placeholder image
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

/**
 * Fetch TMDB detail with timeout protection
 */
async function fetchTMDBDetail(type: string, id: number) {
  const TMDB_API_KEY = getTmdbApiKey();
  const detailUrl = `${TMDB_BASE_URL}/${type === 'tv' ? 'tv' : 'movie'}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,external_ids`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(detailUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const details = await response.json();
    if (details.success === false) return null;
    return details;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Fetch all seasons for a TV series in parallel (concurrency-limited)
 */
async function fetchSeasonsEpisodes(tmdbId: number, totalSeasons: number) {
  const allEpisodes: any[] = [];

  // Fetch all seasons in parallel (most series have 1-8 seasons, safe to parallelize)
  const seasonPromises = [];
  for (let s = 1; s <= totalSeasons; s++) {
    const TMDB_API_KEY = getTmdbApiKey();
    const seasonUrl = `${TMDB_BASE_URL}/tv/${tmdbId}/season/${s}?api_key=${TMDB_API_KEY}`;
    seasonPromises.push(
      fetch(seasonUrl)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );
  }

  const seasonResults = await Promise.all(seasonPromises);

  for (let s = 0; s < seasonResults.length; s++) {
    const seasonData = seasonResults[s];
    if (seasonData?.episodes) {
      for (const ep of seasonData.episodes) {
        allEpisodes.push({
          tmdbId: ep.id,
          season: ep.season_number || (s + 1),
          episode: ep.episode_number || 1,
          title: ep.name || `Episode ${ep.episode_number}`,
          duration: ep.runtime || 45,
          airDate: ep.air_date || null,
          fileSize: '',
          quality: '1080p HEVC',
          format: 'MKV',
        });
      }
    }
  }

  return allEpisodes;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Auth check
    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    console.log('=== TMDB Import Started (Optimized) ===');

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Items array is required and cannot be empty'
      }, { status: 400 });
    }

    console.log(`Items to import: ${items.length}`);

    const importedItems: any[] = [];
    const errors: any[] = [];
    const duplicates: any[] = [];

    // ===== FIX 1: Batch duplicate check - 1 query instead of N queries =====
    const movieIds = items.filter((item: any) => (item.type || 'movie') === 'movie').map((item: any) => item.id);
    const seriesIds = items.filter((item: any) => item.type === 'tv').map((item: any) => item.id);

    const [existingMovies, existingSeries] = await Promise.all([
      movieIds.length > 0
        ? db.movie.findMany({
            where: { tmdbId: { in: movieIds } },
            select: { tmdbId: true, title: true },
          })
        : Promise.resolve([]),
      seriesIds.length > 0
        ? db.series.findMany({
            where: { tmdbId: { in: seriesIds } },
            select: { tmdbId: true, title: true },
          })
        : Promise.resolve([]),
    ]);

    const existingMovieMap = new Map(existingMovies.map((m: any) => [m.tmdbId, m.title]));
    const existingSeriesMap = new Map(existingSeries.map((s: any) => [s.tmdbId, s.title]));

    console.log(`Duplicate check: ${existingMovieMap.size} existing movies, ${existingSeriesMap.size} existing series`);

    // ===== FIX 2: Fetch TMDB details in parallel (concurrency-limited) =====
    // Process in batches of 5 to avoid TMDB rate limiting
    const BATCH_SIZE = 5;
    const tmdbDetailsMap = new Map<number, any>();

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      // Skip already-imported items
      const toFetch = batch.filter((item: any) => {
        const type = item.type || 'movie';
        const existingMap = type === 'movie' ? existingMovieMap : existingSeriesMap;
        return !existingMap.has(item.id);
      });

      if (toFetch.length === 0) {
        // All items in this batch are duplicates
        for (const item of batch) {
          const type = item.type || 'movie';
          const existingMap = type === 'movie' ? existingMovieMap : existingSeriesMap;
          const title = existingMap.get(item.id);
          duplicates.push({ id: item.id, type, title, reason: 'Already imported' });
        }
        continue;
      }

      // Fetch TMDB details in parallel for this batch
      const detailPromises = toFetch.map(async (item: any) => {
        const type = item.type || 'movie';
        const details = await fetchTMDBDetail(type, item.id);
        return { item, details };
      });

      const detailResults = await Promise.all(detailPromises);

      // Process results
      for (const { item, details } of detailResults) {
        const type = item.type || 'movie';

        // Check duplicate (may have been imported in a previous batch in same request)
        const existingMap = type === 'movie' ? existingMovieMap : existingSeriesMap;
        if (existingMap.has(item.id)) {
          duplicates.push({ id: item.id, type, title: existingMap.get(item.id), reason: 'Already imported' });
          continue;
        }

        if (!details) {
          errors.push({ id: item.id, type, error: 'Failed to fetch TMDB details' });
          continue;
        }

        tmdbDetailsMap.set(item.id, { details, type });
      }

      // Also record duplicates from this batch that weren't in toFetch
      for (const item of batch) {
        const type = item.type || 'movie';
        const existingMap = type === 'movie' ? existingMovieMap : existingSeriesMap;
        if (existingMap.has(item.id) && !tmdbDetailsMap.has(item.id)) {
          const alreadyDup = duplicates.some(d => d.id === item.id);
          if (!alreadyDup) {
            duplicates.push({ id: item.id, type, title: existingMap.get(item.id), reason: 'Already imported' });
          }
        }
      }
    }

    console.log(`Fetched ${tmdbDetailsMap.size} TMDB details, ${duplicates.length} duplicates, ${errors.length} fetch errors`);

    // ===== FIX 3: Create movies/series and batch insert episodes =====
    // Separate movies and series for processing
    const movieItems: any[] = [];
    const seriesItems: any[] = [];

    for (const [id, { details, type }] of tmdbDetailsMap) {
      if (type === 'movie') {
        movieItems.push({ id, details });
      } else {
        seriesItems.push({ id, details });
      }
    }

    // Create all movies sequentially (Prisma create with nested casts)
    for (const { details } of movieItems) {
      try {
        const movie = await db.movie.create({
          data: {
            tmdbId: details.id,
            title: details.title || 'Unknown Title',
            year: parseInt((details.release_date || '').split('-')[0]) || 0,
            rating: details.vote_average || 0,
            duration: details.runtime || 0,
            poster: details.poster_path
              ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
              : PLACEHOLDER,
            backdrop: details.backdrop_path
              ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
              : PLACEHOLDER,
            description: details.overview || '',
            review: details.overview || '',
            genres: details.genres?.map((g: { name: string }) => g.name).join(',') || '',
            quality4k: true,
            director: details.credits?.crew?.find((c: { job: string }) => c.job === 'Director')?.name || '',
            fileSize: '',
            quality: '1080p HEVC',
            format: 'MKV',
            subtitle: 'Myanmar Subtitle (Hardsub)',
            imdbRating: details.vote_average || 0,
            rtRating: 0,
            lastSyncedAt: new Date(),
            casts: {
              create: (details.credits?.cast?.slice(0, 10) || []).map(
                (c: { name: string; character: string; profile_path: string | null }) => ({
                  name: c.name || '',
                  role: c.character || '',
                  photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
                })
              ),
            },
          },
          select: { id: true, tmdbId: true, title: true },
        });

        // Mark as imported to prevent duplicates in same request
        existingMovieMap.set(details.id, details.title);

        importedItems.push({ id: movie.id, tmdbId: details.id, title: movie.title, type: 'movie' });
        console.log(`  ✓ Movie imported: ${movie.title}`);
      } catch (itemError: any) {
        // Handle unique constraint violation (race condition)
        if (itemError?.code === 'P2002') {
          duplicates.push({ id: details.id, type: 'movie', title: details.title, reason: 'Already imported (concurrent)' });
        } else {
          errors.push({ id: details.id, type: 'movie', error: itemError?.message || 'Import failed' });
        }
      }
    }

    // Create series and fetch episodes in parallel
    for (const { details } of seriesItems) {
      try {
        const series = await db.series.create({
          data: {
            tmdbId: details.id,
            title: details.name || 'Unknown Title',
            year: parseInt((details.first_air_date || '').split('-')[0]) || 0,
            rating: details.vote_average || 0,
            poster: details.poster_path
              ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
              : PLACEHOLDER,
            backdrop: details.backdrop_path
              ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
              : PLACEHOLDER,
            description: details.overview || '',
            genres: details.genres?.map((g: { name: string }) => g.name).join(',') || '',
            quality4k: true,
            seasons: details.number_of_seasons || 0,
            totalEpisodes: details.number_of_episodes || 0,
            tmdbStatus: details.status || null,
            lastSyncedAt: new Date(),
            casts: {
              create: (details.credits?.cast?.slice(0, 10) || []).map(
                (c: { name: string; character: string; profile_path: string | null }) => ({
                  name: c.name || '',
                  role: c.character || '',
                  photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
                })
              ),
            },
          },
          select: { id: true, tmdbId: true, title: true },
        });

        // Mark as imported
        existingSeriesMap.set(details.id, details.name);

        // FIX 4: Fetch all seasons in parallel + batch insert episodes
        const totalSeasons = details.number_of_seasons || 1;
        const allEpisodes = await fetchSeasonsEpisodes(details.id, totalSeasons);

        if (allEpisodes.length > 0) {
          // Batch insert all episodes using createMany (1 query instead of N queries)
          const episodesWithSeriesId = allEpisodes.map(ep => ({
            ...ep,
            seriesId: series.id,
          }));

          try {
            const result = await db.episode.createMany({
              data: episodesWithSeriesId,
              skipDuplicates: true, // Skip episodes with duplicate tmdbId
            });
            console.log(`  ✓ Series imported: ${series.title} (${result.count} episodes)`);
          } catch (batchError) {
            // If batch insert fails, log but don't fail the import
            console.error(`  ⚠ Batch episode insert failed for ${series.title}:`, batchError);
          }
        } else {
          console.log(`  ✓ Series imported: ${series.title} (no episodes)`);
        }

        importedItems.push({ id: series.id, tmdbId: details.id, title: series.title, type: 'tv' });
      } catch (itemError: any) {
        if (itemError?.code === 'P2002') {
          duplicates.push({ id: details.id, type: 'tv', title: details.name, reason: 'Already imported (concurrent)' });
        } else {
          errors.push({ id: details.id, type: 'tv', error: itemError?.message || 'Import failed' });
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n=== Import Complete ===`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Imported: ${importedItems.length}, Duplicates: ${duplicates.length}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      imported: importedItems,
      count: importedItems.length,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        total: items.length,
        imported: importedItems.length,
        duplicates: duplicates.length,
        failed: errors.length,
        duration: `${duration}ms`,
      },
    });
  } catch (error: any) {
    console.error('=== Import Error ===');
    console.error('Error:', error);

    return NextResponse.json({
      success: false,
      error: sanitizeError(error, 'Failed to import items'),
    }, { status: 500 });
  }
}

// GET all TMDB imported items - Requires admin auth
export async function GET(request: Request) {
  try {
    // 🔐 Admin authentication required
    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;
    const [movies, series, totalMovies, totalSeries] = await Promise.all([
      db.movie.findMany({
        where: { tmdbId: { not: null } },
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          rating: true,
          poster: true,
          genres: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.series.findMany({
        where: { tmdbId: { not: null } },
        select: {
          id: true,
          tmdbId: true,
          title: true,
          year: true,
          rating: true,
          poster: true,
          genres: true,
          seasons: true,
          totalEpisodes: true,
          tmdbStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.movie.count({ where: { tmdbId: { not: null } } }),
      db.series.count({ where: { tmdbId: { not: null } } }),
    ]);

    return NextResponse.json({
      movies,
      series,
      totalMovies,
      totalSeries,
    });
  } catch (error: any) {
    console.error('Error fetching TMDB items:', error);
    return NextResponse.json({
      error: sanitizeError(error, 'Failed to fetch TMDB items'),
    }, { status: 500 });
  }
}

// DELETE an item
export async function DELETE(request: Request) {
  try {
    // Auth check
    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    const body = await request.json();
    const { id, type } = body;

    if (!id || !type) {
      return NextResponse.json({ error: 'ID and type are required' }, { status: 400 });
    }

    if (type === 'movie') {
      await db.movie.delete({ where: { id } });
    } else {
      await db.series.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({
      error: sanitizeError(error, 'Failed to delete item'),
    }, { status: 500 });
  }
}

// PUT - Check which TMDB IDs are already imported
export async function PUT(request: Request) {
  try {
    // Auth check
    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    const body = await request.json();
    const { tmdbIds, type } = body;

    if (!tmdbIds || !Array.isArray(tmdbIds)) {
      return NextResponse.json({ error: 'tmdbIds array is required' }, { status: 400 });
    }

    const importedIds: number[] = [];

    if (type === 'movie') {
      const existing = await db.movie.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true },
      });
      importedIds.push(...existing.map(m => m.tmdbId).filter(Boolean));
    } else {
      const existing = await db.series.findMany({
        where: { tmdbId: { in: tmdbIds } },
        select: { tmdbId: true },
      });
      importedIds.push(...existing.map(s => s.tmdbId).filter(Boolean));
    }

    return NextResponse.json({ importedIds });
  } catch (error: any) {
    console.error('Check imported error:', error);
    return NextResponse.json({
      error: sanitizeError(error, 'Failed to check imported items'),
    }, { status: 500 });
  }
}
