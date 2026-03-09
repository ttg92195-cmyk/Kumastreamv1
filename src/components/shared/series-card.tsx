'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarkStore } from '@/stores';
import { useState } from 'react';

interface SeriesCardProps {
  series: {
    id: string;
    title: string;
    year: number;
    rating: number;
    poster: string;
    quality4k: boolean;
    seasons?: number;
  };
}

export function SeriesCard({ series }: SeriesCardProps) {
  const { isBookmarked, addBookmark, removeBookmark, getBookmarkId } = useBookmarkStore();
  const [isLoading, setIsLoading] = useState(false);
  const bookmarked = isBookmarked(undefined, series.id);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      if (bookmarked) {
        const bookmarkId = getBookmarkId(undefined, series.id);
        if (bookmarkId) {
          await fetch('/api/bookmark', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: bookmarkId }),
          });
          removeBookmark(bookmarkId);
        }
      } else {
        const res = await fetch('/api/bookmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: 'default-user', 
            seriesId: series.id 
          }),
        });
        const data = await res.json();
        addBookmark({ id: data.id, seriesId: series.id });
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/series/${series.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800">
        <Image
          src={series.poster}
          alt={series.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* 4K Badge */}
        {series.quality4k && (
          <div className="absolute top-2 left-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">4K</span>
          </div>
        )}
        
        {/* Rating Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-white text-xs font-medium">{series.rating.toFixed(1)}</span>
        </div>
        
        {/* Seasons Badge */}
        {series.seasons && (
          <div className="absolute bottom-2 left-2 bg-red-600/80 px-2 py-0.5 rounded text-xs text-white font-medium">
            S{series.seasons}
          </div>
        )}
        
        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          disabled={isLoading}
          className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
        >
          {bookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-red-500" />
          ) : (
            <Bookmark className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
      
      {/* Title and Year */}
      <div className="mt-2 px-1">
        <h3 className="text-white font-medium text-sm truncate">{series.title}</h3>
        <p className="text-gray-400 text-xs">{series.year}</p>
      </div>
    </Link>
  );
}
