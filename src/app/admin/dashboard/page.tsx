'use client';

import { useEffect, useState, useCallback, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/movie/Header';
import { Plus, Film, Tv, LogOut, Edit, Trash2, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Check, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string;
  tmdbId?: number | null;
  updatedAt?: string | null;
  genres?: string;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string;
  tmdbId?: number | null;
  updatedAt?: string | null;
  genres?: string;
}

// Helper function to format relative time
function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hr ago`;
  } else if (diffInDays === 1) {
    return '1 day ago';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else {
    const months = Math.floor(diffInDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
}

const ITEMS_PER_PAGE = 30;

function DashboardContent() {
  const { admin, logoutAdmin, _hasHydrated } = useAppStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get page and tab from URL
  const pageParam = searchParams.get('page');
  const tabParam = searchParams.get('tab');
  const searchParamValue = searchParams.get('search');
  const genreParam = searchParams.get('genre');
  const yearParam = searchParams.get('year');
  
  const currentPage = parseInt(pageParam || '1', 10);
  const activeTab = (tabParam === 'series' ? 'series' : 'movies') as 'movies' | 'series';
  const initialSearch = searchParamValue || '';
  
  // Data state - only current page data
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  
  // Stats state - total counts
  const [stats, setStats] = useState({
    movies: 0,
    series: 0,
  });
  
  // Total filtered counts for pagination
  const [filteredCounts, setFilteredCounts] = useState({
    movies: 0,
    series: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection state
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Filter state
  const [selectedGenre, setSelectedGenre] = useState<string>(genreParam || '');
  const [selectedYear, setSelectedYear] = useState<string>(yearParam || '');
  const [showFilters, setShowFilters] = useState(false);
  
  // Available genres and years (fetched separately)
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [allYears, setAllYears] = useState<number[]>([]);
  
  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate total pages
  const movieTotalPages = Math.ceil(filteredCounts.movies / ITEMS_PER_PAGE);
  const seriesTotalPages = Math.ceil(filteredCounts.series / ITEMS_PER_PAGE);

  // Wait for hydration before checking admin
  useEffect(() => {
    if (_hasHydrated && !admin) {
      router.push('/admin/login');
    }
  }, [_hasHydrated, admin, router]);

  // Fetch stats (total counts) - lightweight operation with minimal data
  const fetchStats = useCallback(async () => {
    if (!admin) return;
    
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/api/movies?limit=1&minimal=true'), // Only need count
        fetch('/api/series?limit=1&minimal=true')
      ]);

      if (moviesRes.ok) {
        const data = await moviesRes.json();
        setStats(prev => ({ ...prev, movies: data.total || 0 }));
      }

      if (seriesRes.ok) {
        const data = await seriesRes.json();
        setStats(prev => ({ ...prev, series: data.total || 0 }));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [admin]);

  // Fetch available genres and years (only once on mount)
  const fetchFilters = useCallback(async () => {
    if (!admin) return;
    
    try {
      // Fetch all unique genres from database
      const [genresRes] = await Promise.all([
        fetch('/api/genres'),
      ]);

      if (genresRes.ok) {
        const data = await genresRes.json();
        // API returns: { genres: { movies: [...], series: [...] } }
        const movieGenres = (data.genres?.movies || []).map((g: any) => g.name);
        const seriesGenres = (data.genres?.series || []).map((g: any) => g.name);
        setAllGenres([...new Set([...movieGenres, ...seriesGenres])].sort());
      }
      
      // Generate years from 1950 to current year
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let y = currentYear; y >= 1950; y--) {
        years.push(y);
      }
      setAllYears(years);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  }, [admin]);

  // Fetch current page data - SERVER-SIDE PAGINATION with MINIMAL data
  const fetchCurrentPage = useCallback(async () => {
    if (!admin) return;
    
    setLoading(true);
    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      
      // Build query params - use minimal=true for Admin Dashboard
      const movieParams = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String(offset),
        minimal: 'true', // Only fetch essential fields
      });
      const seriesParams = new URLSearchParams({
        limit: String(ITEMS_PER_PAGE),
        offset: String(offset),
        minimal: 'true', // Only fetch essential fields
      });
      
      if (searchQuery.trim()) {
        movieParams.set('search', searchQuery.trim());
        seriesParams.set('search', searchQuery.trim());
      }
      
      if (selectedGenre) {
        movieParams.set('genre', selectedGenre);
        seriesParams.set('genre', selectedGenre);
      }
      
      // Year filter needs to be applied on client side or add API support
      // For now, we'll filter year on client side after fetch

      const [moviesRes, seriesRes] = await Promise.all([
        fetch(`/api/movies?${movieParams.toString()}`),
        fetch(`/api/series?${seriesParams.toString()}`)
      ]);

      if (moviesRes.ok) {
        const data = await moviesRes.json();
        let filteredMovies = data.movies || [];
        
        // Apply year filter on client side
        if (selectedYear) {
          filteredMovies = filteredMovies.filter((m: Movie) => String(m.year) === selectedYear);
        }
        
        setMovies(filteredMovies);
        setFilteredCounts(prev => ({ 
          ...prev, 
          movies: selectedYear ? filteredMovies.length : (data.total || 0)
        }));
      }

      if (seriesRes.ok) {
        const data = await seriesRes.json();
        let filteredSeries = data.series || [];
        
        // Apply year filter on client side
        if (selectedYear) {
          filteredSeries = filteredSeries.filter((s: Series) => String(s.year) === selectedYear);
        }
        
        setSeries(filteredSeries);
        setFilteredCounts(prev => ({ 
          ...prev, 
          series: selectedYear ? filteredSeries.length : (data.total || 0)
        }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, searchQuery, selectedGenre, selectedYear]);

  // Initial fetch on mount
  useEffect(() => {
    if (admin) {
      fetchStats();
      fetchFilters();
      fetchCurrentPage();
    }
  }, [admin, fetchStats, fetchFilters, fetchCurrentPage]);

  const handleLogout = () => {
    logoutAdmin();
    router.push('/');
  };

  // Toggle selection for a single item
  const toggleMovieSelection = (id: string) => {
    setSelectedMovies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSeriesSelection = (id: string) => {
    setSelectedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedMovies(new Set());
    setSelectedSeries(new Set());
  };

  // Select all items on current page
  const selectAllPage = () => {
    if (activeTab === 'movies') {
      const allIds = movies.map(m => m.id);
      const allSelected = allIds.every(id => selectedMovies.has(id));
      
      if (allSelected) {
        setSelectedMovies(new Set());
      } else {
        setSelectedMovies(new Set(allIds));
      }
    } else {
      const allIds = series.map(s => s.id);
      const allSelected = allIds.every(id => selectedSeries.has(id));
      
      if (allSelected) {
        setSelectedSeries(new Set());
      } else {
        setSelectedSeries(new Set(allIds));
      }
    }
  };

  // Check if all items on current page are selected
  const isAllSelected = useMemo(() => {
    if (activeTab === 'movies') {
      return movies.length > 0 && movies.every(m => selectedMovies.has(m.id));
    } else {
      return series.length > 0 && series.every(s => selectedSeries.has(s.id));
    }
  }, [activeTab, movies, series, selectedMovies, selectedSeries]);

  // Clear filters
  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setSearchQuery('');
    
    // Update URL
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('page', '1');
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  // Delete selected items
  const handleDeleteSelected = async () => {
    const selectedCount = activeTab === 'movies' ? selectedMovies.size : selectedSeries.size;
    const type = activeTab === 'movies' ? 'movie' : 'series';
    
    if (selectedCount === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedCount} selected ${type}${selectedCount > 1 ? 's' : ''}?`)) return;
    
    setIsDeleting(true);
    const ids = activeTab === 'movies' ? Array.from(selectedMovies) : Array.from(selectedSeries);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const id of ids) {
        const endpoint = type === 'movie' ? `/api/movies/${id}` : `/api/series/${id}`;
        const res = await fetch(endpoint, { method: 'DELETE' });
        
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      if (failCount > 0) {
        alert(`${successCount} ${type}${successCount > 1 ? 's' : ''} deleted successfully.\n${failCount} failed to delete.`);
      }
      
      // Refresh data
      await Promise.all([fetchStats(), fetchCurrentPage()]);
      
      // Clear selections
      if (type === 'movie') {
        setSelectedMovies(new Set());
      } else {
        setSelectedSeries(new Set());
      }
      
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDelete = async (id: string, type: 'movie' | 'series') => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    setDeleteId(id);
    try {
      const endpoint = type === 'movie' ? `/api/movies/${id}` : `/api/series/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (res.ok) {
        // Update local state
        if (type === 'movie') {
          setMovies(movies.filter(m => m.id !== id));
          setStats(prev => ({ ...prev, movies: prev.movies - 1 }));
          setFilteredCounts(prev => ({ ...prev, movies: prev.movies - 1 }));
          setSelectedMovies(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        } else {
          setSeries(series.filter(s => s.id !== id));
          setStats(prev => ({ ...prev, series: prev.series - 1 }));
          setFilteredCounts(prev => ({ ...prev, series: prev.series - 1 }));
          setSelectedSeries(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      } else {
        alert('Failed to delete. Please try again.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete. Please try again.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (item: Movie | Series, type: 'movie' | 'series') => {
    router.push(`/admin/edit/${type}/${item.id}`);
  };

  // Pagination controls - URL-based
  const goToPage = (page: number) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('page', String(page));
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedYear) params.set('year', selectedYear);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  // Tab switch - URL-based
  const switchTab = (tab: 'movies' | 'series') => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    params.set('page', '1');
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (selectedYear) params.set('year', selectedYear);
    router.push(`/admin/dashboard?${params.toString()}`);
    // Clear selection when tab changes
    setSelectedMovies(new Set());
    setSelectedSeries(new Set());
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout - debounce 500ms
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('tab', activeTab);
      params.set('page', '1');
      if (value) params.set('search', value);
      if (selectedGenre) params.set('genre', selectedGenre);
      if (selectedYear) params.set('year', selectedYear);
      router.push(`/admin/dashboard?${params.toString()}`);
    }, 500);
  };

  // Handle filter changes
  const handleGenreChange = (value: string) => {
    setSelectedGenre(value);
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('page', '1');
    if (searchQuery) params.set('search', searchQuery);
    if (value) params.set('genre', value);
    if (selectedYear) params.set('year', selectedYear);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    params.set('page', '1');
    if (searchQuery) params.set('search', searchQuery);
    if (selectedGenre) params.set('genre', selectedGenre);
    if (value) params.set('year', value);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  const renderPagination = (totalPages: number, total: number) => {
    if (totalPages <= 1) return null;
    
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
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
      <div className="flex items-center justify-center gap-1 py-4 mt-4">
        <button 
          onClick={() => goToPage(currentPage - 1)} 
          disabled={currentPage === 1}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages.map((page, idx) => (
          typeof page === 'number' ? (
            <button 
              key={idx} 
              onClick={() => goToPage(page)}
              className={cn('w-10 h-10 rounded-lg text-sm font-medium',
                currentPage === page ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}
            >
              {page}
            </button>
          ) : <span key={idx} className="text-gray-500 px-2">...</span>
        ))}
        <button 
          onClick={() => goToPage(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  // Selection bar component
  const SelectionBar = () => {
    const selectedCount = activeTab === 'movies' ? selectedMovies.size : selectedSeries.size;
    
    if (selectedCount === 0) return null;
    
    return (
      <div className="sticky top-16 z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded-lg text-sm font-medium text-white bg-red-500">
            {selectedCount} Item{selectedCount > 1 ? 's' : ''} Selected
          </span>
          <button
            onClick={clearSelections}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
        <button
          onClick={handleDeleteSelected}
          disabled={isDeleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </>
          )}
        </button>
      </div>
    );
  };

  // Show loading during hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  // Redirect if not admin
  if (!admin) return null;

  // Current page data based on active tab
  const currentData = activeTab === 'movies' ? movies : series;
  const totalCount = activeTab === 'movies' ? filteredCounts.movies : filteredCounts.series;
  const totalPages = activeTab === 'movies' ? movieTotalPages : seriesTotalPages;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header title="Admin Dashboard" showSearch={false} />

      <div className="p-4">
        {/* Admin Info */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500">
              <span className="text-white font-bold">{admin.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-medium">{admin.username}</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchStats(); fetchCurrentPage(); }}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-red-500"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            <Film className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-white text-xl font-bold">{stats.movies}</p>
            <p className="text-gray-500 text-xs">Movies</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            <Tv className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-white text-xl font-bold">{stats.series}</p>
            <p className="text-gray-500 text-xs">Series</p>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => switchTab('movies')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'movies'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400'
            )}
          >
            Movies ({filteredCounts.movies})
          </button>
          <button
            onClick={() => switchTab('series')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'series'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400'
            )}
          >
            Series ({filteredCounts.series})
          </button>
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={`Search ${activeTab} by title...`}
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
              showFilters || selectedGenre || selectedYear
                ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(selectedGenre || selectedYear) && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          <div className="flex-1" />
          <button 
            onClick={() => router.push('/admin/tmdb')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add from TMDB
          </button>
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg flex-wrap">
            {/* Genre Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs">Genre:</label>
              <select
                value={selectedGenre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[120px]"
              >
                <option value="">All Genres</option>
                {allGenres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label className="text-gray-400 text-xs">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="bg-gray-700 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-w-[100px]"
              >
                <option value="">All Years</option>
                {allYears.map(year => (
                  <option key={year} value={String(year)}>{year}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedGenre || selectedYear || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 ml-2"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Results Info */}
        {!loading && (
          <div className="text-gray-400 text-xs mb-2">
            {activeTab === 'movies' && `Showing ${movies.length} of ${filteredCounts.movies} movies`}
            {activeTab === 'series' && `Showing ${series.length} of ${filteredCounts.series} series`}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        )}

        {/* Content List */}
        {!loading && (
          <div className="space-y-2">
            {/* Selection Bar */}
            <SelectionBar />

            {/* Select All Header */}
            {currentData.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-2">
                <button
                  onClick={selectAllPage}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                    isAllSelected
                      ? "bg-red-500 border-transparent"
                      : "border-gray-500 bg-gray-700 hover:border-gray-400 hover:bg-gray-600"
                  )}
                >
                  {isAllSelected && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-gray-400 text-sm">
                  {isAllSelected ? 'Deselect all on this page' : 'Select all on this page'}
                </span>
                <span className="text-gray-500 text-xs">
                  ({currentData.length} items)
                </span>
              </div>
            )}

            {activeTab === 'movies' && movies.length === 0 && (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{searchQuery || selectedGenre || selectedYear ? 'No movies found' : 'No movies yet'}</p>
                <p className="text-gray-500 text-xs mt-1">Use TMDB Generator to add movies</p>
              </div>
            )}

            {activeTab === 'series' && series.length === 0 && (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{searchQuery || selectedGenre || selectedYear ? 'No series found' : 'No series yet'}</p>
                <p className="text-gray-500 text-xs mt-1">Use TMDB Generator to add series</p>
              </div>
            )}

            {activeTab === 'movies' &&
              movies.map((movie) => {
                const isSelected = selectedMovies.has(movie.id);
                return (
                  <div
                    key={movie.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      isSelected ? "bg-gray-700 ring-2 ring-red-500" : "bg-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleMovieSelection(movie.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                          isSelected
                            ? "bg-red-500 border-transparent"
                            : "border-gray-500 bg-gray-700 hover:border-gray-400 hover:bg-gray-600"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      
                      {movie.poster ? (
                        <img 
                          src={movie.poster} 
                          alt={movie.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                          <Film className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{movie.title}</p>
                        <p className="text-gray-500 text-xs">
                          {movie.year} • Rating: {movie.rating}
                          {movie.tmdbId && <span className="ml-2 text-red-500">TMDB</span>}
                          {movie.updatedAt && <span className="ml-2 text-green-500">• {getRelativeTime(movie.updatedAt)}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(movie, 'movie')}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(movie.id, 'movie')}
                        disabled={deleteId === movie.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deleteId === movie.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'series' &&
              series.map((s) => {
                const isSelected = selectedSeries.has(s.id);
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      isSelected ? "bg-gray-700 ring-2 ring-red-500" : "bg-gray-800"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSeriesSelection(s.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                          isSelected
                            ? "bg-red-500 border-transparent"
                            : "border-gray-500 bg-gray-700 hover:border-gray-400 hover:bg-gray-600"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                      
                      {s.poster ? (
                        <img 
                          src={s.poster} 
                          alt={s.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                          <Tv className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{s.title}</p>
                        <p className="text-gray-500 text-xs">
                          {s.year} • Rating: {s.rating}
                          {s.tmdbId && <span className="ml-2 text-red-500">TMDB</span>}
                          {s.updatedAt && <span className="ml-2 text-green-500">• {getRelativeTime(s.updatedAt)}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(s, 'series')}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id, 'series')}
                        disabled={deleteId === s.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deleteId === s.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

            {/* Pagination */}
            {activeTab === 'movies' && renderPagination(movieTotalPages, filteredCounts.movies)}
            {activeTab === 'series' && renderPagination(seriesTotalPages, filteredCounts.series)}
          </div>
        )}
      </div>
    </div>
  );
}

// Show loading during hydration
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-red-500" />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardContent />
    </Suspense>
  );
}
