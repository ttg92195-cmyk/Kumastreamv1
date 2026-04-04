'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Film, Tv, Tag, FolderOpen, Grid3X3, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

// Theme color - RED
const THEME_COLOR = '#ef4444';

interface Genre {
  id: string;
  name: string;
  type: string;
}

// Predefined Tags
const MOVIE_TAGS = [
  '4K', '2K', '1080p', '720p',
  'Anime', 'Bollywood', 'C Drama', 'Featured Movies',
  'K Drama', 'Reality Show', 'Thai Drama', 'Trending',
  'Live Action Remake', 'Time Travel', 'Donghua', 'Superhero', 'Survival'
];

const SERIES_TAGS = [
  '4K', '2K', '1080p', '720p',
  'Anime', 'Bollywood', 'C Drama', 'Featured Movies',
  'K Drama', 'Reality Show', 'Thai Drama', 'Trending', 'Completed',
  'Live Action Remake', 'Time Travel', 'Donghua', 'Superhero', 'Survival'
];

// Predefined Collections - Auto detected from title matching
const AUTO_COLLECTIONS = [
  'Marvel', 'DC', 'Harry Potter', 'Star Wars', 
  'James Bond', 'Fast & Furious', 'John Wick', 'Mission Impossible',
  'Transformers', 'X-Men', 'Spider-Man', 'Batman',
  'Final Destination', 'Saw', 'Scooby-Doo',
  'Tom & Jerry',
  'The Conjuring Universe', 'Jurassic', 'Pirates of the Caribbean',
  'MonsterVerse', 'Despicable Me', 'Lord of the Rings'
];

// Collections that show ALL universe content (related movies + series)
const UNIVERSE_COLLECTIONS = [
  'Marvel', 'DC', 'Harry Potter', 'Star Wars', 
  'X-Men', 'Spider-Man', 'The Conjuring Universe', 
  'Jurassic', 'MonsterVerse', 'Despicable Me', 'Lord of the Rings',
  'Tom & Jerry', 'James Bond', 'Fast & Furious', 'Mission Impossible',
  'Transformers', 'Batman', 'Scooby-Doo'
];

// Manual Collections - Filter by assigned tag in database
const DB_COLLECTIONS: string[] = [];

interface Content {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality: string;
}

