'use client';

import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Star, Calendar, Clock, ChevronDown, Download, Lock, Server, ExternalLink, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CastCard } from '@/components/movie/CastCard';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

// Theme color - RED
const THEME_COLOR = '#ef4444';

interface Cast {
  id: string;
  name: string;
  role: string;
  photo: string | null;
}

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: number;
  poster: string | null;
  backdrop: string | null;
  description: string;
  review: string | null;
  genres: string;
  quality4k: boolean;
  director: string | null;
  fileSize: string | null;
  quality: string | null;
  format: string | null;
  subtitle: string | null;
  imdbRating: number | null;
  rtRating: number | null;
  casts: Cast[];
  downloadLinks?: { server: string; quality: string; url: string; size?: string | null }[];
}

interface SimilarMovie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string | null;
  quality4k: boolean;
  quality?: string | null;
}

// Placeholder image for missing posters
const PLACEHOLDER_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

// Memoized MetaInfo component
const MetaInfo = memo(function MetaInfo({ 
  year, 
  rating, 
  duration 
}: { 
  year: number; 
  rating: number; 
  duration: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-400">
      <div className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        <span>{year}</span>
      </div>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-red-500 fill-red-500" />
        <span>{rating.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span>{duration} min</span>
      </div>
    </div>
  );
});

// Memoized GenreTags component
const GenreTags = memo(function GenreTags({ 
  genres 
}: { 
  genres: string[];
}) {
  if (genres.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {genres.map((genre) => (
        <span
          key={genre}
          className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full"
        >
          {genre.trim()}
        </span>
      ))}
    </div>
  );
});

// Memoized TabButton component
const TabButton = memo(function TabButton({ 
  tab, 
  isActive, 
  onClick 
}: { 
  tab: { id: string; label: string };
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-3 text-sm font-medium transition-colors relative',
        isActive ? 'text-red-500' : 'text-gray-400 hover:text-white'
      )}
    >
      {tab.label}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
      )}
    </button>
  );
});

// Memoized TagBadges component - shows only genres
const TagBadges = memo(function TagBadges({ 
  genreList 
}: { 
  genreList: string[];
}) {
  if (genreList.length === 0) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {genreList.map((genre) => (
        <span key={genre} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
          {genre.trim()}
        </span>
      ))}
    </div>
  );
});

// Memoized CastSection component
const CastSection = memo(function CastSection({ 
  casts 
}: { 
  casts: Cast[];
}) {
  if (!casts || casts.length === 0) return null;
  
  return (
    <div>
      <h3 className="text-white font-semibold mb-3">Casts</h3>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {casts.map((cast) => (
          <CastCard
            key={cast.id}
            name={cast.name}
            role={cast.role}
            photo={cast.photo || undefined}
          />
        ))}
      </div>
    </div>
  );
});

// Memoized DetailInfo component
const DetailInfo = memo(function DetailInfo({ 
  movie 
}: { 
  movie: {
    fileSize: string | null;
    quality: string | null;
    format: string | null;
    genres: string;
    duration: number;
    subtitle: string | null;
    director: string | null;
  };
}) {
  return (
    <div className="space-y-2">
      {movie.fileSize && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">File Size</span>
          <span className="text-white text-sm">{movie.fileSize}</span>
        </div>
      )}
      {movie.quality && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">Quality</span>
          <span className="text-white text-sm">{movie.quality}</span>
        </div>
      )}
      {movie.format && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">Format</span>
          <span className="text-white text-sm">{movie.format}</span>
        </div>
      )}
      {movie.genres && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">Genre</span>
          <span className="text-white text-sm">{movie.genres}</span>
        </div>
      )}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 text-sm min-w-[100px]">Duration</span>
        <span className="text-white text-sm">{formatDuration(movie.duration)}</span>
      </div>
      {movie.subtitle && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">Subtitle</span>
          <span className="text-white text-sm">{movie.subtitle}</span>
        </div>
      )}
      {movie.director && (
        <div className="flex items-start gap-2">
          <span className="text-gray-500 text-sm min-w-[100px]">Director</span>
          <span className="text-white text-sm">{movie.director}</span>
        </div>
      )}
    </div>
  );
});

// Memoized OverviewSection component
const OverviewSection = memo(function OverviewSection({ 
  description, 
  viewMore, 
  onToggle 
}: { 
  description: string;
  viewMore: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <h3 className="text-white font-semibold mb-2">Overview</h3>
      <p className={cn('text-gray-300 text-sm leading-relaxed whitespace-pre-line', !viewMore && 'line-clamp-4')}>
        {description || 'No description available.'}
      </p>
      <button
        onClick={onToggle}
        className="text-sm mt-2 flex items-center gap-1 text-red-500"
      >
        {viewMore ? 'View Less' : 'View More'}
        <ChevronDown className={cn('w-4 h-4 transition-transform', viewMore && 'rotate-180')} />
      </button>
    </div>
  );
});

