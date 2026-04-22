'use client';

import Link from 'next/link';
import Image from 'next/image';
import { memo, useState, useCallback } from 'react';
import { Star, Film, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder image for missing posters - inline SVG for faster load
const PLACEHOLDER_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

interface MovieCardProps {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string | null;
  quality4k?: boolean;
  quality?: string | null;
  type: 'movie' | 'series';
}

const MovieCard = memo(function MovieCard({
  id,
  title,
  year,
  rating,
  poster,
  quality4k = false,
  quality,
  type = 'movie',
}: MovieCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const href = type === 'movie' ? `/movie/${id}` : `/series/${id}`;
  const posterUrl = poster && !imageError ? poster : PLACEHOLDER_POSTER;
  const isValidUrl = posterUrl && (posterUrl.startsWith('http') || posterUrl.startsWith('/') || posterUrl.startsWith('data:'));
  
  // Get quality badge text - prefer quality field over quality4k
  const qualityBadge = quality ? quality.split('/')[0].trim() : (quality4k ? '4K' : null);

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  return (
    <Link href={href} className="block group">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
        {/* Loading skeleton */}
        {!imageLoaded && isValidUrl && (
          <div className="absolute inset-0 bg-gray-800 animate-pulse" />
        )}
        
        {/* Poster Image */}
        {isValidUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 14vw"
            unoptimized
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            {type === 'movie' ? (
              <Film className="w-6 h-6 text-gray-500" />
            ) : (
              <Tv className="w-6 h-6 text-gray-500" />
            )}
          </div>
        )}

        {/* Quality Badge - Top Left */}
        {qualityBadge && (
          <div className="absolute top-1 left-1 text-white text-[10px] font-bold px-1 py-0.5 rounded max-w-[55px] truncate bg-red-500">
            {qualityBadge}
          </div>
        )}

        {/* Rating Badge - Top Right */}
        <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-black/80 px-1 py-0.5 rounded">
          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
          <span className="text-white font-medium text-[10px]">{rating.toFixed(1)}</span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Title & Year - Below Poster */}
      <div className="mt-1.5 px-0.5">
        <h3 className="text-white text-xs font-medium line-clamp-1 leading-tight transition-colors duration-200 hover:text-red-500">
          {title}
        </h3>
        <p className="text-gray-400 text-xs mt-0.5">{year}</p>
      </div>
    </Link>
  );
});

export { MovieCard };
