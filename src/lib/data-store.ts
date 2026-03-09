// Data store using Prisma with Neon PostgreSQL
import { db } from './db';

// TMDB Movie type for import
export interface TMDBMovieInput {
  tmdbId: number;
  title: string;
  year: number;
  rating: number;
  duration: number;
  poster: string | null;
  backdrop: string | null;
  description: string;
  genres: string;
  quality4k: boolean;
  director: string;
  fileSize: string;
  quality: string;
  format: string;
  subtitle: string;
  imdbRating: number;
  rtRating: number;
  casts: Array<{
    name: string;
    role: string;
    photo: string | null;
  }>;
  downloadLinks: Array<{ quality: string; url: string; size?: string }>;
}

// TMDB Series type for import
export interface TMDBSeriesInput {
  tmdbId: number;
  title: string;
  year: number;
  rating: number;
  poster: string | null;
  backdrop: string | null;
  description: string;
  genres: string;
  quality4k: boolean;
  seasons: number;
  totalEpisodes: number;
  casts: Array<{
    name: string;
    role: string;
    photo: string | null;
  }>;
  episodes: Array<{
    tmdbId?: number;
    season: number;
    episode: number;
    title: string;
    duration: number;
    fileSize: string;
    quality: string;
    format: string;
    downloadLinks?: Array<{ quality: string; url: string; size?: string }>;
  }>;
  downloadLinks?: Array<{ quality: string; url: string; size?: string }>;
}

// Save TMDB movie to database with proper error handling
export async function saveTMDBMovieToDb(input: TMDBMovieInput): Promise<string> {
  try {
    console.log('Saving movie to database:', input.title);

    const movie = await db.movie.create({
      data: {
        tmdbId: input.tmdbId,
        title: input.title || 'Unknown Title',
        year: input.year || 0,
        rating: input.rating || 0,
        duration: input.duration || 0,
        poster: input.poster,
        backdrop: input.backdrop,
        description: input.description || '',
        review: input.description || '', // Use description as review if not provided
        genres: input.genres || '',
        quality4k: input.quality4k || false,
        director: input.director || '',
        fileSize: input.fileSize || '',
        quality: input.quality || '',
        format: input.format || '',
        subtitle: input.subtitle || '',
        imdbRating: input.imdbRating || 0,
        rtRating: input.rtRating || 0,
        casts: {
          create: (input.casts || []).map((c) => ({
            name: c.name || '',
            role: c.role || '',
            photo: c.photo,
          })),
        },
        downloadLinks: {
          create: (input.downloadLinks || []).map((d) => ({
            quality: d.quality || '',
            url: d.url || '',
            size: d.size,
          })),
        },
      },
      include: {
        casts: true,
        downloadLinks: true,
      },
    });

    console.log('Movie saved successfully with ID:', movie.id);
    return movie.id;
  } catch (error) {
    console.error('Error saving movie to database:', error);
    throw new Error(`Failed to save movie: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Save TMDB series to database with proper error handling
export async function saveTMDBSeriesToDb(input: TMDBSeriesInput): Promise<string> {
  try {
    console.log('Saving series to database:', input.title);

    const series = await db.series.create({
      data: {
        tmdbId: input.tmdbId,
        title: input.title || 'Unknown Title',
        year: input.year || 0,
        rating: input.rating || 0,
        poster: input.poster,
        backdrop: input.backdrop,
        description: input.description || '',
        genres: input.genres || '',
        quality4k: input.quality4k || false,
        seasons: input.seasons || 0,
        totalEpisodes: input.totalEpisodes || 0,
        casts: {
          create: (input.casts || []).map((c) => ({
            name: c.name || '',
            role: c.role || '',
            photo: c.photo,
          })),
        },
        episodes: {
          create: (input.episodes || []).map((ep) => ({
            tmdbId: ep.tmdbId,
            season: ep.season || 1,
            episode: ep.episode || 1,
            title: ep.title || `Episode ${ep.episode}`,
            duration: ep.duration || 0,
            fileSize: ep.fileSize || '',
            quality: ep.quality || '',
            format: ep.format || '',
          })),
        },
        downloadLinks: input.downloadLinks
          ? {
              create: input.downloadLinks.map((d) => ({
                quality: d.quality || '',
                url: d.url || '',
                size: d.size,
              })),
            }
          : undefined,
      },
      include: {
        casts: true,
        episodes: true,
        downloadLinks: true,
      },
    });

    console.log('Series saved successfully with ID:', series.id);
    return series.id;
  } catch (error) {
    console.error('Error saving series to database:', error);
    throw new Error(`Failed to save series: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if TMDB movie already exists
export async function tmdbMovieExists(tmdbId: number): Promise<boolean> {
  try {
    const count = await db.movie.count({
      where: { tmdbId },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking movie existence:', error);
    return false;
  }
}

// Check if TMDB series already exists
export async function tmdbSeriesExists(tmdbId: number): Promise<boolean> {
  try {
    const count = await db.series.count({
      where: { tmdbId },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking series existence:', error);
    return false;
  }
}

// Get all TMDB movies with proper field handling
export async function getTMDBMovies(limit = 50, offset = 0) {
  try {
    return await db.movie.findMany({
      where: {
        tmdbId: { not: null },
      },
      include: {
        casts: true,
        downloadLinks: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error('Error fetching TMDB movies:', error);
    return [];
  }
}

// Get all TMDB series with proper field handling
export async function getTMDBSeries(limit = 50, offset = 0) {
  try {
    return await db.series.findMany({
      where: {
        tmdbId: { not: null },
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    console.error('Error fetching TMDB series:', error);
    return [];
  }
}

// Get TMDB movie by internal ID
export async function getTMDBMovieById(id: string) {
  try {
    return await db.movie.findUnique({
      where: { id },
      include: {
        casts: true,
        downloadLinks: true,
      },
    });
  } catch (error) {
    console.error('Error fetching movie by ID:', error);
    return null;
  }
}

// Get TMDB series by internal ID
export async function getTMDBSeriesById(id: string) {
  try {
    return await db.series.findUnique({
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
  } catch (error) {
    console.error('Error fetching series by ID:', error);
    return null;
  }
}

// Count TMDB movies
export async function countTMDBMovies(): Promise<number> {
  try {
    return await db.movie.count({
      where: { tmdbId: { not: null } },
    });
  } catch (error) {
    console.error('Error counting TMDB movies:', error);
    return 0;
  }
}

// Count TMDB series
export async function countTMDBSeries(): Promise<number> {
  try {
    return await db.series.count({
      where: { tmdbId: { not: null } },
    });
  } catch (error) {
    console.error('Error counting TMDB series:', error);
    return 0;
  }
}

// Delete TMDB movie
export async function deleteTMDBMovie(id: string): Promise<boolean> {
  try {
    await db.movie.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting movie:', error);
    return false;
  }
}

// Delete TMDB series
export async function deleteTMDBSeries(id: string): Promise<boolean> {
  try {
    await db.series.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    console.error('Error deleting series:', error);
    return false;
  }
}
