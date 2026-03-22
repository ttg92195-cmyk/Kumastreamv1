'use client';

import { Header } from '@/components/movie/Header';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

export default function BookmarkPage() {
  const { bookmarks } = useAppStore();
  const themeColor = useSettingsStore(s => s.themeColor);

  const movies = bookmarks.filter((b) => b.type === 'movie' && b.movie);
  const series = bookmarks.filter((b) => b.type === 'series' && b.series);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Header title="Bookmark" showSearch={false} />

      <div className="p-4">
        {bookmarks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-2">No bookmarks yet</p>
            <p className="text-gray-600 text-xs">
              Open a movie or series and tap the heart icon to save it here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Movies Section */}
            {movies.length > 0 && (
              <section>
                <h2 className="text-white font-semibold mb-3">Movies ({movies.length})</h2>
                <div className="grid grid-cols-3 gap-2">
                  {movies.map((bookmark) => (
                    bookmark.movie && (
                      <MovieCard
                        key={bookmark.id}
                        id={bookmark.movie.id}
                        title={bookmark.movie.title}
                        year={bookmark.movie.year}
                        rating={bookmark.movie.rating}
                        poster={bookmark.movie.poster}
                        quality4k={bookmark.movie.quality4k}
                        quality={bookmark.movie.quality}
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
                  {series.map((bookmark) => (
                    bookmark.series && (
                      <MovieCard
                        key={bookmark.id}
                        id={bookmark.series.id}
                        title={bookmark.series.title}
                        year={bookmark.series.year}
                        rating={bookmark.series.rating}
                        poster={bookmark.series.poster}
                        quality4k={bookmark.series.quality4k}
                        quality={bookmark.series.quality}
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