// Memoized SimilarGrid component
const SimilarGrid = memo(function SimilarGrid({ 
  movies 
}: { 
  movies: SimilarMovie[];
}) {
  if (movies.length === 0) {
    return <p className="text-gray-500 text-center py-10">No similar movies found</p>;
  }
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {movies.map((m) => (
        <MovieCard
          key={m.id}
          id={m.id}
          title={m.title}
          year={m.year}
          rating={m.rating}
          poster={m.poster || PLACEHOLDER_POSTER}
          quality4k={m.quality4k}
          quality={m.quality}
          type="movie"
        />
      ))}
    </div>
  );
});

const tabs = [
  { id: 'detail', label: 'Detail' },
  { id: 'download', label: 'Download' },
  { id: 'explore', label: 'Explore' },
];

export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [expandedServer, setExpandedServer] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // State for deferred addRecent
  const [pendingRecent, setPendingRecent] = useState<{
    id: string;
    type: 'movie';
    movieId: string;
    movie: {
      id: string;
      title: string;
      year: number;
      rating: number;
      poster: string;
      quality4k: boolean;
      quality?: string | null;
    };
    viewedAt: string;
  } | null>(null);

  const { bookmarks, addBookmark, removeBookmark, isBookmarked, addRecent } = useAppStore();
  const { showAllDownloadLinks: downloadLinksEnabled } = useSettingsStore();

  useEffect(() => {
    const id = params.id as string;
    
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/movies/${id}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.movie) {
            const movieData = {
              ...data.movie,
              poster: data.movie.poster || PLACEHOLDER_POSTER,
              backdrop: data.movie.backdrop || data.movie.poster || PLACEHOLDER_POSTER,
            };
            
            setMovie(movieData);
            setSimilarMovies((data.similarMovies || []).map((m: SimilarMovie) => ({
              ...m,
              poster: m.poster || PLACEHOLDER_POSTER,
            })));

            setPendingRecent({
              id: `movie-${movieData.id}`,
              type: 'movie' as const,
              movieId: movieData.id,
              movie: {
                id: movieData.id,
                title: movieData.title,
                year: movieData.year,
                rating: movieData.rating,
                poster: movieData.poster,
                quality4k: movieData.quality4k,
                quality: movieData.quality,
              },
              viewedAt: new Date().toISOString(),
            });
          } else {
            setError('Movie not found');
          }
        } else {
          setError('Failed to load movie');
        }
      } catch (err) {
        console.error('Error fetching movie:', err);
        setError('An error occurred while loading the movie');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [params.id]);

  useEffect(() => {
    if (!loading && pendingRecent && movie) {
      addRecent(pendingRecent);
      setPendingRecent(null);
    }
  }, [loading, pendingRecent, movie, addRecent]);

  const bookmarked = movie ? isBookmarked(movie.id, 'movie') : false;

  const genreList = useMemo(() => {
    return movie?.genres ? movie.genres.split(',').filter(Boolean) : [];
  }, [movie?.genres]);

  useEffect(() => {
    if (showDownloadModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showDownloadModal]);

  const handleBookmark = useCallback(() => {
    if (!movie) return;

    if (bookmarked) {
      const bookmark = bookmarks.find((b) => b.movieId === movie.id);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      addBookmark({
        id: `movie-${movie.id}`,
        type: 'movie',
        movieId: movie.id,
        movie: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          rating: movie.rating,
          poster: movie.poster || PLACEHOLDER_POSTER,
          quality4k: movie.quality4k,
          quality: movie.quality,
        },
      });
    }
  }, [movie, bookmarked, bookmarks, removeBookmark, addBookmark]);

  const handleViewMoreToggle = useCallback(() => {
    setViewMore(prev => !prev);
  }, []);

  const getServerGroups = (links: { server: string; quality: string; url: string; size?: string | null }[]) => {
    const serverMap: Record<string, typeof links> = {};
    
    if (links && links.length > 0) {
      links.forEach(link => {
        const serverName = link.server || 'Server 1';
        if (!serverMap[serverName]) {
          serverMap[serverName] = [];
        }
        serverMap[serverName].push(link);
      });
    }
    
    return Object.entries(serverMap)
      .sort(([a], [b]) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      })
      .map(([name, links]) => ({ name, links }));
  };

  const getDefaultServers = () => {
    const servers = [
      { name: 'Server 1', qualities: ['4K UHD', '1080p', '720p'] },
      { name: 'Server 2', qualities: ['1080p', '720p', '480p'] },
    ];
    return servers;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <div className="relative w-full h-[280px] bg-[#1a1a1a]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
        </div>
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" />
            <div className="flex-1 pb-2 space-y-3">
              <div className="h-7 w-3/4 bg-[#1a1a1a] rounded" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-12 bg-[#1a1a1a] rounded" />
                <div className="h-4 w-8 bg-[#1a1a1a] rounded" />
                <div className="h-4 w-16 bg-[#1a1a1a] rounded" />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
            </div>
            <div className="flex gap-2 border-b border-gray-800 pb-4">
              <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
              <div className="h-6 w-20 bg-[#1a1a1a] rounded" />
              <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full bg-[#1a1a1a] rounded" />
              <div className="h-4 w-full bg-[#1a1a1a] rounded" />
              <div className="h-4 w-3/4 bg-[#1a1a1a] rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{error || 'Movie not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-white rounded-lg text-sm bg-red-500"
        >
          Go Home
        </button>
      </div>
    );
  }

  const posterUrl = movie.poster || PLACEHOLDER_POSTER;
  const backdropUrl = movie.backdrop || posterUrl;
  
  const serverGroups = movie.downloadLinks && movie.downloadLinks.length > 0 
    ? getServerGroups(movie.downloadLinks)
    : [];
  const defaultServers = getDefaultServers();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detail':
        return (
          <div className="space-y-6">
            <OverviewSection 
              description={movie.description || 'No description available.'}
              viewMore={viewMore}
              onToggle={handleViewMoreToggle}
            />

            <DetailInfo movie={movie} />

            <TagBadges genreList={genreList} />

            <CastSection casts={movie.casts || []} />
          </div>
        );

      case 'download':
        // Check if download links are enabled
        if (!downloadLinksEnabled) {
          return (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Options</h3>
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-white font-medium mb-2">Download Links are Hidden</p>
                <p className="text-gray-400 text-sm mb-4">
                  Enable "All Download Link" in Downloads page to view download options
                </p>
                <button
                  onClick={() => router.push('/downloads')}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium bg-red-500"
                >
                  Go to Downloads
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Download Options</h3>
            {serverGroups.length > 0 ? (
              serverGroups.map((server, serverIndex) => (
                <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                  <button
                    onClick={() => setExpandedServer(expandedServer === serverIndex ? null : serverIndex)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/15">
                        <Server className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{server.name}</p>
                        <p className="text-gray-400 text-xs">
                          {Array.from(new Set(server.links.map(l => l.quality))).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                        {server.links.length} qualit{server.links.length > 1 ? 'ies' : 'y'}
                      </span>
                      {expandedServer === serverIndex ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedServer === serverIndex && (
                    <div className="border-t border-gray-700 p-3 space-y-2">
                      {server.links.map((link, linkIndex) => (
                        <div key={linkIndex} className="p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 text-white text-xs font-bold rounded bg-red-500">
                                {link.quality}
                              </span>
                              <span className="text-white text-sm font-medium">
                                {link.quality.includes('4K') ? 'Ultra HD' :
                                 link.quality.includes('1080') ? 'Full HD' : 'HD'}
                              </span>
                            </div>
                            {link.size && (
                              <span className="text-gray-400 text-xs">{link.size}</span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mb-3">
                            {movie.format || 'MKV'} • {movie.subtitle || 'Subtitle'}
                          </p>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-red-500"
                          >
                            <Download className="w-4 h-4" />
                            Download {link.quality}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              defaultServers.map((server, serverIndex) => (
                <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                  <button
                    onClick={() => setExpandedServer(expandedServer === serverIndex ? null : serverIndex)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/15">
                        <Server className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{server.name}</p>
                        <p className="text-gray-400 text-xs">{server.qualities.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                        {server.qualities.length} qualities
                      </span>
                      {expandedServer === serverIndex ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedServer === serverIndex && (
                    <div className="border-t border-gray-700 p-3 space-y-2">
                      {server.qualities.map((quality, qualityIndex) => {
                        const sizes = movie.fileSize?.split(' / ') || ['7.7 GB', '3.4 GB', '1.5 GB'];
                        const sizeIndex = qualityIndex < sizes.length ? qualityIndex : 0;
                        
                        return (
                          <div key={qualityIndex} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-white text-xs font-bold rounded bg-red-500">
                                  {quality}
                                </span>
                                <span className="text-white text-sm font-medium">
                                  {quality.includes('4K') ? 'Ultra HD' :
                                   quality.includes('1080') ? 'Full HD' : 'HD'}
                                </span>
                              </div>
                              <span className="text-gray-400 text-xs">{sizes[sizeIndex]}</span>
                            </div>
                            <p className="text-gray-400 text-xs mb-3">
                              {movie.format || 'MKV'} • {movie.subtitle || 'Myanmar Subtitle'}
                            </p>
                            <button
                              className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-red-500"
                            >
                              <Download className="w-4 h-4" />
                              Download {quality}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'explore':
        return (
          <div>
            <h3 className="text-white font-semibold mb-4">You may also like</h3>
            <SimilarGrid movies={similarMovies} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[280px] bg-[#1a1a1a]">
        <Image
          src={backdropUrl}
          alt={movie.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />

        {/* Navigation Buttons */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleBookmark}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
              bookmarked ? 'bg-red-500 text-white' : 'bg-black/50 text-white'
            )}
          >
            <Heart className={cn('w-5 h-5', bookmarked && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* Movie Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          {/* Poster */}
          <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
            <Image
              src={posterUrl}
              alt={movie.title}
              fill
              className="object-cover"
            />
            {movie.quality && movie.quality.split('/')[0].trim() && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[60px] truncate">
                {movie.quality.split('/')[0].trim()}
              </div>
            )}
            {!movie.quality && movie.quality4k && (
              <div className="absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500">
                4K
              </div>
            )}
          </div>

          {/* Title and Meta */}
          <div className="flex-1 pb-2">
            <h1 className="text-white text-xl font-bold mb-2">{movie.title}</h1>
            <MetaInfo 
              year={movie.year} 
              rating={movie.rating} 
              duration={movie.duration}
            />
          </div>
        </div>

        {/* Genre Tags */}
        <GenreTags genres={genreList} />

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-800 mb-4">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDownloadModal(false)}
          />
          
          <div 
            className="relative w-full max-w-lg bg-[#0f0f0f] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-[#0f0f0f] z-10">
              <h2 className="text-white font-bold text-lg">Download Options</h2>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              {serverGroups.length > 0 ? (
                serverGroups.map((server, serverIndex) => (
                  <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                    <button
                      onClick={() => setExpandedServer(expandedServer === serverIndex ? null : serverIndex)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/15">
                          <Server className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{server.name}</p>
                          <p className="text-gray-400 text-xs">
                            {Array.from(new Set(server.links.map(l => l.quality))).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                          {server.links.length} qualit{server.links.length > 1 ? 'ies' : 'y'}
                        </span>
                        {expandedServer === serverIndex ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedServer === serverIndex && (
                      <div className="border-t border-gray-700 p-3 space-y-2">
                        {server.links.map((link, linkIndex) => (
                          <div key={linkIndex} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-white text-xs font-bold rounded bg-red-500">
                                  {link.quality}
                                </span>
                                <span className="text-white text-sm font-medium">
                                  {link.quality.includes('4K') ? 'Ultra HD' :
                                   link.quality.includes('1080') ? 'Full HD' : 'HD'}
                                </span>
                              </div>
                              {link.size && (
                                <span className="text-gray-400 text-xs">{link.size}</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs mb-3">
                              {movie.format || 'MKV'} • {movie.subtitle || 'Subtitle'}
                            </p>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-red-500"
                            >
                              <Download className="w-4 h-4" />
                              Download {link.quality}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                defaultServers.map((server, serverIndex) => (
                  <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                    <button
                      onClick={() => setExpandedServer(expandedServer === serverIndex ? null : serverIndex)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/15">
                          <Server className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{server.name}</p>
                          <p className="text-gray-400 text-xs">{server.qualities.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">
                          {server.qualities.length} qualities
                        </span>
                        {expandedServer === serverIndex ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedServer === serverIndex && (
                      <div className="border-t border-gray-700 p-3 space-y-2">
                        {server.qualities.map((quality, qualityIndex) => {
                          const sizes = movie.fileSize?.split(' / ') || ['7.7 GB', '3.4 GB', '1.5 GB'];
                          const sizeIndex = qualityIndex < sizes.length ? qualityIndex : 0;
                          
                          return (
                            <div key={qualityIndex} className="p-3 bg-gray-700/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-white text-xs font-bold rounded bg-red-500">
                                    {quality}
                                  </span>
                                  <span className="text-white text-sm font-medium">
                                    {quality.includes('4K') ? 'Ultra HD' :
                                     quality.includes('1080') ? 'Full HD' : 'HD'}
                                  </span>
                                </div>
                                <span className="text-gray-400 text-xs">{sizes[sizeIndex]}</span>
                              </div>
                              <p className="text-gray-400 text-xs mb-3">
                                {movie.format || 'MKV'} • {movie.subtitle || 'Myanmar Subtitle'}
                              </p>
                              <button
                                className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-red-500"
                              >
                                <Download className="w-4 h-4" />
                                Download {quality}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            
            <div className="h-16 bg-[#0f0f0f]" />
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${0}`;
}
