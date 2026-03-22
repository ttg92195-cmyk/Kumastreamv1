'use client';

import { Suspense } from 'react';
import SeriesContent from './SeriesContent';

export default function SeriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f0f0f]" />}>
      <SeriesContent />
    </Suspense>
  );
}
