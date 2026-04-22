export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2e928cd76f7f5ae46f6e022f5dcc2612';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
 * GET - Get sync status and statistics
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Get sync statistics
      const totalSeries = await db.series.count({ where: { tmdbId: { not: null } } });
      const totalMovies = await db.movie.count({ where: { tmdbId: { not: null } } });

      // Series not synced in last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const seriesNeedingSync = await db.series.count({
        where: {
          tmdbId: { not: null },
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: oneDayAgo } }
          ]
        }
      });

      const moviesNeedingSync = await db.movie.count({
        where: {
          tmdbId: { not: null },
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: oneDayAgo } }
          ]
        }
      });

      // Get ongoing series count
      const ongoingSeries = await db.series.count({
        where: {
          tmdbId: { not: null },
          tmdbStatus: { in: ['Returning', 'In Production', 'Planned'] }
        }
      });

      // Get ended series count
      const endedSeries = await db.series.count({
        where: {
          tmdbId: { not: null },
          tmdbStatus: 'Ended'
        }
      });

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
      // Get list of items needing sync
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const series = await db.series.findMany({
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
      });

      const movies = await db.movie.findMany({
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
      });

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
      error: 'Failed to get sync status',
      details: error?.message
    }, { status: 500 });
  }
}

/**
 * POST - Run sync operation
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  console.log('=== TMDB Sync Started ===');

  try {
    await db.$connect();

    const body = await request.json().catch(() => ({}));
    const {
      type = 'all', // 'series', 'movies', 'all'
      limit = 20,   // Max items to sync per run
      force = false // Force sync even if recently synced
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

      for (const series of seriesToSync) {
        try {
          const changes: string[] = [];
          let newEpisodes = 0;

          // Fetch latest data from TMDB
          const detailUrl = `${TMDB_BASE_URL}/tv/${series.tmdbId}?api_key=${TMDB_API_KEY}`;
          const response = await fetch(detailUrl);

          if (!response.ok) {
            errors.push({ id: series.id, tmdbId: series.tmdbId, error: `TMDB API error: ${response.status}` });
            continue;
          }

          const tmdbData = await response.json();

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
              description: tmdbData.overview || series.description,
              genres: tmdbData.genres?.map((g: { name: string }) => g.name).join(',') || '',
              tmdbStatus: status,
              lastSyncedAt: new Date()
            }
          });

          // Check for new episodes
          if (newSeasons > 0) {
            // Get existing episode count
            const existingEpisodes = await db.episode.count({
              where: { seriesId: series.id }
            });

            if (newTotalEpisodes > existingEpisodes) {
              // Fetch new episodes
              for (let s = 1; s <= newSeasons; s++) {
                try {
                  const seasonUrl = `${TMDB_BASE_URL}/tv/${series.tmdbId}/season/${s}?api_key=${TMDB_API_KEY}`;
                  const seasonResponse = await fetch(seasonUrl);

                  if (seasonResponse.ok) {
                    const seasonData = await seasonResponse.json();

                    for (const ep of (seasonData.episodes || [])) {
                      // Check if episode exists
                      const existing = await db.episode.findFirst({
                        where: {
                          seriesId: series.id,
                          season: ep.season_number || s,
                          episode: ep.episode_number || 1
                        }
                      });

                      if (!existing) {
                        await db.episode.create({
                          data: {
                            seriesId: series.id,
                            tmdbId: ep.id,
                            season: ep.season_number || s,
                            episode: ep.episode_number || 1,
                            title: ep.name || `Episode ${ep.episode_number}`,
                            duration: ep.runtime || 45,
                            airDate: ep.air_date || null,
                            fileSize: '',
                            quality: '1080p HEVC',
                            format: 'MKV'
                          }
                        });
                        newEpisodes++;
                      }
                    }
                  }
                } catch (seasonError) {
                  console.error(`Error fetching season ${s}:`, seasonError);
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

      for (const movie of moviesToSync) {
        try {
          const changes: string[] = [];

          // Fetch latest data from TMDB
          const detailUrl = `${TMDB_BASE_URL}/movie/${movie.tmdbId}?api_key=${TMDB_API_KEY}`;
          const response = await fetch(detailUrl);

          if (!response.ok) {
            errors.push({ id: movie.id, tmdbId: movie.tmdbId, error: `TMDB API error: ${response.status}` });
            continue;
          }

          const tmdbData = await response.json();

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
              description: tmdbData.overview || movie.description,
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
      error: 'Sync failed',
      details: error?.message
    }, { status: 500 });
  }
}
