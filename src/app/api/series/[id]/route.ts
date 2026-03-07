import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Placeholder image for missing posters
const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// Normalize series data
function normalizeSeries(s: any) {
  return {
    id: s.id || '',
    title: s.title || 'Unknown Title',
    year: typeof s.year === 'number' ? s.year : 0,
    rating: typeof s.rating === 'number' ? s.rating : 0,
    poster: s.poster || PLACEHOLDER,
    backdrop: s.backdrop || s.poster || PLACEHOLDER,
    description: s.description || '',
    genres: s.genres || '',
    tags: s.tags || '',
    collections: s.collections || '',
    quality4k: Boolean(s.quality4k),
    quality: s.quality || '',
    seasons: typeof s.seasons === 'number' ? s.seasons : 0,
    totalEpisodes: typeof s.totalEpisodes === 'number' ? s.totalEpisodes : 0,
    tmdbId: s.tmdbId || null,
    casts: Array.isArray(s.casts) ? s.casts : [],
    episodes: Array.isArray(s.episodes)
      ? s.episodes.map((ep: any) => ({
          id: ep.id || '',
          season: typeof ep.season === 'number' ? ep.season : 0,
          episode: typeof ep.episode === 'number' ? ep.episode : 0,
          title: ep.title || `Episode ${ep.episode}`,
          duration: typeof ep.duration === 'number' ? ep.duration : 0,
          fileSize: ep.fileSize || '',
          quality: ep.quality || '',
          format: ep.format || '',
          downloadLinks: Array.isArray(ep.downloadLinks)
            ? ep.downloadLinks.map((d: any) => ({
                id: d.id || '',
                server: d.server || 'Server 1',
                quality: d.quality || '',
                url: d.url || '',
                size: d.size || null,
              }))
            : [],
        }))
      : [],
    downloadLinks: Array.isArray(s.downloadLinks)
      ? s.downloadLinks.map((d: any) => ({
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
      return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
    }

    console.log('Fetching series with ID:', id);

    let series: any = null;
    let allSeries: any[] = [];

    // Try to fetch from database
    try {
      const dbSeries = await db.series.findUnique({
        where: { id },
        include: {
          casts: true,
          episodes: {
            orderBy: [{ season: 'asc' }, { episode: 'asc' }],
            include: {
              downloadLinks: true,
            },
          },
          downloadLinks: true,
        },
      });

      if (dbSeries) {
        series = normalizeSeries(dbSeries);
        console.log('Found database series:', series?.title);
      }

      // Get all series for similar series calculation
      const dbAllSeries = await db.series.findMany({
        include: {
          casts: true,
          episodes: {
            orderBy: [{ season: 'asc' }, { episode: 'asc' }],
            include: {
              downloadLinks: true,
            },
          },
          downloadLinks: true,
        },
      });

      allSeries = dbAllSeries.map(normalizeSeries);

      if (!series) {
        console.log('Series not found:', id);
        return NextResponse.json({ error: 'Series not found', id }, { status: 404 });
      }

      // Group episodes by season
      const episodesBySeason = (series.episodes || []).reduce(
        (acc: Record<number, any[]>, ep: any) => {
          if (!acc[ep.season]) {
            acc[ep.season] = [];
          }
          acc[ep.season].push(ep);
          return acc;
        },
        {} as Record<number, typeof series.episodes>
      );

      // Get similar series based on genres
      const genres = (series.genres || '').split(',').filter(Boolean);
      const similarSeries = allSeries
        .filter((s: any) => s.id !== id && genres.some((g: string) => s.genres && s.genres.includes(g.trim())))
        .slice(0, 6);

      console.log('Returning series:', series.title, 'with', similarSeries.length, 'similar series');

      return NextResponse.json({
        series,
        episodesBySeason,
        similarSeries,
      });
    } catch (dbError: any) {
      console.log('Database error:', dbError?.message || 'Unknown error');
      return NextResponse.json({ error: 'Series not found', id }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series', details: error?.message || 'Unknown error' },
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
      return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
    }

    console.log('Deleting series with ID:', id);

    // Get all episodes for this series
    const episodes = await db.episode.findMany({
      where: { seriesId: id },
      select: { id: true },
    });

    const episodeIds = episodes.map(ep => ep.id);

    // Delete episode download links
    await db.downloadLink.deleteMany({
      where: { episodeId: { in: episodeIds } },
    });

    // Delete episodes
    await db.episode.deleteMany({
      where: { seriesId: id },
    });

    // Delete series download links
    await db.downloadLink.deleteMany({
      where: { seriesId: id },
    });

    // Delete casts
    await db.cast.deleteMany({
      where: { seriesId: id },
    });

    // Then delete the series
    await db.series.delete({
      where: { id },
    });

    console.log('Series deleted successfully:', id);

    return NextResponse.json({ success: true, message: 'Series deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting series:', error);
    
    // Handle case where series doesn't exist
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete series', details: error?.message || 'Unknown error' },
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
      return NextResponse.json({ error: 'Series ID is required' }, { status: 400 });
    }

    console.log('Updating series with ID:', id, 'with downloadLinks:', body.downloadLinks?.length || 0);

    // Update series and handle download links in a transaction
    const updatedSeries = await db.$transaction(async (tx) => {
      // Delete existing download links for this series
      await tx.downloadLink.deleteMany({
        where: { seriesId: id },
      });

      // Update series and create new download links
      const series = await tx.series.update({
        where: { id },
        data: {
          title: body.title,
          year: body.year,
          rating: body.rating,
          poster: body.poster,
          backdrop: body.backdrop,
          description: body.description,
          genres: body.genres,
          tags: body.tags,
          collections: body.collections,
          quality4k: body.quality4k,
          quality: body.quality,
          seasons: body.seasons,
          totalEpisodes: body.totalEpisodes,
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
          episodes: {
            orderBy: [{ season: 'asc' }, { episode: 'asc' }],
            include: {
              downloadLinks: true,
            },
          },
          downloadLinks: true,
        },
      });

      return series;
    });

    console.log('Series updated successfully:', id, 'with', updatedSeries.downloadLinks?.length || 0, 'download links');

    return NextResponse.json({ success: true, series: normalizeSeries(updatedSeries) });
  } catch (error: any) {
    console.error('Error updating series:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update series', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
