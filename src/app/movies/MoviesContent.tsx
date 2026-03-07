'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MovieCard } from '@/components/movie/MovieCard';
import { ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings-store';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string | null;
  quality4k: boolean;
  quality?: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function MoviesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { themeColor } = useSettingsStore();
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const genreFilter = searchParams.get('genre');
  const tagFilter = searchParams.get('tag');
  const activeFilter = genreFilter || tagFilter;
  const filterType = genreFilter ? 'Genre' : tagFilter ? 'Tag' : null;
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchMovies = useCallback(async (search: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      if (genreFilter) params.set('genre', genreFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (search) params.set('search', search);

      const response = await fetch('/api/movies?' + params.toString());
      if (response.ok) {
        const data = await response.json();
        setMovies(data.movies || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, genreFilter, tagFilter]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchMovies(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchMovies]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const clearFilter = useCallback(() => {
    router.push('/movies');
  }, [router]);

  const renderedMovies = useMemo(() => 
    movies.map((m) => (
      <MovieCard key={m.id} {...m} type="movie" />
    )),
    [movies]
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
    <div className="min-h-screen bg-[#0f0f0f] pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">
            {activeFilter ? `${filterType}: ${activeFilter}` : 'Movies'}
          </h1>
          <div className="relative w-56">
            <input 
              type="text" 
              placeholder="Search movies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/80 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-700 focus:border-red-500 focus:outline-none transition-colors duration-200" 
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Filter Tag */}
      {activeFilter && (
        <div className="px-4 pt-3 animate-content-in">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg inline-flex border border-gray-700">
            <span className="text-gray-400 text-sm">{filterType}:</span>
            <span className="text-white font-medium">{activeFilter}</span>
            <button 
              onClick={clearFilter}
              className="ml-1 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {!loading && totalCount > 0 && (
          <div className="text-gray-400 text-sm mb-4">
            Showing {movies.length} of {totalCount} movies
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-4 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-gray-800/50 rounded-md animate-pulse" />
                <div className="mt-1.5 h-3 bg-gray-800/50 rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 animate-content-in">
            <p className="text-gray-400 text-lg">
              {activeFilter || searchQuery ? `No movies found for "${activeFilter || searchQuery}"` : 'No movies found'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {renderedMovies}
            </div>
            
            {/* Pagination - Compact Style */}
            {paginationData && (
              <div className="flex items-center justify-center gap-1 py-4 pb-16">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors duration-200 border border-gray-700 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  {paginationData.map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => goToPage(page)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200',
                          currentPage === page
                            ? 'text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        )}
                        style={currentPage === page ? { backgroundColor: themeColor } : {}}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="text-gray-400 px-1 text-sm">...</span>
                    )
                  ))}
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-9 h-9 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors duration-200 border border-gray-700 flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
