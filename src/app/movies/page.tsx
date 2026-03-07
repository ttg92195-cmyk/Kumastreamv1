'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-3/4" />
            </div>
          ))}
        </div>
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
