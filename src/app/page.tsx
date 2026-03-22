'use client';

import { useEffect, useState } from 'react';
import { Menu, Search, X, ChevronRight, Film, Tv } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string | null;
  quality4k: boolean;
  quality?: string | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster?: string | null;
  quality4k: boolean;
  quality?: string | null;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleSidebar, searchQuery, setSearchQuery } = useAppStore();
  const { themeColor } = useSettingsStore();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, seriesRes] = await Promise.all([
          fetch('/api/movies?limit=10'),
          fetch('/api/series?limit=10')
        ]);

        const [moviesData, seriesData] = await Promise.all([
          moviesRes.json(),
          seriesRes.json()
        ]);

        if (moviesRes.ok) {
          setMovies((moviesData?.movies || []).filter((m: Movie) => m?.id && m?.title));
        }

        if (seriesRes.ok) {
          setSeries((seriesData?.series || []).filter((s: Series) => s?.id && s?.title));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={toggleSidebar} 
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
            style={{ color: themeColor }}
          >
            <Menu className="w-6 h-6" />
          </button>

          <form onSubmit={handleSearch} className="flex-1 flex items-center">
            <div className="relative w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, series..."
                autoComplete="off"
                className="w-full bg-[#1a1a1a] text-white placeholder-gray-500 pl-10 pr-10 py-2.5 rounded-full text-sm focus:outline-none border border-gray-700 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] bg-gray-800/50 rounded-md" />
                  <div className="mt-1.5 h-3 bg-gray-800/50 rounded w-3/4" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
              {[...Array(10)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] bg-gray-800/50 rounded-md" />
                  <div className="mt-1.5 h-3 bg-gray-800/50 rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Movies Section */}
            {movies.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4" style={{ color: themeColor }} />
                    <h2 className="text-white font-semibold">Movies</h2>
                    <span className="text-gray-500 text-xs">({movies.length})</span>
                  </div>
                  <Link 
                    href="/movies" 
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: themeColor }}
                  >
                    More <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                  {movies.slice(0, 10).map((movie) => (
                    <MovieCard
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      year={movie.year}
                      rating={movie.rating}
                      poster={movie.poster || undefined}
                      quality4k={movie.quality4k}
                      quality={movie.quality}
                      type="movie"
                      themeColor={themeColor}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Series Section */}
            {series.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4" style={{ color: themeColor }} />
                    <h2 className="text-white font-semibold">Series</h2>
                    <span className="text-gray-500 text-xs">({series.length})</span>
                  </div>
                  <Link 
                    href="/series" 
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: themeColor }}
                  >
                    More <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2">
                  {series.slice(0, 10).map((s) => (
                    <MovieCard
                      key={s.id}
                      id={s.id}
                      title={s.title}
                      year={s.year}
                      rating={s.rating}
                      poster={s.poster || undefined}
                      quality4k={s.quality4k}
                      quality={s.quality}
                      type="series"
                      themeColor={themeColor}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* No Content */}
            {movies.length === 0 && series.length === 0 && (
              <div className="text-center py-20">
                <Film className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">No content available</p>
                <p className="text-gray-500 text-sm">Add movies from TMDB Generator</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
