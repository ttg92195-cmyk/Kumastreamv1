'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';

// Minimal fallback - let MoviesContent handle its own loading state
// Suspense is only needed for useSearchParams() in Next.js App Router
export default function MoviesPage() {
  return (
    <Suspense fallback={null}>
      <MoviesContent />
    </Suspense>
  );
}
