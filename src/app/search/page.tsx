'use client';

import { Suspense } from 'react';
import SearchContent from './SearchContent';

function SearchGridSkeleton() {
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {[...Array(30)].map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
            <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
            <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchGridSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
