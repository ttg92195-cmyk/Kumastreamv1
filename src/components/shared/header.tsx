'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, X } from 'lucide-react';
import { useSidebarStore } from '@/stores';
import { cn } from '@/lib/utils';

export function Header() {
  const { open } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (pathname.startsWith('/movies')) {
        router.push(`/movies?search=${encodeURIComponent(searchQuery)}`);
      } else if (pathname.startsWith('/series')) {
        router.push(`/series?search=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/movies?search=${encodeURIComponent(searchQuery)}`);
      }
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Hide header on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="sticky top-0 bg-neutral-950/95 backdrop-blur-sm border-b border-neutral-800 z-30">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Menu Button */}
        <button 
          onClick={open}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">CS</span>
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">CINE STREAM</span>
        </Link>

        {/* Search */}
        <div className="flex items-center gap-2">
          {isSearchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-32 sm:w-48 h-8 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-1.5 hover:bg-neutral-800 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
