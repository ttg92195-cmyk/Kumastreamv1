'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';

// Simple background fallback for Suspense
// The actual skeleton is handled inside MoviesContent during data loading
export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <MoviesContent />
    </Suspense>
  );
}
