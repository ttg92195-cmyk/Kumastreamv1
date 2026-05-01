'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';
import { MoviesHeader, MoviesHeaderFallback } from './MoviesHeader';

function MoviesGridSkeleton() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-4 gap-2">
        {[...Array(20)].map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
            <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
            <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Suspense fallback={<MoviesHeaderFallback />}>
        <MoviesHeader />
      </Suspense>
      <Suspense fallback={<MoviesGridSkeleton />}>
        <MoviesContent />
      </Suspense>
    </div>
  );
}
