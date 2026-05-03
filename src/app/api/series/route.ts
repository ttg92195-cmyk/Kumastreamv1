export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Placeholder image for missing posters
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// MINIMAL data for Admin Dashboard - only essential fields
function normalizeSeriesMinimal(s: any) {
  return {
    id: s.id,
    title: s.title || 'Unknown',
    year: s.year || 0,
    rating: s.rating || 0,
    poster: s.poster || PLACEHOLDER,
    tmdbId: s.tmdbId || null,
    updatedAt: s.updatedAt || null,
    genres: s.genres || '',
  };
}

// Normalize series data for list view (minimal)
function normalizeSeriesList(s: any) {
  return {
    id: s.id,
    title: s.title || 'Unknown',
    year: s.year || 0,
    rating: s.rating || 0,
    poster: s.poster || PLACEHOLDER,
    backdrop: s.backdrop || s.poster || PLACEHOLDER,
    description: s.description || '',
    genres: s.genres || '',
    tags: s.tags || '',
    collections: s.collections || '',
    quality4k: Boolean(s.quality4k),
    quality: s.quality || '',
    seasons: s.seasons || 0,
    totalEpisodes: s.totalEpisodes || 0,
    imdbRating: s.imdbRating || 0,
    tmdbId: s.tmdbId || null,
    updatedAt: s.updatedAt || null,
  };
}

// Normalize series data for detail view (full)
function normalizeSeriesDetail(s: any) {
  return {
    id: s.id,
    title: s.title || 'Unknown',
    year: s.year || 0,
    rating: s.rating || 0,
    poster: s.poster || PLACEHOLDER,
    backdrop: s.backdrop || s.poster || PLACEHOLDER,
    description: s.description || '',
    genres: s.genres || '',
    tags: s.tags || '',
    collections: s.collections || '',
    quality4k: Boolean(s.quality4k),
    quality: s.quality || '',
    seasons: s.seasons || 0,
    totalEpisodes: s.totalEpisodes || 0,
    casts: Array.isArray(s.casts) ? s.casts : [],
    episodes: Array.isArray(s.episodes)
      ? s.episodes.map((ep: any) => ({
          id: ep.id,
          season: ep.season || 0,
          episode: ep.episode || 0,
          title: ep.title || `Episode ${ep.episode}`,
          duration: ep.duration || 0,
          fileSize: ep.fileSize || null,
          quality: ep.quality || null,
          format: ep.format || null,
          downloadLinks: Array.isArray(ep.downloadLinks)
            ? ep.downloadLinks.map((d: any) => ({
                server: d.server || 'Server 1',
                quality: d.quality || '',
                url: d.url || '',
                size: d.size || null,
              }))
            : [],
        }))
      : [],
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const collection = searchParams.get('collection');
    const year = searchParams.get('year');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 20;
    const offset = parseInt(searchParams.get('offset') || '0');
    const detail = searchParams.get('detail') === 'true';
    const minimal = searchParams.get('minimal') === 'true'; // For admin dashboard
    const card = searchParams.get('card') === 'true'; // For home/list pages (card view only)

    // Build where clause
    const conditions: any[] = [];

    if (genre) {
      conditions.push({ genres: { contains: genre, mode: 'insensitive' } });
    }

    if (search) {
      conditions.push({ title: { contains: search, mode: 'insensitive' } });
    }

    if (tag) {
      conditions.push({ tags: { contains: tag, mode: 'insensitive' } });
    }

    if (collection) {
      conditions.push({ collections: { contains: collection, mode: 'insensitive' } });
    }

    if (year) {
      conditions.push({ year: parseInt(year) });
    }

    const whereClause = conditions.length > 0 ? { AND: conditions } : {};

    // For minimal mode, only select needed fields (much faster)
    // For card mode, select only card display fields (no casts/episodes/downloadLinks - saves network transfer)
    let selectFields: any = undefined;
    let normalizeFn: any = normalizeSeriesList;

    if (minimal) {
      selectFields = {
        id: true, title: true, year: true, rating: true, poster: true,
        tmdbId: true, updatedAt: true, genres: true,
      };
      normalizeFn = normalizeSeriesMinimal;
    } else if (card) {
      selectFields = {
        id: true, title: true, year: true, rating: true, poster: true,
        genres: true, quality4k: true, quality: true, tags: true,
        seasons: true, totalEpisodes: true,
      };
      normalizeFn = (s: any) => ({
        id: s.id, title: s.title || 'Unknown', year: s.year || 0, rating: s.rating || 0,
        poster: s.poster || PLACEHOLDER, genres: s.genres || '',
        quality4k: Boolean(s.quality4k), quality: s.quality || '', tags: s.tags || '',
        seasons: s.seasons || 0, totalEpisodes: s.totalEpisodes || 0,
      });
    } else if (detail) {
      normalizeFn = normalizeSeriesDetail;
    }

    // Determine include based on mode
    let includeFields: any = undefined;
    if (!minimal && !card && !detail) {
      // Default list mode: no includes (just basic series info)
      includeFields = undefined;
    } else if (detail) {
      includeFields = {
        casts: { take: 10 },
        episodes: {
          orderBy: [{ season: 'asc' }, { episode: 'asc' }],
          include: { downloadLinks: true },
        },
      };
    }

    // Get total count and paginated results in parallel
    const [totalCount, dbResult] = await Promise.all([
      db.series.count({ where: whereClause }),
      db.series.findMany({
        where: whereClause,
        select: selectFields || undefined,
        include: includeFields,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    const series = dbResult.map(normalizeFn);

    return NextResponse.json(
      {
        series,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching series:', error?.message || error);
    return NextResponse.json(
      { series: [], total: 0, hasMore: false, error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}
