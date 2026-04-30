'use client';

import { Suspense } from 'react';
import SeriesContent from './SeriesContent';
import { PageSkeleton } from '@/components/skeletons/PageSkeleton';

// PageSkeleton provides immediate visual feedback while Suspense resolves
// This prevents the black flash when useSearchParams() suspends
export default function SeriesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SeriesContent />
    </Suspense>
  );
}
