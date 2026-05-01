'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function MoviesHeaderFallback() {
  return (
    <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Movies</h1>
        <div className="relative w-56">
          <input
            type="text"
            placeholder="Search movies..."
            disabled
            className="w-full bg-[#1a1a1a] text-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-700"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        </div>
      </div>
    </div>
  );
}

export function MoviesHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const genreFilter = searchParams.get('genre');
  const tagFilter = searchParams.get('tag');
  const searchQuery = searchParams.get('search') || '';
  const activeFilter = genreFilter || tagFilter;
  const filterType = genreFilter ? 'Genre' : tagFilter ? 'Tag' : null;

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">
          {activeFilter ? `${filterType}: ${activeFilter}` : 'Movies'}
        </h1>
        <div className="relative w-56">
          <input
            type="text"
            placeholder="Search movies..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            autoComplete="off"
            className="w-full bg-[#1a1a1a] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-700 focus:border-red-500 focus:outline-none transition-colors duration-200"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
