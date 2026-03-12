'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import { Header } from '@/components/movie/Header';
import { Plus, Film, Tv, LogOut, Edit, Trash2, Loader2, RefreshCw, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string;
  tmdbId?: number | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string;
  tmdbId?: number | null;
}

const ITEMS_PER_PAGE = 30;

export default function AdminDashboardPage() {
  const { admin, logoutAdmin, _hasHydrated } = useAppStore();
  const { themeColor } = useSettingsStore();
  const router = useRouter();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [stats, setStats] = useState({
    movies: 0,
    series: 0,
  });
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection state
  const [selectedMovies, setSelectedMovies] = useState<Set<string>>(new Set());
  const [selectedSeries, setSelectedSeries] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and paginate data
  const getFilteredData = (data: (Movie | Series)[]) => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      item.title.toLowerCase().includes(query) ||
      String(item.year).includes(query)
    );
  };

  const getPaginatedData = (data: (Movie | Series)[]) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };

  const getTotalPages = (total: number) => Math.ceil(total / ITEMS_PER_PAGE);

  // Get filtered and paginated results
  const filteredMovies = getFilteredData(movies);
  const filteredSeries = getFilteredData(series);
  
  const paginatedMovies = getPaginatedData(filteredMovies);
  const paginatedSeries = getPaginatedData(filteredSeries);

  const movieTotalPages = getTotalPages(filteredMovies.length);
  const seriesTotalPages = getTotalPages(filteredSeries.length);

  // Reset to page 1 when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
    // Clear selection when tab changes
    setSelectedMovies(new Set());
    setSelectedSeries(new Set());
  }, [activeTab, searchQuery]);

  // Wait for hydration before checking admin
  useEffect(() => {
    if (_hasHydrated && !admin) {
      router.push('/admin/login');
    }
  }, [_hasHydrated, admin, router]);

  // Fetch data when admin is available
  const fetchData = useCallback(async () => {
    if (!admin) return;
    
    setLoading(true);
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        fetch('/api/movies?limit=9999'),
        fetch('/api/series?limit=9999')
      ]);

      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        setMovies(moviesData.movies || []);
        setStats((prev) => ({ ...prev, movies: moviesData.total || 0 }));
      }

      if (seriesRes.ok) {
        const seriesData = await seriesRes.json();
        setSeries(seriesData.series || []);
        setStats((prev) => ({ ...prev, series: seriesData.total || 0 }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    if (admin) {
      fetchData();
    }
  }, [admin, fetchData]);

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
      await fetchData();
      
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
        if (type === 'movie') {
          setMovies(movies.filter(m => m.id !== id));
          setStats(prev => ({ ...prev, movies: prev.movies - 1 }));
          // Remove from selection if selected
          setSelectedMovies(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        } else {
          setSeries(series.filter(s => s.id !== id));
          setStats(prev => ({ ...prev, series: prev.series - 1 }));
          // Remove from selection if selected
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

  // Pagination controls
  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
                currentPage === page ? 'text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}
              style={currentPage === page ? { backgroundColor: themeColor } : {}}
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
          <span className="px-2 py-1 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: themeColor }}>
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }

  // Redirect if not admin
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header title="Admin Dashboard" showSearch={false} />

      <div className="p-4">
        {/* Admin Info */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: themeColor }}>
              <span className="text-white font-bold">{admin.username.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white font-medium">{admin.username}</p>
              <p className="text-gray-400 text-xs">Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm"
              style={{ color: themeColor }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            <Film className="w-6 h-6 mx-auto mb-2" style={{ color: themeColor }} />
            <p className="text-white text-xl font-bold">{stats.movies}</p>
            <p className="text-gray-500 text-xs">Movies</p>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg text-center">
            <Tv className="w-6 h-6 mx-auto mb-2" style={{ color: themeColor }} />
            <p className="text-white text-xl font-bold">{stats.series}</p>
            <p className="text-gray-500 text-xs">Series</p>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('movies')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'movies'
                ? 'text-white'
                : 'bg-gray-800 text-gray-400'
            )}
            style={activeTab === 'movies' ? { backgroundColor: themeColor } : {}}
          >
            Movies ({filteredMovies.length})
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'series'
                ? 'text-white'
                : 'bg-gray-800 text-gray-400'
            )}
            style={activeTab === 'series' ? { backgroundColor: themeColor } : {}}
          >
            Series ({filteredSeries.length})
          </button>
          
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} by title or year...`}
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ focusRingColor: themeColor }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex-1" />
          <button 
            onClick={() => router.push('/admin/tmdb')}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium"
            style={{ backgroundColor: themeColor }}
          >
            <Plus className="w-4 h-4" />
            Add from TMDB
          </button>
        </div>

        {/* Results Info */}
        {!loading && (
          <div className="text-gray-400 text-xs mb-2">
            {activeTab === 'movies' && `Showing ${paginatedMovies.length} of ${filteredMovies.length} movies`}
            {activeTab === 'series' && `Showing ${paginatedSeries.length} of ${filteredSeries.length} series`}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
          </div>
        )}

        {/* Content List */}
        {!loading && (
          <div className="space-y-2">
            {/* Selection Bar */}
            <SelectionBar />

            {activeTab === 'movies' && filteredMovies.length === 0 && (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                <Film className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{searchQuery ? 'No movies found' : 'No movies yet'}</p>
                <p className="text-gray-500 text-xs mt-1">Use TMDB Generator to add movies</p>
              </div>
            )}

            {activeTab === 'series' && filteredSeries.length === 0 && (
              <div className="text-center py-10 bg-gray-800/50 rounded-lg">
                <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{searchQuery ? 'No series found' : 'No series yet'}</p>
                <p className="text-gray-500 text-xs mt-1">Use TMDB Generator to add series</p>
              </div>
            )}

            {activeTab === 'movies' &&
              paginatedMovies.map((movie) => {
                const isSelected = selectedMovies.has(movie.id);
                return (
                  <div
                    key={movie.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      isSelected ? "bg-gray-700 ring-2" : "bg-gray-800"
                    )}
                    style={isSelected ? { ringColor: themeColor } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleMovieSelection(movie.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                          isSelected
                            ? "border-transparent"
                            : "border-gray-500 bg-gray-700 hover:border-gray-400 hover:bg-gray-600"
                        )}
                        style={isSelected ? { backgroundColor: themeColor } : {}}
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
                          {movie.tmdbId && <span className="ml-2" style={{ color: themeColor }}>TMDB</span>}
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
              paginatedSeries.map((s) => {
                const isSelected = selectedSeries.has(s.id);
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg transition-colors",
                      isSelected ? "bg-gray-700 ring-2" : "bg-gray-800"
                    )}
                    style={isSelected ? { ringColor: themeColor } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleSeriesSelection(s.id)}
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                          isSelected
                            ? "border-transparent"
                            : "border-gray-500 bg-gray-700 hover:border-gray-400 hover:bg-gray-600"
                        )}
                        style={isSelected ? { backgroundColor: themeColor } : {}}
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
                          {s.tmdbId && <span className="ml-2" style={{ color: themeColor }}>TMDB</span>}
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
            {activeTab === 'movies' && renderPagination(movieTotalPages, filteredMovies.length)}
            {activeTab === 'series' && renderPagination(seriesTotalPages, filteredSeries.length)}
          </div>
        )}
      </div>
    </div>
  );
}
