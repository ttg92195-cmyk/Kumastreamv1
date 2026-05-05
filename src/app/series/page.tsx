'use client';

import { Suspense } from 'react';
import SeriesContent from './SeriesContent';
import { SeriesHeader, SeriesHeaderFallback } from './SeriesHeader';

export default function SeriesPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Suspense fallback={<SeriesHeaderFallback />}>
        <SeriesHeader />
      </Suspense>
      <Suspense fallback={null}>
        <SeriesContent />
      </Suspense>
    </div>
  );
}
