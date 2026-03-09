'use client';

import { Suspense } from 'react';
import SeriesContent from './SeriesContent';

export default function SeriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] p-4">
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
      <SeriesContent />
    </Suspense>
  );
}
