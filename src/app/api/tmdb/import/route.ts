export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '2e928cd76f7f5ae46f6e022f5dcc2612';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Placeholder image
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // First, check database connection
    console.log('=== TMDB Import Started ===');
    console.log('Checking database connection...');
    
    try {
      await db.$connect();
      console.log('Database connected successfully');
    } catch (dbConnectError: any) {
      console.error('Database connection failed:', dbConnectError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: dbConnectError?.message || 'Cannot connect to database. Check if Neon project is active.',
        hint: 'Go to Neon Console and check if your project is SUSPENDED. Resume it if needed.',
      }, { status: 500 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Items array is required and cannot be empty' 
      }, { status: 400 });
    }

    console.log('Items to import:', items.length);

    const importedItems: any[] = [];
    const errors: any[] = [];
    const duplicates: any[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const type = item.type || 'movie';
      
      console.log(`\n[${i + 1}/${items.length}] Processing ${type}: ${item.id}`);

      try {
        // Check if already imported
        if (type === 'movie') {
          const existing = await db.movie.findFirst({
            where: { tmdbId: item.id },
          });
          if (existing) {
            console.log(`  → Already exists: ${existing.title}`);
            duplicates.push({ id: item.id, type, title: existing.title, reason: 'Already imported' });
            continue;
          }
        } else {
          const existing = await db.series.findFirst({
            where: { tmdbId: item.id },
          });
          if (existing) {
            console.log(`  → Already exists: ${existing.title}`);
            duplicates.push({ id: item.id, type, title: existing.title, reason: 'Already imported' });
            continue;
          }
        }

        // Fetch from TMDB
        const detailUrl = `${TMDB_BASE_URL}/${type}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos,external_ids`;
        
        const response = await fetch(detailUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`  → TMDB API error: ${response.status}`);
          errors.push({ id: item.id, type, error: `TMDB API error: ${response.status}` });
          continue;
        }

        const details = await response.json();
        console.log(`  → TMDB data received: ${details.title || details.name}`);

        if (details.success === false) {
          errors.push({ id: item.id, type, error: details.status_message || 'Not found' });
          continue;
        }

        // Create movie or series
        if (type === 'movie') {
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
            include: { casts: true },
          });

          importedItems.push({ id: movie.id, tmdbId: details.id, title: movie.title, type: 'movie' });
          console.log(`  ✓ Movie imported: ${movie.title}`);
        } else {
          // TV Series
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
            include: { casts: true, episodes: true },
          });

          // Fetch and create episodes - Import ALL seasons from TMDB
          console.log(`  → Fetching episodes for ${series.title} (${details.number_of_seasons || 1} seasons)...`);

          const totalSeasons = details.number_of_seasons || 1;
          for (let s = 1; s <= totalSeasons; s++) {
            try {
              const seasonUrl = `${TMDB_BASE_URL}/tv/${details.id}/season/${s}?api_key=${TMDB_API_KEY}`;
              const seasonResponse = await fetch(seasonUrl);

              if (seasonResponse.ok) {
                const seasonData = await seasonResponse.json();
                let episodesCreated = 0;

                for (const ep of (seasonData.episodes || [])) {
                  try {
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
                        format: 'MKV',
                      },
                    });
                    episodesCreated++;
                  } catch (epError) {
                    // Skip duplicate episodes silently
                  }
                }
                console.log(`    → Season ${s}: ${episodesCreated} episodes imported`);
              }
            } catch (seasonError) {
              console.error(`    → Error fetching season ${s}:`, seasonError);
            }
          }

          importedItems.push({ id: series.id, tmdbId: details.id, title: series.title, type: 'tv' });
          console.log(`  ✓ Series imported: ${series.title}`);
        }
      } catch (itemError: any) {
        console.error(`  ✗ Error:`, itemError?.message);
        errors.push({
          id: item.id,
          type,
          error: itemError?.message || 'Import failed',
        });
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
      error: 'Failed to import items',
      details: error?.message || 'Unknown error',
      hint: 'Check if your Neon database is active and not SUSPENDED.',
    }, { status: 500 });
  }
}

// GET all TMDB imported items
export async function GET() {
  try {
    const movies = await db.movie.findMany({
      where: { tmdbId: { not: null } },
      include: { casts: true, downloadLinks: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const series = await db.series.findMany({
      where: { tmdbId: { not: null } },
      include: { 
        casts: true, 
        episodes: { orderBy: [{ season: 'asc' }, { episode: 'asc' }] } 
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const totalMovies = await db.movie.count({ where: { tmdbId: { not: null } } });
    const totalSeries = await db.series.count({ where: { tmdbId: { not: null } } });

    return NextResponse.json({
      movies,
      series,
      totalMovies,
      totalSeries,
    });
  } catch (error: any) {
    console.error('Error fetching TMDB items:', error);
    return NextResponse.json({
      error: 'Failed to fetch TMDB items',
      details: error?.message || 'Unknown error',
      hint: 'Check if your Neon database is active.',
    }, { status: 500 });
  }
}

// DELETE an item
export async function DELETE(request: Request) {
  try {
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
      error: 'Failed to delete item',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}

// PUT - Check which TMDB IDs are already imported
export async function PUT(request: Request) {
  try {
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
      error: 'Failed to check imported items',
      details: error?.message || 'Unknown error',
    }, { status: 500 });
  }
}
