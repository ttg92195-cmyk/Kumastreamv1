'use client';

import { Suspense } from 'react';
import MoviesContent from './MoviesContent';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';

// PageSkeleton provides immediate visual feedback while Suspense resolves
// This prevents the black flash when useSearchParams() suspends
export default function MoviesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MoviesContent />
    </Suspense>
  );
}
