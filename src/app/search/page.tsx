'use client';

import { Suspense } from 'react';
import SearchContent from './SearchContent';
import { SearchHeader, SearchHeaderFallback } from './SearchHeader';

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Suspense fallback={<SearchHeaderFallback />}>
        <SearchHeader />
      </Suspense>
      <Suspense fallback={null}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
