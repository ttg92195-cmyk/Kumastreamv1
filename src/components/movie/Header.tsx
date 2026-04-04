'use client';

import { useRouter } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export function Header({
  title = 'CINE',
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearch,
}: HeaderProps) {
  const { toggleSidebar, searchQuery, setSearchQuery } = useAppStore();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Menu Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg transition-colors text-red-500 bg-red-500/10"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo or Title */}
        <h1 className="text-white font-bold text-lg">{title}</h1>

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="w-full bg-[#1a1a1a] text-white placeholder-gray-400 pl-10 pr-10 py-2.5 rounded-full text-sm focus:outline-none border border-gray-700 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </header>
  );
}
