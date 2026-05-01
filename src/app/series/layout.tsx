import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SeriesHeader, SeriesHeaderFallback } from './SeriesHeader';

export const metadata: Metadata = {
  title: 'Series - CINE STREAM',
  description: 'Browse all TV series available on CINE STREAM. Watch your favorite shows in high quality.',
};

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header — in layout so it persists during navigation & refresh */}
      <Suspense fallback={<SeriesHeaderFallback />}>
        <SeriesHeader />
      </Suspense>
      {/* Page content — loading.tsx replaces only this part */}
      {children}
    </div>
  );
}
