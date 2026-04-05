'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/movie/Header';
import { MovieCard } from '@/components/movie/MovieCard';
import { ChevronLeft, ChevronRight, Film, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 30;

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

interface CombinedItem {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
  type: 'movie' | 'series';
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const pageParam = searchParams.get('page');
  const currentPage = parseInt(pageParam || '1', 10);
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  const performSearch = useCallback(async (q: string) => {
    if (!q) return;
    
    setLoading(true);
    try {
      const [movieData, seriesData] = await Promise.all([
        fetch(`/api/movies?search=${encodeURIComponent(q)}&limit=100`).then((res) => res.json()),
        fetch(`/api/series?search=${encodeURIComponent(q)}&limit=100`).then((res) => res.json()),
      ]);
      setMovies(movieData.movies || []);
      setSeries(seriesData.series || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [query, performSearch]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    // Reset to page 1 on new search
    router.push(`/search?q=${encodeURIComponent(q)}&page=1`);
  };

  // Combine movies and series
  const combinedResults: CombinedItem[] = [
    ...movies.map(m => ({ ...m, type: 'movie' as const })),
    ...series.map(s => ({ ...s, type: 'series' as const })),
  ];

  // Pagination
  const totalPages = Math.ceil(combinedResults.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResults = combinedResults.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&page=${newPage}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
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
    
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => goToPage(page)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="text-gray-500 px-2">...</span>
          )
        ))}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Separate paginated results by type for section headers
  const paginatedMovies = paginatedResults.filter(r => r.type === 'movie');
  const paginatedSeriesList = paginatedResults.filter(r => r.type === 'series');

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header searchPlaceholder="Search movies and series..." onSearch={handleSearch} />

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {[...Array(30)].map((_, i) => (
              <div key={i}>
                <div className="relative aspect-[2/3] bg-gray-800 rounded-md animate-pulse">
                  <div className="absolute top-1 left-1 w-8 h-4 bg-gray-700 rounded" />
                  <div className="absolute top-1 right-1 w-10 h-4 bg-gray-700 rounded" />
                </div>
                <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
                <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results count */}
            {combinedResults.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Found <span className="text-white font-medium">{combinedResults.length}</span> results for &quot;{searchQuery}&quot;
                </p>
                <p className="text-gray-500 text-sm">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            )}

            {/* Combined Results Grid */}
            {paginatedResults.length > 0 && (
              <div className="space-y-6">
                {/* Show combined with type badges */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {paginatedResults.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="relative">
                      <MovieCard
                        id={item.id}
                        title={item.title}
                        year={item.year}
                        rating={item.rating}
                        poster={item.poster}
                        quality4k={item.quality4k}
                        quality={item.quality}
                        type={item.type}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {renderPagination()}

            {/* No results */}
            {!loading && combinedResults.length === 0 && searchQuery && (
              <div className="text-center py-20">
                <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {/* No search query */}
            {!searchQuery && (
              <div className="text-center py-20">
                <p className="text-gray-500">Search for movies and series</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal fallback - let SearchContent handle its own loading state
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchContent />
    </Suspense>
  );
}
