'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Search, Check, Loader2, Download, Film, Tv, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface TMDBItem {
  id: number;
  title: string;
  originalTitle: string;
  year: number;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  overview: string;
  genres: string;
  type: string;
  duration: number;
  seasons: number;
  totalEpisodes: number;
  casts: Array<{ name: string; role: string }>;
  director: string;
}

interface Genre {
  id: number;
  name: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
const ITEMS_PER_PAGE = 20;

export default function TMDBGeneratorPage() {
  const router = useRouter();
  const { admin, _hasHydrated } = useAppStore();
  
  // Filters
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [year, setYear] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [count, setCount] = useState<string>('20');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data
  const [genres, setGenres] = useState<Genre[]>([]);
  const [results, setResults] = useState<TMDBItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set()); // Already imported
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [checkingImports, setCheckingImports] = useState(false);

  // Check admin authentication
  useEffect(() => {
    if (_hasHydrated && !admin) {
      router.push('/admin/login');
    }
  }, [_hasHydrated, admin, router]);

  // Fetch genres when type changes
  useEffect(() => {
    fetch(`/api/tmdb/genres?type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        setGenres(data.genres || []);
      })
      .catch(console.error);
  }, [type]);

  // Check which items are already imported
  const checkImportedItems = useCallback(async (items: TMDBItem[]) => {
    if (items.length === 0) return;
    
    setCheckingImports(true);
    try {
      const tmdbIds = items.map(item => item.id);
      const typeParam = items[0]?.type || 'movie';
      
      const response = await fetch('/api/tmdb/import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbIds, type: typeParam }),
      });
      
      const data = await response.json();
      if (data.importedIds) {
        setImportedIds(new Set(data.importedIds));
      }
    } catch (error) {
      console.error('Error checking imported items:', error);
    } finally {
      setCheckingImports(false);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());
    setImportedIds(new Set());
    setCurrentPage(1);
    
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (year) params.set('year', year);
      if (genre) params.set('genre', genre);
      if (searchQuery) params.set('query', searchQuery);
      params.set('count', count);

      const response = await fetch(`/api/tmdb/search?${params.toString()}`);
      const data = await response.json();
      const fetchedResults = data.results || [];
      setResults(fetchedResults);
      
      // Check which are already imported
      if (fetchedResults.length > 0) {
        checkImportedItems(fetchedResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [type, year, genre, count, searchQuery, checkImportedItems]);

  const toggleSelect = (id: number) => {
    // Don't allow selecting already imported items
    if (importedIds.has(id)) return;
    
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    // Only select non-imported items on current page
    const availableIds = paginatedResults
      .filter(r => !importedIds.has(r.id))
      .map(r => r.id);
    
    const currentPageSelected = availableIds.every(id => selectedIds.has(id));
    
    if (currentPageSelected) {
      // Deselect current page available items
      const newSelected = new Set(selectedIds);
      availableIds.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
    } else {
      // Select current page available items
      const newSelected = new Set(selectedIds);
      availableIds.forEach(id => newSelected.add(id));
      setSelectedIds(newSelected);
    }
  };

  const selectAllResults = () => {
    // Only select non-imported items
    const availableIds = results
      .filter(r => !importedIds.has(r.id))
      .map(r => r.id);
    
    if (selectedIds.size === availableIds.length && availableIds.every(id => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableIds));
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    
    setImporting(true);

    const selectedItems = results.filter((r) => selectedIds.has(r.id));
    
    try {
      const response = await fetch('/api/tmdb/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems.map(item => ({ id: item.id, type: item.type })) }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const message = data.errors && data.errors.length > 0
          ? `Successfully imported ${data.count} items! (${data.errors.length} failed)`
          : `Successfully imported ${data.count} items!`;
        
        alert(message);
        
        // Mark imported items
        const newImported = new Set(importedIds);
        selectedIds.forEach(id => newImported.add(id));
        setImportedIds(newImported);
        
        // Clear selection
        setSelectedIds(new Set());
      } else {
        alert('Import failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import items');
    } finally {
      setImporting(false);
    }
  };

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage, '...', totalPages);
      }
    }
    
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button
              key={idx}
              onClick={() => goToPage(page)}
              className={cn(
                'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {page}
            </button>
          ) : (
            <span key={idx} className="text-gray-500 px-2">...</span>
          )
        ))}
        
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Stats
  const availableCount = results.filter(r => !importedIds.has(r.id)).length;
  const importedCount = importedIds.size;

  if (!_hasHydrated || !admin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-red-500">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">TMDB Generator</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Selected: {selectedIds.size}</span>
            <button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importing}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                selectedIds.size > 0 && !importing
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              )}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import ({selectedIds.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <h2 className="text-white font-semibold">Search Filters</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setType('movie'); setSelectedIds(new Set()); setResults([]); }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
                    type === 'movie' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                  )}
                >
                  <Film className="w-4 h-4" />
                  Movies
                </button>
                <button
                  onClick={() => { setType('tv'); setSelectedIds(new Set()); setResults([]); }}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
                    type === 'tv' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
                  )}
                >
                  <Tv className="w-4 h-4" />
                  TV Series
                </button>
              </div>
            </div>

            {/* Year */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Genre */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Genre</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Count - Custom Input */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Count (Post Limit)</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="Enter number..."
                min="1"
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Quick Count Buttons */}
          <div className="flex flex-wrap gap-2">
            <span className="text-gray-400 text-sm">Quick:</span>
            {[20, 50, 100, 200, 500, 1000].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n.toString())}
                className={cn(
                  'px-3 py-1 rounded text-xs font-medium transition-colors',
                  count === n.toString()
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Search by Title (Optional)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search ${type === 'movie' ? 'movies' : 'TV series'}...`}
                  className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        {results.length > 0 && (
          <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-4 py-2">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white">Total: <span className="font-bold">{results.length}</span></span>
              <span className="text-green-500">Available: <span className="font-bold">{availableCount}</span></span>
              <span className="text-yellow-500">Imported: <span className="font-bold">{importedCount}</span></span>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 text-red-500 text-sm font-medium"
                >
                  <div className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                    paginatedResults.filter(r => !importedIds.has(r.id)).every(r => selectedIds.has(r.id))
                      ? 'bg-red-500 border-red-500'
                      : 'border-gray-500'
                  )}>
                    {paginatedResults.filter(r => !importedIds.has(r.id)).every(r => selectedIds.has(r.id)) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  Select Page ({paginatedResults.filter(r => !importedIds.has(r.id)).length})
                </button>
                <button
                  onClick={selectAllResults}
                  className="flex items-center gap-2 text-gray-400 text-sm font-medium hover:text-red-500 transition-colors"
                >
                  Select All Available ({availableCount})
                </button>
              </div>
              <div className="text-gray-400 text-sm">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {/* Checking imports indicator */}
            {checkingImports && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking existing imports...
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-4 gap-3">
              {paginatedResults.map((item) => {
                const isImported = importedIds.has(item.id);
                const isSelected = selectedIds.has(item.id);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={cn(
                      'relative rounded-md overflow-hidden transition-all',
                      isImported ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                      isSelected ? 'ring-2 ring-red-500' : ''
                    )}
                  >
                    <div className="aspect-[2/3] relative">
                      {item.poster ? (
                        <Image
                          src={item.poster}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Already imported badge */}
                      {isImported && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                            <span className="text-green-500 text-xs font-medium">Imported</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay when selected */}
                      {isSelected && !isImported && (
                        <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                            <Check className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      
                      {/* Rating */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded text-xs">
                        <span className="text-yellow-500">★</span>
                        <span className="text-white text-[10px]">{item.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-2 bg-gray-800">
                      <h3 className="text-white text-xs font-medium line-clamp-1">{item.title}</h3>
                      <p className="text-gray-400 text-[10px]">{item.year} • {item.type === 'movie' ? `${item.duration} min` : `${item.seasons} Season${item.seasons > 1 ? 's' : ''}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="text-center py-20">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Use the filters above to search for {type === 'movie' ? 'movies' : 'TV series'}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Fetching from TMDB...</p>
          </div>
        )}
      </div>
    </div>
  );
}
