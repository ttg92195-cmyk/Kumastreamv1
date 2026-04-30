'use client';

import { Suspense } from 'react';
import SeriesContent from './SeriesContent';

// Minimal fallback - let SeriesContent handle its own loading state
// Suspense is only needed for useSearchParams() in Next.js App Router
export default function SeriesPage() {
  return (
    <Suspense fallback={null}>
      <SeriesContent />
    </Suspense>
  );
}
