'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { useBookmarkStore } from '@/stores';
import { useState } from 'react';

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    year: number;
    rating: number;
    poster: string;
    quality4k: boolean;
  };
}

export function MovieCard({ movie }: MovieCardProps) {
  const { isBookmarked, addBookmark, removeBookmark, getBookmarkId } = useBookmarkStore();
  const [isLoading, setIsLoading] = useState(false);
  const bookmarked = isBookmarked(movie.id);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      if (bookmarked) {
        const bookmarkId = getBookmarkId(movie.id);
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
            movieId: movie.id 
          }),
        });
        const data = await res.json();
        addBookmark({ id: data.id, movieId: movie.id });
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Link href={`/movie/${movie.id}`} className="group block">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800">
        <Image
          src={movie.poster}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* 4K Badge */}
        {movie.quality4k && (
          <div className="absolute top-2 left-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">4K</span>
          </div>
        )}
        
        {/* Rating Badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          <span className="text-white text-xs font-medium">{movie.rating.toFixed(1)}</span>
        </div>
        
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
        <h3 className="text-white font-medium text-sm truncate">{movie.title}</h3>
        <p className="text-gray-400 text-xs">{movie.year}</p>
      </div>
    </Link>
  );
}
