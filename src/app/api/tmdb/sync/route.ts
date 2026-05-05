export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel

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

interface SyncResult {
  type: 'series' | 'movie';
  id: string;
  tmdbId: number;
  title: string;
  changes: string[];
  newEpisodes?: number;
}

/**
 * Fetch TMDB detail with timeout protection
 */
async function fetchTMDBDetail(type: string, tmdbId: number) {
  const TMDB_API_KEY = getTmdbApiKey();
  const detailUrl = `${TMDB_BASE_URL}/${type}/${tmdbId}?api_key=${TMDB_API_KEY}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(detailUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

/**
 * Fetch all seasons for a TV series in parallel and return episode data
 */
async function fetchSeasonsEpisodes(tmdbId: number, totalSeasons: number) {
  const allEpisodes: any[] = [];

  // Fetch all seasons in parallel
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

/**
 * GET - Get sync status and statistics
 */
export async function GET(request: Request) {
  try {
    // 🔐 Admin authentication required for sync status
    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Get sync statistics - run all counts in parallel
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [
        totalSeries,
        totalMovies,
        seriesNeedingSync,
        moviesNeedingSync,
        ongoingSeries,
        endedSeries,
      ] = await Promise.all([
        db.series.count({ where: { tmdbId: { not: null } } }),
        db.movie.count({ where: { tmdbId: { not: null } } }),
        db.series.count({
          where: {
            tmdbId: { not: null },
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: oneDayAgo } }
            ]
          }
        }),
        db.movie.count({
          where: {
            tmdbId: { not: null },
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: oneDayAgo } }
            ]
          }
        }),
        db.series.count({
          where: {
            tmdbId: { not: null },
            tmdbStatus: { in: ['Returning', 'In Production', 'Planned'] }
          }
        }),
        db.series.count({
          where: {
            tmdbId: { not: null },
            tmdbStatus: 'Ended'
          }
        }),
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          totalSeries,
          totalMovies,
          seriesNeedingSync,
          moviesNeedingSync,
          ongoingSeries,
          endedSeries,
          lastSyncAvailable: oneDayAgo.toISOString()
        }
      });
    }

    if (action === 'pending') {
      // Get list of items needing sync - run in parallel
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [series, movies] = await Promise.all([
        db.series.findMany({
          where: {
            tmdbId: { not: null },
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: oneDayAgo } }
            ]
          },
          select: {
            id: true,
            tmdbId: true,
            title: true,
            lastSyncedAt: true,
            tmdbStatus: true,
            seasons: true,
            totalEpisodes: true
          },
          take: 50
        }),
        db.movie.findMany({
          where: {
            tmdbId: { not: null },
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: oneDayAgo } }
            ]
          },
          select: {
            id: true,
            tmdbId: true,
            title: true,
            lastSyncedAt: true,
            rating: true
          },
          take: 50
        }),
      ]);

      return NextResponse.json({
        success: true,
        pending: { series, movies }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Sync status error:', error);
    return NextResponse.json({
      success: false,
      error: sanitizeError(error, 'Failed to get sync status'),
    }, { status: 500 });
  }
}

/**
 * POST - Run sync operation
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('=== TMDB Sync Started (Optimized) ===');

  try {
    // Auth check - allow CRON_SECRET for Vercel cron jobs, or admin auth for manual calls
    const cronSecret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('cron_secret');
    const isCronRequest = cronSecret && cronSecret === process.env.CRON_SECRET;

    if (!isCronRequest) {
      const authResult = validateAdminAuth(request as NextRequest);
      if (!authResult.authorized) return authResult.response!;
    }

    const body = await request.json().catch(() => ({}));
    const {
      type = 'all', // 'series', 'movies', 'all'
      limit = 20,   // Max items to sync per run
      force = false, // Force sync even if recently synced
      skipDescription = true // Default: Skip description update to preserve manual edits
    } = body;

    const results: SyncResult[] = [];
    const errors: any[] = [];

    // Calculate threshold date
    const thresholdDate = force
      ? new Date()
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Sync Series
    if (type === 'series' || type === 'all') {
      const seriesToSync = await db.series.findMany({
        where: {
          tmdbId: { not: null },
          ...(force ? {} : {
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: thresholdDate } }
            ]
          })
        },
        select: {
          id: true,
          tmdbId: true,
          title: true,
          seasons: true,
          totalEpisodes: true,
          rating: true,
          poster: true,
          backdrop: true,
          description: true
        },
        take: limit
      });

      console.log(`Found ${seriesToSync.length} series to sync`);

      // FIX: Fetch TMDB details for all series in parallel (batch of 5)
      const SERIES_BATCH = 5;
      for (let i = 0; i < seriesToSync.length; i += SERIES_BATCH) {
        const batch = seriesToSync.slice(i, i + SERIES_BATCH);

        const detailPromises = batch.map(async (series) => {
          try {
            const tmdbData = await fetchTMDBDetail('tv', series.tmdbId!);
            return { series, tmdbData };
          } catch {
            errors.push({ id: series.id, tmdbId: series.tmdbId, error: 'TMDB fetch failed' });
            return { series, tmdbData: null };
          }
        });

        const detailResults = await Promise.all(detailPromises);

        for (const { series, tmdbData } of detailResults) {
          if (!tmdbData) continue;

          try {
            const changes: string[] = [];
            let newEpisodes = 0;

            // Check for metadata changes
            const newRating = tmdbData.vote_average || 0;
            if (Math.abs(newRating - series.rating) > 0.1) {
              changes.push(`rating: ${series.rating.toFixed(1)} → ${newRating.toFixed(1)}`);
            }

            const newSeasons = tmdbData.number_of_seasons || 0;
            if (newSeasons !== series.seasons) {
              changes.push(`seasons: ${series.seasons} → ${newSeasons}`);
            }

            const newTotalEpisodes = tmdbData.number_of_episodes || 0;
            if (newTotalEpisodes !== series.totalEpisodes) {
              changes.push(`totalEpisodes: ${series.totalEpisodes} → ${newTotalEpisodes}`);
            }

            // Get status
            const status = tmdbData.status || 'Unknown';

            // Update series metadata
            await db.series.update({
              where: { id: series.id },
              data: {
                rating: newRating,
                seasons: newSeasons,
                totalEpisodes: newTotalEpisodes,
                poster: tmdbData.poster_path
                  ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                  : series.poster || PLACEHOLDER,
                backdrop: tmdbData.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
                  : series.backdrop || PLACEHOLDER,
                // Only update description if skipDescription is false
                ...(skipDescription ? {} : { description: tmdbData.overview || series.description }),
                genres: tmdbData.genres?.map((g: { name: string }) => g.name).join(',') || '',
                tmdbStatus: status,
                lastSyncedAt: new Date()
              }
            });

            // Check for new episodes - OPTIMIZED with batch operations
            if (newSeasons > 0) {
              // FIX: Use count query instead of fetching all existing episodes
              const existingEpisodeCount = await db.episode.count({
                where: { seriesId: series.id }
              });

              if (newTotalEpisodes > existingEpisodeCount) {
                // FIX: Fetch all seasons in parallel, then batch insert
                const allEpisodes = await fetchSeasonsEpisodes(series.tmdbId!, newSeasons);

                if (allEpisodes.length > 0) {
                  // FIX: Get existing episodes in batch to avoid N+1 findFirst queries
                  const existingEpisodes = await db.episode.findMany({
                    where: { seriesId: series.id },
                    select: { season: true, episode: true },
                  });

                  // Create a Set for O(1) lookup
                  const existingKeySet = new Set(
                    existingEpisodes.map(ep => `${ep.season}-${ep.episode}`)
                  );

                  // Filter out existing episodes
                  const newEpisodesData = allEpisodes.filter(ep =>
                    !existingKeySet.has(`${ep.season}-${ep.episode}`)
                  ).map(ep => ({
                    ...ep,
                    seriesId: series.id,
                  }));

                  if (newEpisodesData.length > 0) {
                    // FIX: Batch insert using createMany instead of N individual create calls
                    try {
                      const insertResult = await db.episode.createMany({
                        data: newEpisodesData,
                        skipDuplicates: true,
                      });
                      newEpisodes = insertResult.count;
                    } catch (batchError) {
                      console.error(`Batch episode insert failed for ${series.title}:`, batchError);
                    }
                  }
                }

                if (newEpisodes > 0) {
                  changes.push(`+${newEpisodes} new episodes`);
                }
              }
            }

            results.push({
              type: 'series',
              id: series.id,
              tmdbId: series.tmdbId!,
              title: series.title,
              changes,
              newEpisodes
            });

            console.log(`✓ Synced: ${series.title} (${changes.length > 0 ? changes.join(', ') : 'no changes'})`);

          } catch (seriesError: any) {
            console.error(`Error syncing series ${series.title}:`, seriesError?.message);
            errors.push({
              id: series.id,
              tmdbId: series.tmdbId,
              title: series.title,
              error: seriesError?.message || 'Sync failed'
            });
          }
        }
      }
    }

    // Sync Movies
    if (type === 'movies' || type === 'all') {
      const moviesToSync = await db.movie.findMany({
        where: {
          tmdbId: { not: null },
          ...(force ? {} : {
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: thresholdDate } }
            ]
          })
        },
        select: {
          id: true,
          tmdbId: true,
          title: true,
          rating: true,
          poster: true,
          backdrop: true,
          description: true,
          imdbRating: true
        },
        take: limit
      });

      console.log(`Found ${moviesToSync.length} movies to sync`);

      // FIX: Fetch TMDB details for all movies in parallel (batch of 5)
      const MOVIE_BATCH = 5;
      for (let i = 0; i < moviesToSync.length; i += MOVIE_BATCH) {
        const batch = moviesToSync.slice(i, i + MOVIE_BATCH);

        const detailPromises = batch.map(async (movie) => {
          try {
            const tmdbData = await fetchTMDBDetail('movie', movie.tmdbId!);
            return { movie, tmdbData };
          } catch {
            errors.push({ id: movie.id, tmdbId: movie.tmdbId, error: 'TMDB fetch failed' });
            return { movie, tmdbData: null };
          }
        });

        const detailResults = await Promise.all(detailPromises);

        for (const { movie, tmdbData } of detailResults) {
          if (!tmdbData) continue;

          try {
            const changes: string[] = [];

            // Check for metadata changes
            const newRating = tmdbData.vote_average || 0;
            if (Math.abs(newRating - movie.rating) > 0.1) {
              changes.push(`rating: ${movie.rating.toFixed(1)} → ${newRating.toFixed(1)}`);
            }

            // Update movie metadata
            await db.movie.update({
              where: { id: movie.id },
              data: {
                rating: newRating,
                imdbRating: newRating,
                poster: tmdbData.poster_path
                  ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
                  : movie.poster || PLACEHOLDER,
                backdrop: tmdbData.backdrop_path
                  ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
                  : movie.backdrop || PLACEHOLDER,
                // Only update description if skipDescription is false
                ...(skipDescription ? {} : { description: tmdbData.overview || movie.description }),
                genres: tmdbData.genres?.map((g: { name: string }) => g.name).join(',') || '',
                duration: tmdbData.runtime || 0,
                lastSyncedAt: new Date()
              }
            });

            results.push({
              type: 'movie',
              id: movie.id,
              tmdbId: movie.tmdbId!,
              title: movie.title,
              changes
            });

            console.log(`✓ Synced: ${movie.title} (${changes.length > 0 ? changes.join(', ') : 'no changes'})`);

          } catch (movieError: any) {
            console.error(`Error syncing movie ${movie.title}:`, movieError?.message);
            errors.push({
              id: movie.id,
              tmdbId: movie.tmdbId,
              title: movie.title,
              error: movieError?.message || 'Sync failed'
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`=== Sync Complete: ${results.length} items in ${duration}ms ===`);

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        synced: results.length,
        errors: errors.length,
        duration: `${duration}ms`,
        newEpisodesTotal: results.reduce((sum, r) => sum + (r.newEpisodes || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: sanitizeError(error, 'Sync failed'),
    }, { status: 500 });
  }
}
