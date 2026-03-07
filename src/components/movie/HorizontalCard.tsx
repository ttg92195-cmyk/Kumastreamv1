'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

interface HorizontalCardProps {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k?: boolean;
  type: 'movie' | 'series';
  showBookmark?: boolean;
}

export function HorizontalCard({
  id,
  title,
  year,
  rating,
  poster,
  quality4k = false,
  type = 'movie',
  showBookmark = true,
}: HorizontalCardProps) {
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useAppStore();

  const bookmarked = isBookmarked(id, type);

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (bookmarked) {
      const bookmark = bookmarks.find(
        (b) => (type === 'movie' && b.movieId === id) || (type === 'series' && b.seriesId === id)
      );
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      addBookmark({
        id: `${type}-${id}`,
        type,
        movieId: type === 'movie' ? id : undefined,
        seriesId: type === 'series' ? id : undefined,
        movie: type === 'movie' ? { id, title, year, rating, poster, quality4k } : undefined,
        series: type === 'series' ? { id, title, year, rating, poster, quality4k } : undefined,
      });
    }
  };

  const href = type === 'movie' ? `/movie/${id}` : `/series/${id}`;

  return (
    <Link href={href} className="flex-shrink-0 w-32 group">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 poster-shadow">
        {/* Poster Image */}
        <Image
          src={poster}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="128px"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

        {/* 4K Badge */}
        {quality4k && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            4K
          </div>
        )}

        {/* Bookmark Button */}
        {showBookmark && (
          <button
            onClick={handleBookmark}
            className={cn(
              'absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all',
              bookmarked
                ? 'bg-red-500 text-white'
                : 'bg-black/50 text-white hover:bg-red-500'
            )}
          >
            <Heart className={cn('w-3 h-3', bookmarked && 'fill-current')} />
          </button>
        )}

        {/* Rating */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-1 py-0.5 rounded text-xs">
          <Star className="w-3 h-3 text-red-500 fill-red-500" />
          <span className="text-white font-medium">{rating.toFixed(1)}</span>
        </div>

        {/* Title & Year */}
        <div className="absolute bottom-0 left-0 right-0 p-2 pt-4">
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-gray-400 text-[10px] mt-0.5">{year}</p>
        </div>
      </div>
    </Link>
  );
}