// Content Card Component
function ContentCard({ id, title, year, poster, rating, quality, type }: {
  id: string;
  title: string;
  year: number;
  poster?: string | null;
  rating: number;
  quality?: string | null;
  type: 'movie' | 'series';
}) {
  const href = type === 'movie' ? `/movie/${id}` : `/series/${id}`;
  const posterUrl = poster || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
  const qualityTags = quality ? quality.split('/').map(q => q.trim()).filter(Boolean) : [];
  const primaryQuality = qualityTags[0];

  return (
    <Link href={href} className="block">
      <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-gray-800">
        <Image
          src={posterUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 25vw, 20vw"
          unoptimized
        />
        {primaryQuality && (
          <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {primaryQuality}
          </div>
        )}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 px-1.5 py-0.5 rounded text-xs">
          <span className="text-yellow-500">★</span>
          <span className="text-white font-medium text-[10px]">{rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="mt-1.5 px-0.5">
        <h3 className="text-white text-xs font-medium line-clamp-1 leading-tight">{title}</h3>
        <p className="text-gray-500 text-[10px] mt-0.5">{year}</p>
      </div>
    </Link>
  );
}

function GenresContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [genres, setGenres] = useState<{ movies: Genre[]; series: Genre[] }>({ movies: [], series: [] });
  const [loading, setLoading] = useState(true);
  
  const tag = searchParams.get('tag') || '';
  const collection = searchParams.get('collection') || '';
  const type = searchParams.get('type') || 'all';
  
  const isShowTags = tag === '_show_tags';
  const isShowCollections = collection === '_show_collections';
  const hasRealFilter = (tag && !isShowTags) || (collection && !isShowCollections);
  
  const [movies, setMovies] = useState<Content[]>([]);
  const [series, setSeries] = useState<Content[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  
  const activeTab = isShowTags ? 'tags' : isShowCollections ? 'collections' : (tag || collection) ? null : 'genres';

  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then((data) => {
        setGenres(data.genres || { movies: [], series: [] });
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (hasRealFilter) {
      fetchResults();
    }
  }, [tag, collection, type, hasRealFilter]);

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const actualTag = isShowTags ? null : tag;
      const actualCollection = isShowCollections ? null : collection;
      
      if (actualTag) {
        const moviesRes = await fetch(`/api/movies?tag=${encodeURIComponent(actualTag)}&limit=100`);
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || []);
        }
        
        const seriesRes = await fetch(`/api/series?tag=${encodeURIComponent(actualTag)}&limit=100`);
        if (seriesRes.ok) {
          const data = await seriesRes.json();
          setSeries(data.series || []);
        }
      } else if (actualCollection) {
        const moviesRes = await fetch(`/api/movies?collection=${encodeURIComponent(actualCollection)}&limit=100`);
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || []);
        }
        
        const seriesRes = await fetch(`/api/series?collection=${encodeURIComponent(actualCollection)}&limit=100`);
        if (seriesRes.ok) {
          const data = await seriesRes.json();
          setSeries(data.series || []);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setResultsLoading(false);
    }
  };

  const clearFilters = () => {
    router.push('/genres');
  };

  const handleTagClick = (selectedTag: string, selectedType: string) => {
    router.push(`/genres?tag=${encodeURIComponent(selectedTag)}&type=${selectedType}`);
  };

  const handleCollectionClick = (selectedCollection: string) => {
    router.push(`/genres?collection=${encodeURIComponent(selectedCollection)}&type=all`);
  };

  const handleGenreClick = (name: string, contentType: string) => {
    if (contentType === 'movie') {
      router.push(`/movies?genre=${encodeURIComponent(name)}`);
    } else {
      router.push(`/series?genre=${encodeURIComponent(name)}`);
    }
  };

  const tabs = [
    { id: 'genres', label: 'Genres', icon: Grid3X3 },
    { id: 'tags', label: 'Tags', icon: Tag },
    { id: 'collections', label: 'Collections', icon: FolderOpen },
  ] as const;

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Active Filter */}
      {hasRealFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm">Filtering by:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-red-500">
            {tag && !isShowTags && <Tag className="w-4 h-4" />}
            {collection && !isShowCollections && <FolderOpen className="w-4 h-4" />}
            <span>{(tag && !isShowTags) ? tag : (collection && !isShowCollections) ? collection : ''}</span>
            <button onClick={clearFilters} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {hasRealFilter && (
        <div className="space-y-6">
          {resultsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <>
              {(type === 'all' || type === 'movie') && movies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    Movies ({movies.length})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {movies.map((m) => (
                      <ContentCard key={m.id} {...m} type="movie" />
                    ))}
                  </div>
                </div>
              )}
              
              {(type === 'all' || type === 'series') && series.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Tv className="w-4 h-4 text-red-500" />
                    Series ({series.length})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {series.map((s) => (
                      <ContentCard key={s.id} {...s} type="series" />
                    ))}
                  </div>
                </div>
              )}
              
              {movies.length === 0 && series.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No results found</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tabs Selection */}
      {!hasRealFilter && (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'tags') {
                      router.push('/genres?tag=_show_tags');
                    } else if (tab.id === 'collections') {
                      router.push('/genres?collection=_show_collections');
                    } else {
                      router.push('/genres');
                    }
                  }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-white bg-red-500'
                      : 'bg-gray-700 text-gray-300 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Genres Content */}
          {activeTab === 'genres' && (
            <>
              {/* Movies Section */}
              <section>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  Movies
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {genres.movies.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreClick(genre.name, 'movie')}
                      className="px-3 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 hover:border-red-500/50 hover:text-red-400 transition-all"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </section>

              {/* Series Section */}
              <section>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" />
                  Series
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {genres.series.map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleGenreClick(genre.name, 'series')}
                      className="px-3 py-3 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 hover:border-red-500/50 hover:text-red-400 transition-all"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Tags Content */}
          {activeTab === 'tags' && (
            <>
              {/* Movies Tags */}
              <section>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  Movies
                </h2>
                <p className="text-gray-400 text-xs mb-3">Click a tag to filter movies</p>
                <div className="flex flex-wrap gap-2">
                  {MOVIE_TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTagClick(t, 'movie')}
                      className="px-3 py-2 bg-red-500/15 border border-red-500/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 hover:border-red-400 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* Series Tags */}
              <section>
                <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-red-500" />
                  Series
                </h2>
                <p className="text-gray-400 text-xs mb-3">Click a tag to filter series</p>
                <div className="flex flex-wrap gap-2">
                  {SERIES_TAGS.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTagClick(t, 'series')}
                      className="px-3 py-2 bg-red-500/15 border border-red-500/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 hover:border-red-400 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Collections Content */}
          {activeTab === 'collections' && (
            <div className="space-y-6">
              {/* Auto Collections */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-red-500" />
                  <h2 className="text-white font-semibold">Auto Collections</h2>
                </div>
                <p className="text-gray-400 text-xs mb-3">
                  Click to view all related movies/series. 
                  <span className="text-orange-400"> Marvel & DC </span> 
                  show ALL universe content
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AUTO_COLLECTIONS.map((c) => {
                    const isUniverse = UNIVERSE_COLLECTIONS.includes(c);
                    return (
                      <Link
                        key={c}
                        href={`/collection/${encodeURIComponent(c)}`}
                        className={`px-3 py-3 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between ${
                          isUniverse 
                            ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 hover:border-orange-400' 
                            : 'bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 hover:border-purple-400'
                        }`}
                      >
                        <span>{c}</span>
                        {isUniverse && (
                          <span className="text-[10px] bg-orange-500/30 px-1.5 py-0.5 rounded">UNIVERSE</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* DB Collections - Only show if not empty */}
              {DB_COLLECTIONS.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-4 h-4 text-red-500" />
                    <h2 className="text-white font-semibold">Manual Collections</h2>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">Filter by assigned collection tag</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DB_COLLECTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleCollectionClick(c)}
                        className="px-3 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 hover:border-blue-400 transition-all text-left"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Header component
function GenresHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const collection = searchParams.get('collection') || '';
  
  const isShowTags = tag === '_show_tags';
  const isShowCollections = collection === '_show_collections';
  const hasRealFilter = (tag && !isShowTags) || (collection && !isShowCollections);
  
  let title = 'Genres';
  if (hasRealFilter) {
    if (tag && !isShowTags) {
      title = `Tag: ${tag}`;
    } else if (collection && !isShowCollections) {
      title = `Collection: ${collection}`;
    }
  } else if (isShowTags) {
    title = 'Tags';
  } else if (isShowCollections) {
    title = 'Collections';
  }

  return (
    <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
      <div className="flex items-center gap-4 p-4">
        <button onClick={() => router.back()} className="text-red-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg">{title}</h1>
      </div>
    </div>
  );
}

export default function GenresPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <Suspense fallback={
        <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
          <div className="flex items-center gap-4 p-4">
            <div className="w-6 h-6 bg-gray-800 rounded animate-pulse" />
            <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      }>
        <GenresHeader />
      </Suspense>
      
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        </div>
      }>
        <GenresContent />
      </Suspense>
    </div>
  );
}
