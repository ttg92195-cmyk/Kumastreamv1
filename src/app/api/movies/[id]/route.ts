export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    let movie: any = null;

    // Try to fetch from database
    try {
      const dbMovie = await db.movie.findUnique({
        where: { id },
        include: {
          casts: true,
          downloadLinks: true,
        },
      });

      if (dbMovie) {
        movie = normalizeMovie(dbMovie);
        console.log('Found database movie:', movie?.title);
      }

      // Get MINIMAL data for similar movies calculation (NOT all data!)
      // Only select fields needed for display, exclude heavy fields like description, casts, downloadLinks
      const dbMovies = await db.movie.findMany({
        select: {
          id: true,
          title: true,
          year: true,
          rating: true,
          poster: true,
          genres: true,
          quality4k: true,
          quality: true,
        },
      });

      const allMovies = dbMovies;

      if (!movie) {
        console.log('Movie not found:', id);
        return NextResponse.json({ error: 'Movie not found', id }, { status: 404 });
      }

      // Get similar movies based on genres
      const genres = (movie.genres || '').split(',').filter(Boolean);
      const similarMovies = allMovies
        .filter((m: any) => m.id !== id && genres.some((g: string) => m.genres && m.genres.includes(g.trim())))
        .slice(0, 6);

      console.log('Returning movie:', movie.title, 'with', similarMovies.length, 'similar movies');

      return NextResponse.json({
        movie,
        similarMovies,
      });
    } catch (dbError: any) {
      console.log('Database error:', dbError?.message || 'Unknown error');
      return NextResponse.json({ error: 'Movie not found', id }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movie', details: error?.message || 'Unknown error' },
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

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    console.log('Deleting movie with ID:', id);

    // First delete related records
    await db.downloadLink.deleteMany({
      where: { movieId: id },
    });

    await db.cast.deleteMany({
      where: { movieId: id },
    });

    // Then delete the movie
    await db.movie.delete({
      where: { id },
    });

    console.log('Movie deleted successfully:', id);

    return NextResponse.json({ success: true, message: 'Movie deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting movie:', error);
    
    // Handle case where movie doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete movie', details: error?.message || 'Unknown error' },
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
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 });
    }

    console.log('Updating movie with ID:', id, 'with downloadLinks:', body.downloadLinks?.length || 0);

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
              url: link.url || '',
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

    console.log('Movie updated successfully:', id, 'with', updatedMovie.downloadLinks?.length || 0, 'download links');

    return NextResponse.json({ success: true, movie: normalizeMovie(updatedMovie) });
  } catch (error: any) {
    console.error('Error updating movie:', error);

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update movie', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
