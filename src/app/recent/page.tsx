'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/movie/Header';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 30;

function RecentContent() {
  const { recents, clearRecents } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Combine all recents - already sorted by viewedAt
  const allItems = useMemo(() => {
    return recents
      .filter((r) => (r.type === 'movie' && r.movie) || (r.type === 'series' && r.series))
      .map((r) => ({
        id: r.id,
        type: r.type,
        data: r.type === 'movie' ? r.movie : r.series,
        viewedAt: r.viewedAt,
      }));
  }, [recents]);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allItems.slice(start, start + ITEMS_PER_PAGE);
  }, [allItems, currentPage]);

  const goToPage = (newPage: number) => {
    router.push(`/recent?page=${newPage}`);
  };

  const renderPagination = () => {
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

    return (
      <div className="flex items-center justify-center gap-1 py-4 mt-4">
        <button 
          onClick={() => goToPage(currentPage - 1)} 
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button 
              key={idx} 
              onClick={() => goToPage(p)}
              className={cn('w-10 h-10 rounded-lg text-sm font-medium',
                currentPage === p ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}
            >
              {p}
            </button>
          ) : <span key={idx} className="text-gray-500 px-2">...</span>
        ))}
        <button 
          onClick={() => goToPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Recent" showSearch={false} />

      <div className="p-4">
        {recents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No recent views</p>
            <p className="text-gray-600 text-xs">
              Movies and series you watch will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with Clear Button */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} viewed
              </p>
              <button
                onClick={clearRecents}
                className="flex items-center gap-1 text-red-500 text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>

            {/* Combined Grid */}
            <div className="grid grid-cols-3 gap-2">
              {paginatedItems.map((item) => (
                item.data && (
                  <MovieCard
                    key={item.id}
                    id={item.data.id}
                    title={item.data.title}
                    year={item.data.year}
                    rating={item.data.rating}
                    poster={item.data.poster}
                    quality4k={item.data.quality4k}
                    quality={item.data.quality}
                    type={item.type}
                  />
                )
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RecentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] pb-20">
        <Header title="Recent" showSearch={false} />
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-20 bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[...Array(30)].map((_, i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
                <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
                <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <RecentContent />
    </Suspense>
  );
}
