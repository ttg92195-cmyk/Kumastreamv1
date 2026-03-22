'use client';

import { Header } from '@/components/movie/Header';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import { Trash2 } from 'lucide-react';

export default function RecentPage() {
  const { recents, clearRecents } = useAppStore();
  const themeColor = useSettingsStore(s => s.themeColor);

  const movies = recents.filter((r) => r.type === 'movie' && r.movie);
  const series = recents.filter((r) => r.type === 'series' && r.series);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Recent" showSearch={false} />

      <div className="p-4">
        {recents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No recent views</p>
            <p className="text-gray-600 text-xs">
              Movies and series you watch will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clear Button */}
            <div className="flex justify-end">
              <button
                onClick={clearRecents}
                className="flex items-center gap-1 text-red-500 text-xs"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            </div>

            {/* Movies Section */}
            {movies.length > 0 && (
              <section>
                <h2 className="text-white font-semibold mb-3">Movies ({movies.length})</h2>
                <div className="grid grid-cols-3 gap-2">
                  {movies.map((recent) => (
                    recent.movie && (
                      <MovieCard
                        key={recent.id}
                        id={recent.movie.id}
                        title={recent.movie.title}
                        year={recent.movie.year}
                        rating={recent.movie.rating}
                        poster={recent.movie.poster}
                        quality4k={recent.movie.quality4k}
                        quality={recent.movie.quality}
                        type="movie"
                        themeColor={themeColor}
                      />
                    )
                  ))}
                </div>
              </section>
            )}

            {/* Series Section */}
            {series.length > 0 && (
              <section>
                <h2 className="text-white font-semibold mb-3">Series ({series.length})</h2>
                <div className="grid grid-cols-3 gap-2">
                  {series.map((recent) => (
                    recent.series && (
                      <MovieCard
                        key={recent.id}
                        id={recent.series.id}
                        title={recent.series.title}
                        year={recent.series.year}
                        rating={recent.series.rating}
                        poster={recent.series.poster}
                        quality4k={recent.series.quality4k}
                        quality={recent.series.quality}
                        type="series"
                        themeColor={themeColor}
                      />
                    )
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
