'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

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
  const { toggleSidebar, searchQuery, setSearchQuery, _hasHydrated } = useAppStore();
  const { themeColor } = useSettingsStore();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  // Use hydrated theme color or default red
  const currentColor = _hasHydrated ? themeColor : '#ef4444';

  return (
    <header className="sticky top-0 z-20 bg-[#0a0a0a] border-b border-[#262626]">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Menu Button - Simple, no animation */}
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 rounded-lg transition-colors"
          style={{ 
            color: currentColor,
            backgroundColor: `${currentColor}15`
          }}
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo or Title */}
        {!isSearchFocused && (
          <h1 className="text-white font-bold text-lg">{title}</h1>
        )}

        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#1f1f1f] text-white placeholder-gray-500 pl-10 pr-10 py-2 rounded-full text-sm focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
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
