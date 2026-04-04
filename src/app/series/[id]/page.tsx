'use client';

import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Star, Calendar, Clock, ChevronDown, Download, Lock, Server, ExternalLink, ChevronRight, ChevronUp } from 'lucide-react';
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

interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  duration: number;
  airDate: string | null;
  fileSize: string | null;
  quality: string | null;
  format: string | null;
  downloadLinks?: { server: string; quality: string; url: string; size?: string | null }[];
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string | null;
  backdrop: string | null;
  description: string;
  genres: string;
  quality4k: boolean;
  quality?: string | null;
  seasons: number;
  totalEpisodes: number;
  casts: Cast[];
  episodes?: Episode[];
  downloadLinks?: { server: string; quality: string; url: string; size?: string | null }[];
}

interface SimilarSeries {
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

// Memoized MetaInfo component for Series (year/rating/seasons)
const SeriesMetaInfo = memo(function SeriesMetaInfo({ 
  year, 
  rating, 
  seasons
}: { 
  year: number; 
  rating: number; 
  seasons: number;
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
        <span>{seasons} Seasons</span>
      </div>
    </div>
  );
});

// Memoized GenreTags component for Series
const SeriesGenreTags = memo(function SeriesGenreTags({ 
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

// Memoized TabButton component for Series
const SeriesTabButton = memo(function SeriesTabButton({ 
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

// Memoized TagBadges component for Series - shows only genres
const SeriesTagBadges = memo(function SeriesTagBadges({ 
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

// Memoized CastSection component for Series
const SeriesCastSection = memo(function SeriesCastSection({ 
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

// Memoized OverviewSection component for Series
const SeriesOverviewSection = memo(function SeriesOverviewSection({ 
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

// Memoized SimilarGrid component for Series
const SeriesSimilarGrid = memo(function SeriesSimilarGrid({ 
  series 
}: { 
  series: SimilarSeries[];
}) {
  if (series.length === 0) {
    return <p className="text-gray-500 text-center py-10">No similar series found</p>;
  }
  
  return (
    <div className="grid grid-cols-3 gap-3">
      {series.map((s) => (
        <MovieCard
          key={s.id}
          id={s.id}
          title={s.title}
          year={s.year}
          rating={s.rating}
          poster={s.poster || PLACEHOLDER_POSTER}
          quality4k={s.quality4k}
          quality={s.quality}
          type="series"
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

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [series, setSeries] = useState<Series | null>(null);
  const [similarSeries, setSimilarSeries] = useState<SimilarSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});
  const [expandedServer, setExpandedServer] = useState<Record<string, number | null>>({});
  
  // State for deferred addRecent - declared before useEffect that uses it
  const [pendingRecent, setPendingRecent] = useState<{
    id: string;
    type: 'series';
    seriesId: string;
    series: {
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

    const fetchSeries = async () => {
      try {
        setLoading(true); // Ensure loading starts true
        const response = await fetch(`/api/series/${id}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.series) {
            const seriesData = {
              ...data.series,
              poster: data.series.poster || PLACEHOLDER_POSTER,
              backdrop: data.series.backdrop || data.series.poster || PLACEHOLDER_POSTER,
            };
            
            // Batch state updates together
            setSeries(seriesData);
            setSimilarSeries((data.similarSeries || []).map((s: SimilarSeries) => ({
              ...s,
              poster: s.poster || PLACEHOLDER_POSTER,
            })));

            // Defer addRecent to after loading state changes
            setPendingRecent({
              id: `series-${seriesData.id}`,
              type: 'series' as const,
              seriesId: seriesData.id,
              series: {
                id: seriesData.id,
                title: seriesData.title,
                year: seriesData.year,
                rating: seriesData.rating,
                poster: seriesData.poster,
                quality4k: seriesData.quality4k,
                quality: seriesData.quality,
              },
              viewedAt: new Date().toISOString(),
            });
          } else {
            setError('Series not found');
          }
        } else {
          setError('Failed to load series');
        }
      } catch (err) {
        console.error('Error fetching series:', err);
        setError('An error occurred while loading the series');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSeries();
    }
  }, [params.id]);

  // Separate useEffect for addRecent - runs after loading is complete
  useEffect(() => {
    if (!loading && pendingRecent && series) {
      addRecent(pendingRecent);
      setPendingRecent(null); // Clear after adding
    }
  }, [loading, pendingRecent, series, addRecent]);

  const bookmarked = series ? isBookmarked(series.id, 'series') : false;

  // Memoize genreList to prevent recalculation
  const genreList = useMemo(() => {
    return series?.genres ? series.genres.split(',').filter(Boolean) : [];
  }, [series?.genres]);

  // Stable callback for bookmark toggle
  const handleBookmark = useCallback(() => {
    if (!series) return;

    if (bookmarked) {
      const bookmark = bookmarks.find((b) => b.seriesId === series.id);
      if (bookmark) {
        removeBookmark(bookmark.id);
      }
    } else {
      addBookmark({
        id: `series-${series.id}`,
        type: 'series',
        seriesId: series.id,
        series: {
          id: series.id,
          title: series.title,
          year: series.year,
          rating: series.rating,
          poster: series.poster || PLACEHOLDER_POSTER,
          quality4k: series.quality4k,
          quality: series.quality,
        },
      });
    }
  }, [series, bookmarked, bookmarks, removeBookmark, addBookmark]);

  // Stable callback for view more toggle
  const handleViewMoreToggle = useCallback(() => {
    setViewMore(prev => !prev);
  }, []);

  const toggleSeason = (season: number) => {
    setExpandedSeasons((prev) => ({
      ...prev,
      [season]: !prev[season],
    }));
  };

  const toggleEpisode = (episodeId: string) => {
    setExpandedEpisodes((prev) => ({
      ...prev,
      [episodeId]: !prev[episodeId],
    }));
  };

  const toggleServer = (episodeId: string, serverIndex: number) => {
    setExpandedServer((prev) => ({
      ...prev,
      [episodeId]: prev[episodeId] === serverIndex ? null : serverIndex,
    }));
  };

  // Group episodes by season
  const episodesBySeason = series?.episodes?.reduce((acc, ep) => {
    if (!acc[ep.season]) {
      acc[ep.season] = [];
    }
    acc[ep.season].push(ep);
    return acc;
  }, {} as Record<number, Episode[]>) || {};

  // Group download links into servers by actual server field
  const getServerGroups = (links: { server: string; quality: string; url: string; size?: string | null }[] | undefined) => {
    if (!links || links.length === 0) return [];
    
    // Group by server field
    const serverMap: Record<string, typeof links> = {};
    
    links.forEach(link => {
      const serverName = link.server || 'Server 1';
      if (!serverMap[serverName]) {
        serverMap[serverName] = [];
      }
      serverMap[serverName].push(link);
    });
    
    // Convert to array and sort by server name
    return Object.entries(serverMap)
      .sort(([a], [b]) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
      })
      .map(([name, links]) => ({ name, links }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        {/* Skeleton Loader with proper structure */}
        <div className="relative w-full h-[280px] bg-[#1a1a1a]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
        </div>
        <div className="px-4 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" />
            <div className="flex-1 pb-2 space-y-3">
              <div className="h-7 w-3/4 bg-[#1a1a1a] rounded" />
              {/* Meta info skeleton - matches year, rating, seasons layout */}
              <div className="flex items-center gap-4">
                <div className="h-4 w-12 bg-[#1a1a1a] rounded" />
                <div className="h-4 w-8 bg-[#1a1a1a] rounded" />
                <div className="h-4 w-20 bg-[#1a1a1a] rounded" />
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

  if (error || !series) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">{error || 'Series not found'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
        >
          Go Home
        </button>
      </div>
    );
  }

  const posterUrl = series.poster || PLACEHOLDER_POSTER;
  const backdropUrl = series.backdrop || posterUrl;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detail':
        return (
          <div className="space-y-6">
            <SeriesOverviewSection 
              description={series.description || 'No description available.'}
              viewMore={viewMore}
              onToggle={handleViewMoreToggle}
            />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-sm min-w-[100px]">Seasons</span>
                <span className="text-white text-sm">{series.seasons}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 text-sm min-w-[100px]">Episodes</span>
                <span className="text-white text-sm">{series.totalEpisodes}</span>
              </div>
              {series.genres && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 text-sm min-w-[100px]">Genre</span>
                  <span className="text-white text-sm">{series.genres}</span>
                </div>
              )}
            </div>

            <SeriesTagBadges genreList={genreList} />

            <SeriesCastSection casts={series.casts || []} />
          </div>
        );

      case 'download':
        // Check if download links are enabled
        if (!downloadLinksEnabled) {
          return (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Episodes</h3>
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-white font-medium mb-2">Download Links are Hidden</p>
                <p className="text-gray-400 text-sm mb-4">
                  Enable "All Download Link" in Downloads page to view download options
                </p>
                <button
                  onClick={() => router.push('/downloads')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                >
                  Go to Downloads
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Download Episodes</h3>

            {Object.keys(episodesBySeason).length === 0 ? (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <Download className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-2">No episodes available</p>
                <p className="text-gray-500 text-xs">Episodes will appear here when available</p>
              </div>
            ) : (
              Object.entries(episodesBySeason)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([season, episodes]) => (
                  <div key={season} className="border border-gray-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSeason(Number(season))}
                      className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-white font-medium">Season {season}</span>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-sm">{episodes.length} episodes</span>
                        <ChevronRight
                          className={cn(
                            'w-5 h-5 transition-transform',
                            expandedSeasons[Number(season)] && 'rotate-90'
                          )}
                        />
                      </div>
                    </button>

                    {expandedSeasons[Number(season)] && (
                      <div className="divide-y divide-gray-800">
                        {episodes.map((ep) => {
                          const serverGroups = getServerGroups(ep.downloadLinks);
                          const hasCustomLinks = serverGroups.length > 0;
                          
                          return (
                            <div key={ep.id} className="bg-gray-900/30">
                              <button
                                onClick={() => toggleEpisode(ep.id)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-red-500/15 text-red-500">
                                    {ep.episode}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-white text-sm">{ep.title}</p>
                                    <p className="text-gray-500 text-xs">
                                      {ep.airDate ? `${ep.airDate} • ` : ''}{ep.duration} min
                                    </p>
                                  </div>
                                </div>
                                <ChevronRight
                                  className={cn(
                                    'w-5 h-5 text-gray-400 transition-transform',
                                    expandedEpisodes[ep.id] && 'rotate-90'
                                  )}
                                />
                              </button>

                              {expandedEpisodes[ep.id] && (
                                <div className="px-4 pb-4 space-y-2">
                                  {hasCustomLinks ? (
                                    // Server-based download with custom links
                                    serverGroups.map((server, serverIndex) => (
                                      <div key={serverIndex} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                                        <button
                                          onClick={() => toggleServer(ep.id, serverIndex)}
                                          className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-8 h-8 rounded flex items-center justify-center bg-red-500/15"
                                            >
                                              <Server className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="text-left">
                                              <p className="text-white text-sm font-medium">{server.name}</p>
                                              <p className="text-gray-400 text-xs">
                                                {Array.from(new Set(server.links.map(l => l.quality))).join(', ')}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">
                                              {server.links.length} qualit{server.links.length > 1 ? 'ies' : 'y'}
                                            </span>
                                            {expandedServer[ep.id] === serverIndex ? (
                                              <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                          </div>
                                        </button>

                                        {expandedServer[ep.id] === serverIndex && (
                                          <div className="border-t border-gray-700 p-2 max-h-[60vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                            <div className="space-y-2">
                                              {server.links.map((link, linkIndex) => (
                                              <div key={linkIndex} className="p-2 bg-gray-700/50 rounded flex items-center justify-between">
                                                <div>
                                                  <p className="text-white text-sm font-medium">{link.quality}</p>
                                                  <p className="text-gray-500 text-xs">{link.size || ep.fileSize || 'N/A'}</p>
                                                </div>
                                                <a
                                                  href={link.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded font-medium flex items-center gap-1"
                                                >
                                                  <Download className="w-3 h-3" />
                                                  Download
                                                  <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                              </div>
                                            ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    // Default servers
                                    <>
                                      <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                                        <button
                                          onClick={() => toggleServer(ep.id, 0)}
                                          className="w-full flex items-center justify-between p-3 hover:bg-gray-800 transition-colors"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div 
                                              className="w-8 h-8 rounded flex items-center justify-center bg-red-500/15"
                                            >
                                              <Server className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="text-left">
                                              <p className="text-white text-sm font-medium">Server 1</p>
                                              <p className="text-gray-400 text-xs">1080p, 720p</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">2 qualities</span>
                                            {expandedServer[ep.id] === 0 ? (
                                              <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                          </div>
                                        </button>

                                        {expandedServer[ep.id] === 0 && (
                                          <div className="border-t border-gray-700 p-2 max-h-[60vh] overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                            <div className="space-y-2">
                                              <div className="p-2 bg-gray-700/50 rounded flex items-center justify-between">
                                                <div>
                                                  <p className="text-white text-sm font-medium">1080p</p>
                                                  <p className="text-gray-500 text-xs">1080p • {ep.fileSize || '1.2 GB'}</p>
                                                </div>
                                                <button className="px-3 py-1.5 bg-red-500 text-white text-xs rounded font-medium flex items-center gap-1">
                                                  <Download className="w-3 h-3" />
                                                  Download
                                                </button>
                                              </div>
                                              <div className="p-2 bg-gray-700/50 rounded flex items-center justify-between">
                                                <div>
                                                  <p className="text-white text-sm font-medium">720p</p>
                                                  <p className="text-gray-500 text-xs">720p • 600 MB</p>
                                                </div>
                                                <button className="px-3 py-1.5 bg-gray-700 text-white text-xs rounded font-medium flex items-center gap-1">
                                                  <Download className="w-3 h-3" />
                                                  Download
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
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
            <SeriesSimilarGrid series={similarSeries} />
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
          alt={series.title}
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

      {/* Series Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-xl">
            <Image
              src={posterUrl}
              alt={series.title}
              fill
              className="object-cover"
            />
            {series.quality && series.quality.split('/')[0].trim() && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[60px] truncate">
                {series.quality.split('/')[0].trim()}
              </div>
            )}
            {!series.quality && series.quality4k && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                4K
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <h1 className="text-white text-xl font-bold mb-2">{series.title}</h1>
            <SeriesMetaInfo 
              year={series.year} 
              rating={series.rating} 
              seasons={series.seasons} 
            />
          </div>
        </div>

        {/* Genre Tags */}
        <SeriesGenreTags genres={genreList} />

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-800 mb-4">
          {tabs.map((tab) => (
            <SeriesTabButton
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
    </div>
  );
}
