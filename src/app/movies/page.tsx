'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';
import { MoviesHeader, MoviesHeaderFallback } from './MoviesHeader';

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Suspense fallback={<MoviesHeaderFallback />}>
        <MoviesHeader />
      </Suspense>
      <Suspense fallback={null}>
        <MoviesContent />
      </Suspense>
    </div>
  );
}
