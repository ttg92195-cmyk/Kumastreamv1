'use client';

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Star, Calendar, Clock, ChevronDown, Download, Lock, Server, ExternalLink, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CastCard } from '@/components/movie/CastCard';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

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

const PLACEHOLDER_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

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
  const downloadModalContentRef = useRef<HTMLDivElement>(null);

  const { bookmarks, addBookmark, removeBookmark, isBookmarked, addRecent } = useAppStore();
  const { showAllDownloadLinks: downloadLinksEnabled, themeColor } = useSettingsStore();

  useEffect(() => {
    const id = params.id as string;
    
    const fetchMovie = async () => {
      try {
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
            setSimilarMovies((data.similarMovies || []).map((m: SimilarMovie) => ({ ...m, poster: m.poster || PLACEHOLDER_POSTER })));
            addRecent({
              id: `movie-${movieData.id}`,
              type: 'movie',
              movieId: movieData.id,
              movie: { id: movieData.id, title: movieData.title, year: movieData.year, rating: movieData.rating, poster: movieData.poster, quality4k: movieData.quality4k, quality: movieData.quality },
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
    if (id) fetchMovie();
  }, [params.id, addRecent]);

  const bookmarked = movie ? isBookmarked(movie.id, 'movie') : false;

  useEffect(() => {
    if (showDownloadModal) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        if (downloadModalContentRef.current) downloadModalContentRef.current.scrollTop = 0;
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showDownloadModal]);

  const handleBookmark = useCallback(() => {
    if (!movie) return;
    if (bookmarked) {
      const bookmark = bookmarks.find((b) => b.movieId === movie.id);
      if (bookmark) removeBookmark(bookmark.id);
    } else {
      addBookmark({
        id: `movie-${movie.id}`,
        type: 'movie',
        movieId: movie.id,
        movie: { id: movie.id, title: movie.title, year: movie.year, rating: movie.rating, poster: movie.poster || PLACEHOLDER_POSTER, quality4k: movie.quality4k, quality: movie.quality },
      });
    }
  }, [movie, bookmarked, bookmarks, removeBookmark, addBookmark]);

  const handleViewMoreToggle = useCallback(() => setViewMore((prev) => !prev), []);
  const handleTabChange = useCallback((tabId: string) => setActiveTab(tabId), []);
  const handleGoHome = useCallback(() => router.push('/'), [router]);
  const handleGoBack = useCallback(() => router.back(), [router]);
  const handleOpenDownloadModal = useCallback(() => {
    setExpandedServer(null);
    setShowDownloadModal(true);
  }, []);
  const handleCloseDownloadModal = useCallback(() => setShowDownloadModal(false), []);
  const handleToggleServer = useCallback((serverIndex: number) => setExpandedServer((prev) => (prev === serverIndex ? null : serverIndex)), []);

  // Group download links by server
  const getServerGroups = (links: { server: string; quality: string; url: string; size?: string | null }[]) => {
    const serverMap: Record<string, typeof links> = {};
    if (links && links.length > 0) {
      links.forEach(link => {
        const serverName = link.server || 'Server 1';
        if (!serverMap[serverName]) serverMap[serverName] = [];
        serverMap[serverName].push(link);
      });
    }
    return Object.entries(serverMap)
      .sort(([a], [b]) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0))
      .map(([name, links]) => ({ name, links }));
  };

  const serverGroups = useMemo(() => movie?.downloadLinks && movie.downloadLinks.length > 0 ? getServerGroups(movie.downloadLinks) : [], [movie?.downloadLinks]);
  const defaultServers = useMemo(() => [{ name: 'Server 1', qualities: ['4K UHD', '1080p', '720p'] }, { name: 'Server 2', qualities: ['1080p', '720p', '480p'] }], []);
  const genreList = useMemo(() => (movie?.genres ? movie.genres.split(',').filter(Boolean) : []), [movie?.genres]);
  const posterUrl = movie?.poster || PLACEHOLDER_POSTER;
  const backdropUrl = movie?.backdrop || posterUrl;
  // Pre-compute rating string to avoid function call in render
  const ratingDisplay = useMemo(() => movie?.rating.toFixed(1) ?? '', [movie?.rating]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <div className="relative w-full h-[280px] bg-[#1a1a1a]"><div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" /></div>
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" />
            <div className="flex-1 pb-2 space-y-3">
              <div className="h-7 w-3/4 bg-[#1a1a1a] rounded" />
              <div className="flex items-center gap-4"><div className="h-4 w-12 bg-[#1a1a1a] rounded" /><div className="h-4 w-8 bg-[#1a1a1a] rounded" /><div className="h-4 w-16 bg-[#1a1a1a] rounded" /></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-2"><div className="h-6 w-16 bg-[#1a1a1a] rounded-full" /><div className="h-6 w-16 bg-[#1a1a1a] rounded-full" /><div className="h-6 w-16 bg-[#1a1a1a] rounded-full" /></div>
            <div className="flex gap-2 border-b border-gray-800 pb-4"><div className="h-6 w-16 bg-[#1a1a1a] rounded" /><div className="h-6 w-20 bg-[#1a1a1a] rounded" /><div className="h-6 w-16 bg-[#1a1a1a] rounded" /></div>
            <div className="space-y-3"><div className="h-4 w-full bg-[#1a1a1a] rounded" /><div className="h-4 w-full bg-[#1a1a1a] rounded" /><div className="h-4 w-3/4 bg-[#1a1a1a] rounded" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{error || 'Movie not found'}</p>
        <button onClick={handleGoHome} className="px-4 py-2 text-white rounded-lg text-sm bg-theme">Go Home</button>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detail':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-semibold mb-2">Overview</h3>
              <p className={cn('text-gray-300 text-sm leading-relaxed whitespace-pre-line', !viewMore && 'line-clamp-4')}>{movie.description || 'No description available.'}</p>
              <button onClick={handleViewMoreToggle} className="text-sm mt-2 flex items-center gap-1 text-theme">
                {viewMore ? 'View Less' : 'View More'}
                <ChevronDown className={cn('w-4 h-4 transition-transform', viewMore && 'rotate-180')} />
              </button>
            </div>
            <div className="space-y-2">
              {movie.fileSize && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">File Size</span><span className="text-white text-sm">{movie.fileSize}</span></div>)}
              {movie.quality && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Quality</span><span className="text-white text-sm">{movie.quality}</span></div>)}
              {movie.format && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Format</span><span className="text-white text-sm">{movie.format}</span></div>)}
              {movie.genres && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Genre</span><span className="text-white text-sm">{movie.genres}</span></div>)}
              <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Duration</span><span className="text-white text-sm">{String(Math.floor(movie.duration / 60)).padStart(2, '0')}:{String(movie.duration % 60).padStart(2, '0')}:00</span></div>
              {movie.subtitle && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Subtitle</span><span className="text-white text-sm">{movie.subtitle}</span></div>)}
              {movie.director && (<div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Director</span><span className="text-white text-sm">{movie.director}</span></div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              {movie.quality4k && <span className="px-2 py-1 text-xs rounded bg-theme/30 text-theme">4K</span>}
              {genreList.map((genre) => (<span key={genre} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">{genre.trim()}</span>))}
            </div>
            {movie.casts && movie.casts.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-3">Casts</h3>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                  {movie.casts.map((cast) => (<CastCard key={cast.id} name={cast.name} role={cast.role} photo={cast.photo || undefined} />))}
                </div>
              </div>
            )}
          </div>
        );
      case 'download':
        if (!downloadLinksEnabled) {
          return (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Options</h3>
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-12 h-12 mx-auto mb-3 text-theme" />
                <p className="text-white font-medium mb-2">Download Links are Hidden</p>
                <p className="text-gray-400 text-sm mb-4">Enable "All Download Link" in Downloads page to view download options</p>
                <button onClick={() => router.push('/downloads')} className="px-4 py-2 text-white rounded-lg text-sm font-medium bg-theme">Go to Downloads</button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Download Options</h3>
            <button onClick={handleOpenDownloadModal} className="w-full py-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
              <Download className="w-5 h-5 text-theme" />
              <span className="text-white font-medium">View Download Links</span>
              <span className="text-gray-400 text-sm">({serverGroups.length > 0 ? serverGroups.length : defaultServers.length} servers)</span>
            </button>
          </div>
        );
      case 'explore':
        return (
          <div>
            <h3 className="text-white font-semibold mb-4">You may also like</h3>
            <div className="grid grid-cols-3 gap-3">
              {similarMovies.map((m) => (<MovieCard key={m.id} id={m.id} title={m.title} year={m.year} rating={m.rating} poster={m.poster || PLACEHOLDER_POSTER} quality4k={m.quality4k} quality={m.quality} type="movie" />))}
            </div>
            {similarMovies.length === 0 && <p className="text-gray-500 text-center py-10">No similar movies found</p>}
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
        <Image src={backdropUrl} alt={movie.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={handleGoBack} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 active:scale-95"><ArrowLeft className="w-5 h-5" /></button>
          <button onClick={handleBookmark} className={cn('w-10 h-10 rounded-full flex items-center justify-center active:scale-95', bookmarked ? 'text-white' : 'bg-black/50 text-white')} style={bookmarked ? { backgroundColor: themeColor } : {}}><Heart className={cn('w-5 h-5', bookmarked && 'fill-current')} /></button>
        </div>
      </div>

      {/* Movie Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-xl border border-gray-700/30">
            <Image src={posterUrl} alt={movie.title} fill className="object-cover" />
            {movie.quality && movie.quality.split('/')[0].trim() && (<div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[60px] truncate">{movie.quality.split('/')[0].trim()}</div>)}
            {!movie.quality && movie.quality4k && (<div className="absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: themeColor }}>4K</div>)}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-white text-xl font-bold mb-2">{movie.title}</h1>
            {/* Optimized meta section with CSS containment */}
            <div className="movie-meta-row" style={{ contain: 'layout style' }}>
              <span className="movie-meta-item">📅 {movie.year}</span>
              <span className="movie-meta-item movie-meta-rating">⭐ {ratingDisplay}</span>
              <span className="movie-meta-item">⏱ {movie.duration} min</span>
            </div>
          </div>
        </div>

        {genreList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {genreList.map((genre) => (<span key={genre} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">{genre.trim()}</span>))}
          </div>
        )}

        <div className="flex items-center gap-2 border-b border-gray-800 mb-4">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={cn('px-4 py-3 text-sm font-medium relative active:scale-95', activeTab === tab.id ? '' : 'text-gray-400 hover:text-white')} style={activeTab === tab.id ? { color: themeColor } : {}}>
              {tab.label}
              {activeTab === tab.id && (<div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: themeColor }} />)}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>

      {/* Download Modal - Original Design */}
      {showDownloadModal && downloadLinksEnabled && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop - no blur for better INP */}
          <div className="absolute inset-0 bg-black/80" onClick={handleCloseDownloadModal} />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-[#0f0f0f] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-[#0f0f0f] z-10">
              <h2 className="text-white font-bold text-lg">Download Options</h2>
              <button onClick={handleCloseDownloadModal} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Scrollable Content */}
            <div ref={downloadModalContentRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>
              {serverGroups.length > 0 ? (
                serverGroups.map((server, serverIndex) => (
                  <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                    {/* Server Button */}
                    <button onClick={() => handleToggleServer(serverIndex)} className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                          <Server className="w-5 h-5" style={{ color: themeColor }} />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{server.name}</p>
                          <p className="text-gray-400 text-xs">{Array.from(new Set(server.links.map(l => l.quality))).join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">{server.links.length} qualit{server.links.length > 1 ? 'ies' : 'y'}</span>
                        {expandedServer === serverIndex ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </button>

                    {/* Quality Options */}
                    {expandedServer === serverIndex && (
                      <div className="border-t border-gray-700 p-3 space-y-2">
                        {server.links.map((link, linkIndex) => (
                          <div key={linkIndex} className="p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-white text-xs font-bold rounded" style={{ backgroundColor: themeColor }}>{link.quality}</span>
                                <span className="text-white text-sm font-medium">{link.quality.includes('4K') ? 'Ultra HD' : link.quality.includes('1080') ? 'Full HD' : 'HD'}</span>
                              </div>
                              {link.size && <span className="text-gray-400 text-xs">{link.size}</span>}
                            </div>
                            <p className="text-gray-400 text-xs mb-3">{movie.format || 'MKV'} • {movie.subtitle || 'Subtitle'}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90" style={{ backgroundColor: themeColor }}>
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
                    {/* Server Button */}
                    <button onClick={() => handleToggleServer(serverIndex)} className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${themeColor}20` }}>
                          <Server className="w-5 h-5" style={{ color: themeColor }} />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{server.name}</p>
                          <p className="text-gray-400 text-xs">{server.qualities.join(', ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">{server.qualities.length} qualities</span>
                        {expandedServer === serverIndex ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </button>

                    {/* Quality Options */}
                    {expandedServer === serverIndex && (
                      <div className="border-t border-gray-700 p-3 space-y-2">
                        {server.qualities.map((quality, qualityIndex) => {
                          const sizes = movie.fileSize?.split(' / ') || ['7.7 GB', '3.4 GB', '1.5 GB'];
                          const sizeIndex = qualityIndex < sizes.length ? qualityIndex : 0;
                          return (
                            <div key={qualityIndex} className="p-3 bg-gray-700/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 text-white text-xs font-bold rounded" style={{ backgroundColor: themeColor }}>{quality}</span>
                                  <span className="text-white text-sm font-medium">{quality.includes('4K') ? 'Ultra HD' : quality.includes('1080') ? 'Full HD' : 'HD'}</span>
                                </div>
                                <span className="text-gray-400 text-xs">{sizes[sizeIndex]}</span>
                              </div>
                              <p className="text-gray-400 text-xs mb-3">{movie.format || 'MKV'} • {movie.subtitle || 'Myanmar Subtitle'}</p>
                              <button className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90" style={{ backgroundColor: themeColor }}>
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
          </div>
        </div>
      )}
    </div>
  );
}
