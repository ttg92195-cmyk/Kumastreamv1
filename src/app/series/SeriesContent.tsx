'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MovieCard } from '@/components/movie/MovieCard';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string | null;
  quality4k: boolean;
  quality?: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function SeriesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [series, setSeries] = useState<Series[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Get page from URL, default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const genreFilter = searchParams.get('genre');
  const tagFilter = searchParams.get('tag');
  const searchQuery = searchParams.get('search') || '';
  const activeFilter = genreFilter || tagFilter;
  const filterType = genreFilter ? 'Genre' : tagFilter ? 'Tag' : null;
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchSeries = useCallback(async () => {
    setLoading(true);
    setIsTransitioning(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', ITEMS_PER_PAGE.toString());
      params.set('offset', ((currentPage - 1) * ITEMS_PER_PAGE).toString());
      params.set('card', 'true'); // Only need card data, no casts/episodes/downloadLinks
      if (genreFilter) params.set('genre', genreFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch('/api/series?' + params.toString());
      if (response.ok) {
        const data = await response.json();
        setSeries(data.series || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching series:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsTransitioning(false), 100);
    }
  }, [currentPage, genreFilter, tagFilter, searchQuery]);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  // Navigate to page by updating URL
  const goToPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router, pathname, searchParams]);

  const clearFilter = useCallback(() => {
    router.push('/series');
  }, [router]);

  const renderedSeries = useMemo(() => 
    series.map((s) => (
      <MovieCard key={s.id} {...s} type="series" />
    )),
    [series]
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
    <>
      {/* Active Filter Tag */}
      {activeFilter && (
        <div className="px-4 pt-3">
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
            Showing {series.length} of {totalCount} series
            {totalPages > 1 && <span className="ml-2">• Page {currentPage} of {totalPages}</span>}
          </div>
        )}

        {loading ? null : series.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              {activeFilter || searchQuery ? `No series found for "${activeFilter || searchQuery}"` : 'No series found'}
            </p>
          </div>
        ) : (
          <>
            <div className={cn(
              "grid grid-cols-4 gap-2 transition-opacity duration-200",
              isTransitioning && "opacity-50"
            )}>
              {renderedSeries}
            </div>
            
            {/* Pagination */}
            {paginationData && (
              <div className="flex items-center justify-center gap-0.5 pt-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-9 h-9 rounded-lg bg-gray-800 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-700 transition-colors duration-200 border border-gray-700 flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-0.5">
                  {paginationData.map((page, idx) => (
                    typeof page === 'number' ? (
                      <button
                        key={idx}
                        onClick={() => goToPage(page)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-sm font-bold transition-all duration-200',
                          currentPage === page
                            ? 'bg-red-500 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        )}
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
    </>
  );
}
