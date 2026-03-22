'use client';

import { Suspense } from 'react';
import MoviesContent from '../../MoviesContent';

export default function MoviesPageNumber() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <MoviesContent />
    </Suspense>
  );
}
