// ISR: revalidate every 5 minutes instead of force-dynamic
export const revalidate = 300;

import { NextResponse } from 'next/server';
import { dbRead } from '@/lib/db';
import { getCachedMovieList } from '@/lib/cache';

// Placeholder image for missing posters
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// MINIMAL data for Admin Dashboard - only essential fields
function normalizeMovieMinimal(m: any) {
  return {
    id: m.id,
    title: m.title || 'Unknown',
    year: m.year || 0,
    rating: m.rating || 0,
    poster: m.poster || PLACEHOLDER,
    tmdbId: m.tmdbId || null,
    updatedAt: m.updatedAt || null,
    genres: m.genres || '',
  };
}

// FULL movie data for detail pages
function normalizeMovie(m: any) {
  return {
    id: m.id,
    title: m.title || 'Unknown',
    year: m.year || 0,
    rating: m.rating || 0,
    duration: m.duration || 0,
    poster: m.poster || PLACEHOLDER,
    backdrop: m.backdrop || m.poster || PLACEHOLDER,
    description: m.description || '',
    genres: m.genres || '',
    tags: m.tags || '',
    collections: m.collections || '',
    quality4k: Boolean(m.quality4k),
    quality: m.quality || '',
    director: m.director || '',
    fileSize: m.fileSize || '',
    format: m.format || '',
    subtitle: m.subtitle || '',
    imdbRating: m.imdbRating || 0,
    rtRating: m.rtRating || 0,
    tmdbId: m.tmdbId || null,
    updatedAt: m.updatedAt || null,
    casts: Array.isArray(m.casts) ? m.casts : [],
    downloadLinks: Array.isArray(m.downloadLinks)
      ? m.downloadLinks.map((d: any) => ({
          id: d.id,
          server: d.server || 'Server 1',
          quality: d.quality || '',
          url: d.url || '',
          size: d.size || null,
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
    // For card mode, select only card display fields (no casts/downloadLinks - saves network transfer)
    let selectFields: any = undefined;
    let includeFields: any = undefined;
    let normalizeFn: any = normalizeMovie;

    if (minimal) {
      selectFields = {
        id: true, title: true, year: true, rating: true, poster: true,
        tmdbId: true, updatedAt: true, genres: true,
      };
      normalizeFn = normalizeMovieMinimal;
    } else if (card) {
      selectFields = {
        id: true, title: true, year: true, rating: true, poster: true,
        genres: true, quality4k: true, quality: true, tags: true,
      };
      normalizeFn = (m: any) => ({
        id: m.id, title: m.title || 'Unknown', year: m.year || 0, rating: m.rating || 0,
        poster: m.poster || PLACEHOLDER, genres: m.genres || '',
        quality4k: Boolean(m.quality4k), quality: m.quality || '', tags: m.tags || '',
      });
    } else {
      includeFields = {
        casts: { take: 10 },
        downloadLinks: true,
      };
    }

    // Use cached query — avoids hitting Neon DB on every request
    const { totalCount, dbResult } = await getCachedMovieList(
      whereClause,
      selectFields,
      includeFields,
      limit,
      offset,
    );

    const movies = dbResult.map(normalizeFn);

    return NextResponse.json(
      {
        movies,
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
    console.error('Error fetching movies:', error?.message || error);
    return NextResponse.json(
      { movies: [], total: 0, hasMore: false, error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}
