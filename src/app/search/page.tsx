'use client';

import { Suspense, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MovieCard } from '@/components/movie/MovieCard';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings-store';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

interface CombinedPost extends Movie {
  type: 'movie' | 'series';
}

const ITEMS_PER_PAGE = 30;

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { themeColor } = useSettingsStore();

  const [posts, setPosts] = useState<CombinedPost[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get query and page from URL
  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const performSearch = useCallback(async (searchQuery: string, page: number) => {
    if (!searchQuery) {
      setPosts([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    setIsTransitioning(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const [movieData, seriesData] = await Promise.all([
        fetch(`/api/movies?search=${encodeURIComponent(searchQuery)}&limit=500`).then((res) => res.json()),
        fetch(`/api/series?search=${encodeURIComponent(searchQuery)}&limit=500`).then((res) => res.json()),
      ]);

      // Combine and sort by relevance (title match priority)
      const movies: CombinedPost[] = (movieData.movies || []).map((m: Movie) => ({
        ...m,
        type: 'movie' as const,
      }));

      const series: CombinedPost[] = (seriesData.series || []).map((s: Series) => ({
        ...s,
        type: 'series' as const,
      }));

      // Combine all posts
      const allPosts = [...movies, ...series];

      // Sort by title relevance (exact match first, then starts with, then contains)
      const searchLower = searchQuery.toLowerCase();
      allPosts.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();

        // Exact match first
        if (aTitle === searchLower && bTitle !== searchLower) return -1;
        if (bTitle === searchLower && aTitle !== searchLower) return 1;

        // Starts with search query
        if (aTitle.startsWith(searchLower) && !bTitle.startsWith(searchLower)) return -1;
        if (bTitle.startsWith(searchLower) && !aTitle.startsWith(searchLower)) return 1;

        // Then by year (newer first)
        return b.year - a.year;
      });

      setTotalCount(allPosts.length);
      setPosts(allPosts.slice(offset, offset + ITEMS_PER_PAGE));
    } catch (error) {
      console.error(error);
      setPosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setTimeout(() => setIsTransitioning(false), 100);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query, currentPage);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, currentPage, performSearch]);

  // Navigate to page by updating URL
  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, pathname, searchParams]);

  const handleSearch = useCallback((searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname]);

  const renderedPosts = useMemo(() =>
    posts.map((post) => (
      <MovieCard
        key={`${post.type}-${post.id}`}
        id={post.id}
        title={post.title}
        year={post.year}
        rating={post.rating}
        poster={post.poster}
        quality4k={post.quality4k}
        quality={post.quality}
        type={post.type}
        themeColor={themeColor}
      />
    )),
    [posts, themeColor]
  );

  const paginationData = useMemo(() => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }

    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Search</h1>
          <div className="relative w-56">
            <input
              type="text"
              placeholder="Search movies & series..."
              defaultValue={query}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch((e.target as HTMLInputElement).value);
                }
              }}
              autoComplete="off"
              className="w-full bg-[#1a1a1a] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-700 focus:border-red-500 focus:outline-none transition-colors duration-200"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
              onClick={() => {
                const input = document.querySelector('input[placeholder="Search movies & series..."]') as HTMLInputElement;
                handleSearch(input?.value || '');
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {!loading && totalCount > 0 && (
          <div className="text-gray-400 text-sm mb-4">
            Found {totalCount} results for &quot;{query}&quot;
            {totalPages > 1 && <span className="ml-2">• Page {currentPage} of {totalPages}</span>}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-gray-800/50 rounded-md" />
                <div className="mt-1.5 h-3 bg-gray-800/50 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            {query ? (
              <p className="text-gray-400 text-lg">No results found for &quot;{query}&quot;</p>
            ) : (
              <p className="text-gray-400 text-lg">Search for movies and series</p>
            )}
          </div>
        ) : (
          <>
            <div className={cn(
              "grid grid-cols-3 gap-3 transition-opacity duration-200",
              isTransitioning && "opacity-50"
            )}>
              {renderedPosts}
            </div>

            {/* Pagination */}
            {paginationData && (
              <div className="flex items-center justify-center gap-0.5 pt-6 mt-6">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors duration-200 border border-gray-700 flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-0.5">
                  {paginationData.map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => goToPage(page)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200',
                          currentPage === page
                            ? 'text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        )}
                        style={currentPage === page ? { backgroundColor: themeColor } : {}}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="text-gray-400 px-2 text-sm">...</span>
                    )
                  ))}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors duration-200 border border-gray-700 flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] p-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] bg-gray-800/50 rounded-md" />
              <div className="mt-1.5 h-3 bg-gray-800/50 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
