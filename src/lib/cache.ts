/**
 * Server-side caching layer using Next.js unstable_cache + revalidateTag.
 *
 * This caches database query results at the Next.js server level,
 * so repeated requests within the revalidation period do NOT hit Neon DB,
 * dramatically reducing Network Transfer.
 *
 * Cache Tags:
 *   - 'movies'       → all movie list queries
 *   - 'movie-{id}'   → a specific movie detail
 *   - 'series'       → all series list queries
 *   - 'series-{id}'  → a specific series detail
 *   - 'episodes'     → all episode queries
 *   - 'episode-{id}' → a specific episode
 *
 * After mutations (PUT/DELETE/POST), call the corresponding invalidate
 * function to bust the cache so the next GET returns fresh data.
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { db } from '@/lib/db';

// ─── Revalidation periods (seconds) ─────────────────────────────
const LIST_REVALIDATE   = 300;  // 5 min  — movie/series lists
const DETAIL_REVALIDATE = 600;  // 10 min — movie/series detail
const EPISODE_REVALIDATE = 600; // 10 min — episode detail
const SIMILAR_REVALIDATE = 600; // 10 min — similar content

// ─── Cached Query: Movie List ───────────────────────────────────
export const getCachedMovieList = unstable_cache(
  async (
    whereClause: any,
    selectFields: any,
    includeFields: any,
    limit: number,
    offset: number,
  ) => {
    const [totalCount, dbResult] = await Promise.all([
      db.movie.count({ where: whereClause }),
      db.movie.findMany({
        where: whereClause,
        select: selectFields || undefined,
        include: includeFields || undefined,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);
    return { totalCount, dbResult };
  },
  ['movies-list'],
  { revalidate: LIST_REVALIDATE, tags: ['movies'] },
);

// ─── Cached Query: Movie Detail ─────────────────────────────────
export const getCachedMovieDetail = unstable_cache(
  async (id: string) => {
    return db.movie.findUnique({
      where: { id },
      include: {
        casts: true,
        downloadLinks: true,
      },
    });
  },
  ['movies-detail'],
  { revalidate: DETAIL_REVALIDATE, tags: ['movies'] },
);

// ─── Cached Query: Similar Movies ───────────────────────────────
export const getCachedSimilarMovies = unstable_cache(
  async (id: string, genreConditions: any[]) => {
    return db.movie.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { OR: genreConditions },
        ],
      },
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
      orderBy: { rating: 'desc' },
      take: 30,
    });
  },
  ['movies-similar'],
  { revalidate: SIMILAR_REVALIDATE, tags: ['movies'] },
);

// ─── Cached Query: Series List ──────────────────────────────────
export const getCachedSeriesList = unstable_cache(
  async (
    whereClause: any,
    selectFields: any,
    includeFields: any,
    limit: number,
    offset: number,
  ) => {
    const [totalCount, dbResult] = await Promise.all([
      db.series.count({ where: whereClause }),
      db.series.findMany({
        where: whereClause,
        select: selectFields || undefined,
        include: includeFields || undefined,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);
    return { totalCount, dbResult };
  },
  ['series-list'],
  { revalidate: LIST_REVALIDATE, tags: ['series'] },
);

// ─── Cached Query: Series Detail ────────────────────────────────
export const getCachedSeriesDetail = unstable_cache(
  async (id: string) => {
    return db.series.findUnique({
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
  },
  ['series-detail'],
  { revalidate: DETAIL_REVALIDATE, tags: ['series'] },
);

// ─── Cached Query: Similar Series ───────────────────────────────
export const getCachedSimilarSeries = unstable_cache(
  async (id: string, genreConditions: any[]) => {
    return db.series.findMany({
      where: {
        AND: [
          { id: { not: id } },
          { OR: genreConditions },
        ],
      },
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
      orderBy: { rating: 'desc' },
      take: 30,
    });
  },
  ['series-similar'],
  { revalidate: SIMILAR_REVALIDATE, tags: ['series'] },
);

// ─── Cached Query: Episode Detail ───────────────────────────────
export const getCachedEpisodeDetail = unstable_cache(
  async (id: string) => {
    return db.episode.findUnique({
      where: { id },
      include: {
        downloadLinks: true,
      },
    });
  },
  ['episodes-detail'],
  { revalidate: EPISODE_REVALIDATE, tags: ['episodes'] },
);

// ─── Cache Invalidation Helpers ─────────────────────────────────
// Call these after mutations (PUT/DELETE/POST) to bust stale cache

export function invalidateMovieCache(movieId?: string) {
  revalidateTag('movies');
  if (movieId) {
    // Also invalidate any detail-specific caches
    revalidateTag('movies-detail');
    revalidateTag('movies-similar');
  }
  console.log('[cache] Invalidated movie cache', movieId ? `for movie ${movieId}` : '(all)');
}

export function invalidateSeriesCache(seriesId?: string) {
  revalidateTag('series');
  if (seriesId) {
    revalidateTag('series-detail');
    revalidateTag('series-similar');
  }
  console.log('[cache] Invalidated series cache', seriesId ? `for series ${seriesId}` : '(all)');
}

export function invalidateEpisodeCache(episodeId?: string) {
  revalidateTag('episodes');
  if (episodeId) {
    revalidateTag('episodes-detail');
  }
  // Episode changes also affect the parent series detail
  revalidateTag('series-detail');
  console.log('[cache] Invalidated episode cache', episodeId ? `for episode ${episodeId}` : '(all)');
}
