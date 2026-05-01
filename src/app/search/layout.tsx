import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchHeader, SearchHeaderFallback } from './SearchHeader';

export const metadata: Metadata = {
  title: 'Search - CINE STREAM',
  description: 'Search for movies and series on CINE STREAM.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header — in layout so it persists during navigation & refresh */}
      <Suspense fallback={<SearchHeaderFallback />}>
        <SearchHeader />
      </Suspense>
      {/* Page content — loading.tsx replaces only this part */}
      {children}
    </div>
  );
}
