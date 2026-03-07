'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/movie/Header';
import { MovieCard } from '@/components/movie/MovieCard';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(query);

  const performSearch = useCallback(async (q: string) => {
    if (!q) return;
    
    setLoading(true);
    try {
      const [movieData, seriesData] = await Promise.all([
        fetch(`/api/movies?search=${encodeURIComponent(q)}`).then((res) => res.json()),
        fetch(`/api/series?search=${encodeURIComponent(q)}`).then((res) => res.json()),
      ]);
      setMovies(movieData.movies || []);
      setSeries(seriesData.series || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header searchPlaceholder="Search movies and series..." onSearch={handleSearch} />

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {movies.length > 0 && (
              <section>
                <h2 className="text-white font-semibold text-lg mb-3">
                  Movies ({movies.length})
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      id={movie.id}
                      title={movie.title}
                      year={movie.year}
                      rating={movie.rating}
                      poster={movie.poster}
                      quality4k={movie.quality4k}
                      quality={movie.quality}
                      type="movie"
                    />
                  ))}
                </div>
              </section>
            )}

            {series.length > 0 && (
              <section>
                <h2 className="text-white font-semibold text-lg mb-3">
                  Series ({series.length})
                </h2>
                <div className="grid grid-cols-3 gap-3">
                  {series.map((s) => (
                    <MovieCard
                      key={s.id}
                      id={s.id}
                      title={s.title}
                      year={s.year}
                      rating={s.rating}
                      poster={s.poster}
                      quality4k={s.quality4k}
                      quality={s.quality}
                      type="series"
                    />
                  ))}
                </div>
              </section>
            )}

            {!loading && movies.length === 0 && series.length === 0 && searchQuery && (
              <div className="text-center py-20">
                <p className="text-gray-500">No results found for &quot;{searchQuery}&quot;</p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-20">
                <p className="text-gray-500">Search for movies and series</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
