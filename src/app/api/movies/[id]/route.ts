// ISR: revalidate every 10 minutes instead of force-dynamic
export const revalidate = 600;

import { NextResponse, NextRequest } from 'next/server';
import { validateAdminAuth, isValidDownloadUrl, sanitizeError } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { getCachedMovieDetail, getCachedSimilarMovies, getCachedMovieBySlug, getUncachedMovieDetail, isCuid, invalidateMovieCache } from '@/lib/cache';
import { safeRead } from '@/lib/db';

// Placeholder image for missing posters
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// Normalize movie data
function normalizeMovie(m: any) {
  return {
    id: m.id || '',
    title: m.title || 'Unknown Title',
    year: typeof m.year === 'number' ? m.year : 0,
    rating: typeof m.rating === 'number' ? m.rating : 0,
    duration: typeof m.duration === 'number' ? m.duration : 0,
    poster: m.poster || PLACEHOLDER,
    backdrop: m.backdrop || m.poster || PLACEHOLDER,
    description: m.description || m.review || '',
    review: m.review || m.description || '',
    genres: m.genres || '',
    tags: m.tags || '',
    collections: m.collections || '',
    quality4k: Boolean(m.quality4k),
    director: m.director || '',
    fileSize: m.fileSize || '',
    quality: m.quality || '',
    format: m.format || '',
    subtitle: m.subtitle || '',
    imdbRating: typeof m.imdbRating === 'number' ? m.imdbRating : 0,
    rtRating: typeof m.rtRating === 'number' ? m.rtRating : 0,
    tmdbId: m.tmdbId || null,
    casts: Array.isArray(m.casts) ? m.casts : [],
    downloadLinks: Array.isArray(m.downloadLinks)
      ? m.downloadLinks.map((d: any) => ({
          id: d.id || '',
          server: d.server || 'Server 1',
          quality: d.quality || '',
          url: d.url || '',
          size: d.size || null,
        }))
      : [],
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    console.log('Fetching movie with ID:', id);

    // Check if admin wants fresh data (bypass cache)
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get('_nocache') === '1';

    let movie: any = null;

    // Try to fetch from database
    try {
      let dbMovie: any = null;

      if (bypassCache) {
        // Admin edit page: always get latest data directly from database
        dbMovie = isCuid(id) ? await getUncachedMovieDetail(id) : null;
        if (!dbMovie) {
          // Try slug lookup with uncached query
          const slugTitle = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          dbMovie = await safeRead(client => client.movie.findFirst({
            where: { title: { equals: slugTitle, mode: 'insensitive' } },
            include: { casts: true, downloadLinks: true },
          }));
          if (!dbMovie) {
            dbMovie = await safeRead(client => client.movie.findFirst({
              where: { title: { contains: slugTitle, mode: 'insensitive' } },
              include: { casts: true, downloadLinks: true },
            }));
          }
        }
      } else {
        // Public request: use cached query for performance
        dbMovie = isCuid(id) ? await getCachedMovieDetail(id) : null;
        if (!dbMovie) {
          dbMovie = await getCachedMovieBySlug(id);
        }
      }

      if (dbMovie) {
        movie = normalizeMovie(dbMovie);
        console.log('Found database movie:', movie?.title);
      }

      // Get similar movies (uses cached query)
      const movieGenres = (movie.genres || '').split(',').filter(Boolean).map((g: string) => g.trim());
      let similarMovies: any[] = [];

      if (movieGenres.length > 0) {
        const genreConditions = movieGenres.map((g: string) => ({
          genres: { contains: g.trim(), mode: 'insensitive' as const },
        }));

        const dbSimilar = await getCachedSimilarMovies(id, genreConditions);

        // Score and sort by genre relevance
        const genresLower = movieGenres.map((g: string) => g.toLowerCase());
        similarMovies = dbSimilar
          .map((m: any) => {
            const mGenres = (m.genres || '').split(',').filter(Boolean).map((g: string) => g.trim().toLowerCase());
            const matchingGenres = genresLower.filter((g: string) => mGenres.includes(g)).length;
            return { ...m, relevance: matchingGenres };
          })
          .sort((a: any, b: any) => {
            if (b.relevance !== a.relevance) return b.relevance - a.relevance;
            return (b.rating || 0) - (a.rating || 0);
          })
          .slice(0, 6)
          .map(({ relevance, ...m }: any) => m);
      }

      if (!movie) {
        console.log('Movie not found:', id);
        return NextResponse.json({ error: 'Movie not found', id }, { status: 404 });
      }

      console.log('Returning movie:', movie.title, 'with', similarMovies.length, 'similar movies');

      return NextResponse.json({
        movie,
        similarMovies,
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      });
    } catch (dbError: any) {
      console.log('Database error:', dbError?.message || 'Unknown error');
      return NextResponse.json({ error: 'Movie not found', id }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to fetch movie') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    // Rate limiting - admin write: 60 per minute per user
    const rateLimitResult = checkRateLimit(authResult.username || getClientIp(request), RATE_LIMITS.ADMIN_WRITE);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    console.log('Deleting movie with ID:', id);

    // Import db directly for mutations (not cached)
    const { db } = await import('@/lib/db');

    // Delete related records and movie in a transaction
    await db.$transaction(async (tx) => {
      await tx.downloadLink.deleteMany({ where: { movieId: id } });
      await tx.cast.deleteMany({ where: { movieId: id } });
      await tx.movie.delete({ where: { id } });
    });

    // Invalidate cache after mutation
    invalidateMovieCache(id);

    console.log('Movie deleted successfully:', id);

    return NextResponse.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting movie:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to delete movie') },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = validateAdminAuth(request as NextRequest);
    if (!authResult.authorized) return authResult.response!;

    // Rate limiting - admin write: 60 per minute per user
    const rateLimitResult = checkRateLimit(authResult.username || getClientIp(request), RATE_LIMITS.ADMIN_WRITE);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    console.log('Updating movie with ID:', id, 'with downloadLinks:', body.downloadLinks?.length || 0);

    // Import db directly for mutations (not cached)
    const { db } = await import('@/lib/db');

    // Update movie and handle download links in a transaction
    const updatedMovie = await db.$transaction(async (tx) => {
      // Delete existing download links for this movie
      await tx.downloadLink.deleteMany({
        where: { movieId: id },
      });

      // Update movie and create new download links
      const movie = await tx.movie.update({
        where: { id },
        data: {
          title: body.title,
          year: body.year,
          rating: body.rating,
          duration: body.duration,
          poster: body.poster,
          backdrop: body.backdrop,
          description: body.description,
          review: body.review,
          genres: body.genres,
          tags: body.tags,
          collections: body.collections,
          quality4k: body.quality4k,
          director: body.director,
          fileSize: body.fileSize,
          quality: body.quality,
          format: body.format,
          subtitle: body.subtitle,
          imdbRating: body.imdbRating,
          rtRating: body.rtRating,
          // Create new download links if provided
          downloadLinks: body.downloadLinks && Array.isArray(body.downloadLinks) ? {
            create: body.downloadLinks.map((link: any) => ({
              server: link.server || 'Server 1',
              quality: link.quality || '',
              url: isValidDownloadUrl(link.url) ? link.url : '',
              size: link.size || null,
            })),
          } : undefined,
        },
        include: {
          casts: true,
          downloadLinks: true,
        },
      });

      return movie;
    });

    // Invalidate cache after mutation
    invalidateMovieCache(id);

    console.log('Movie updated successfully:', id, 'with', updatedMovie.downloadLinks?.length || 0, 'download links');

    return NextResponse.json({ success: true, movie: normalizeMovie(updatedMovie) });
  } catch (error: any) {
    console.error('Error updating movie:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: sanitizeError(error, 'Failed to update movie') },
      { status: 500 }
    );
  }
}
