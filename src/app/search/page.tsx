'use client';

import { Suspense } from 'react';
import { Header } from '@/components/movie/Header';
import SearchContent from './SearchContent';

/* ─── Header fallback (static, visible during hydration) ─── */
function SearchHeaderFallback() {
  return (
    <header className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center gap-3 px-4 h-14">
        <div className="text-white font-bold text-lg">CINE</div>
        <div className="flex-1">
          <div className="w-full bg-[#1a1a1a] rounded-full h-10 border border-gray-700" />
        </div>
      </div>
    </header>
  );
}

/* ─── Grid skeleton (inside Suspense → replaces content only) ─── */
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

/* ─── Page: Header (always visible) + Content (skeleton during loading) ─── */
export default function SearchPage() {
  return (
    <>
      {/* Header — separate Suspense, never covered by content skeleton */}
      <Suspense fallback={<SearchHeaderFallback />}>
        <Header searchPlaceholder="Search movies and series..." />
      </Suspense>

      {/* Content — only this shows skeleton during loading */}
      <Suspense fallback={<SearchGridSkeleton />}>
        <SearchContent />
      </Suspense>
    </>
  );
}
