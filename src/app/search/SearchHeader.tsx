'use client';

import { Header } from '@/components/movie/Header';

export function SearchHeaderFallback() {
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

export function SearchHeader() {
  return <Header searchPlaceholder="Search movies and series..." />;
}
