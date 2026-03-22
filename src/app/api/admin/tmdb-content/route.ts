import { NextResponse } from 'next/server';
import { getTMDBMovies, getTMDBSeries, deleteTMDBMovie, deleteTMDBSeries } from '@/lib/data-store';

// GET - List all TMDB imported content
export async function GET() {
  try {
    const movies = getTMDBMovies();
    const series = getTMDBSeries();
    
    return NextResponse.json({
      movies: movies.map(m => ({
        id: m.id,
        title: m.title,
        year: m.year,
        poster: m.poster,
        createdAt: m.createdAt,
      })),
      series: series.map(s => ({
        id: s.id,
        title: s.title,
        year: s.year,
        poster: s.poster,
        createdAt: s.createdAt,
      })),
      movieCount: movies.length,
      seriesCount: series.length,
    });
  } catch (error) {
    console.error('Error fetching TMDB content:', error);
    return NextResponse.json({ error: 'Failed to fetch TMDB content' }, { status: 500 });
  }
}

// DELETE - Delete all or specific TMDB content
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'movies', 'series', or 'all'
    const id = searchParams.get('id'); // specific ID to delete
    
    let deletedMovies = 0;
    let deletedSeries = 0;
    
    if (id) {
      // Delete specific item
      const movieDeleted = deleteTMDBMovie(id);
      const seriesDeleted = deleteTMDBSeries(id);
      
      if (movieDeleted) deletedMovies = 1;
      if (seriesDeleted) deletedSeries = 1;
    } else {
      // Delete by type
      if (type === 'movies' || type === 'all') {
        const movies = getTMDBMovies();
        for (const movie of movies) {
          if (deleteTMDBMovie(movie.id)) {
            deletedMovies++;
          }
        }
      }
      
      if (type === 'series' || type === 'all') {
        const series = getTMDBSeries();
        for (const s of series) {
          if (deleteTMDBSeries(s.id)) {
            deletedSeries++;
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      deletedMovies,
      deletedSeries,
      message: `Deleted ${deletedMovies} movies and ${deletedSeries} series`,
    });
  } catch (error) {
    console.error('Error deleting TMDB content:', error);
    return NextResponse.json({ error: 'Failed to delete TMDB content' }, { status: 500 });
  }
}
