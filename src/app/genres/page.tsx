'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Film, Tv, Tag, FolderOpen, Grid3X3, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { GenresHeader, GenresHeaderFallback } from './GenresHeader';

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

// Categorized Collections with 5 main categories
const COLLECTION_CATEGORIES = [
  {
    id: 'universe',
    label: 'Universe',
    emoji: '\u{1F310}',
    collections: [
      'Marvel', 'DC', 'Harry Potter', 'Star Wars',
      'MonsterVerse', 'The Conjuring Universe', 'Godzilla x Kong',
      'Lord of the Rings', 'Jurassic'
    ]
  },
  {
    id: 'action',
    label: 'Action & Adventure',
    emoji: '\u{1F525}',
    collections: [
      'Fast & Furious', 'James Bond', 'Mission Impossible', 'John Wick',
      'Die Hard', 'The Terminator', 'Mad Max', 'Indiana Jones',
      'Top Gun', 'Kingsman', 'Sicario', 'Rush Hour',
      'Rocky', 'Creed', "Ocean's", 'The Matrix',
      'X-Men', 'Spider-Man', 'Spider-Man: Spider-Verse',
      'Batman', 'The Dark Knight', 'Deadpool',
      'Guardians of the Galaxy', 'Ant-Man', 'The Wolverine',
      'Venom', 'Predator', 'Alien', 'Blade',
      'The Mummy', 'Robert Langdon', 'Transformers', 'The Avengers',
      'Dune', 'Avatar', 'The Hunger Games', 'The Maze Runner',
      'Divergent', 'Back to the Future', 'TRON', 'Planet of the Apes',
      'Godzilla', 'Pirates of the Caribbean', 'Jurassic Park',
      'Knives Out', 'Detective Chinatown', 'Now You See Me',
      'The Godfather', 'Enola Holmes', 'Dragon Gate Posthouse',
      'Three Colors', 'Fantastic Beasts'
    ]
  },
  {
    id: 'horror',
    label: 'Horror & Thriller',
    emoji: '\u{1F47B}',
    collections: [
      'Saw', 'Final Destination', 'Scream', 'Evil Dead',
      'Annabelle', 'The Hannibal Lecter', 'Psycho', 'Terrifier',
      'Fear Street', 'Halloween', 'Blair Witch', "Rosemary's Baby",
      'Scary Movie', 'Hocus Pocus', 'I Know What You Did Last Summer',
      'Texas Chainsaw Massacre', '28 Days/Weeks/Years Later',
      'Gremlins', 'Jaws', 'X', 'The Twilight',
      'Searching', 'Hercule Poirot', 'Fifty Shades'
    ]
  },
  {
    id: 'comedy',
    label: 'Comedy',
    emoji: '\u{1F602}',
    collections: [
      'American Pie', 'The Hangover', 'Home Alone',
      'Bridget Jones', 'Pitch Perfect', 'Austin Powers',
      'High School Musical', 'Hotel Transylvania',
      'Diary of a Wimpy Kid', 'Men in Black',
      'Night at the Museum', 'Jumanji', 'Paddington',
      'Ghostbusters', 'The Princess Diaries'
    ]
  },
  {
    id: 'animation',
    label: 'Animation & Family',
    emoji: '\u{1F9F8}',
    collections: [
      'Shrek', 'Toy Story', 'Cars', 'How to Train Your Dragon',
      'Kung Fu Panda', 'Madagascar', 'The Lion King', 'Frozen',
      'Ice Age', 'Minions', 'Despicable Me', 'Lilo & Stitch',
      'The Little Mermaid', 'Beauty and the Beast', 'Aladdin',
      'Tom & Jerry', 'Scooby-Doo', 'Sonic the Hedgehog',
      "Shinkai's Disaster Trilogy", 'The Incredibles'
    ]
  }
];

// Color styles per category
const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  universe: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', hover: 'hover:bg-orange-500/30 hover:border-orange-400' },
  action:   { bg: 'bg-red-500/15', border: 'border-red-500/50', text: 'text-red-400', hover: 'hover:bg-red-500/30 hover:border-red-400' },
  horror:   { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', hover: 'hover:bg-purple-500/30 hover:border-purple-400' },
  comedy:   { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', hover: 'hover:bg-green-500/30 hover:border-green-400' },
  animation:{ bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', hover: 'hover:bg-blue-500/30 hover:border-blue-400' }
};

// Category tab styles for horizontal swipeable tabs
const CATEGORY_TAB_STYLES: Record<string, { active: string; inactive: string; indicator: string }> = {
  universe: { active: 'text-orange-400 border-orange-400', inactive: 'text-gray-400 border-transparent', indicator: 'bg-orange-400' },
  action:   { active: 'text-red-400 border-red-400', inactive: 'text-gray-400 border-transparent', indicator: 'bg-red-400' },
  horror:   { active: 'text-purple-400 border-purple-400', inactive: 'text-gray-400 border-transparent', indicator: 'bg-purple-400' },
  comedy:   { active: 'text-green-400 border-green-400', inactive: 'text-gray-400 border-transparent', indicator: 'bg-green-400' },
  animation:{ active: 'text-blue-400 border-blue-400', inactive: 'text-gray-400 border-transparent', indicator: 'bg-blue-400' }
};

// Derived flat arrays (backward compatible)
const AUTO_COLLECTIONS = COLLECTION_CATEGORIES.flatMap(c => c.collections);
const UNIVERSE_COLLECTIONS = COLLECTION_CATEGORIES.find(c => c.id === 'universe')?.collections || [];

interface Content {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality: string;
}

const ITEMS_PER_PAGE = 30;

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
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  const isShowTags = tag === '_show_tags';
  const isShowCollections = collection === '_show_collections';
  const hasRealFilter = (tag && !isShowTags) || (collection && !isShowCollections);
  
  const [movies, setMovies] = useState<Content[]>([]);
  const [series, setSeries] = useState<Content[]>([]);
  const [movieTotal, setMovieTotal] = useState(0);
  const [seriesTotal, setSeriesTotal] = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [collectionSearch, setCollectionSearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('universe');
  
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
  }, [tag, collection, type, page, hasRealFilter]);

  const fetchResults = async () => {
    setResultsLoading(true);
    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      const actualTag = isShowTags ? null : tag;
      const actualCollection = isShowCollections ? null : collection;
      
      if (actualTag) {
        const moviesRes = await fetch(`/api/movies?tag=${encodeURIComponent(actualTag)}&limit=${ITEMS_PER_PAGE}&offset=${offset}&card=true`);
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || []);
          setMovieTotal(data.total || 0);
        }
        
        const seriesRes = await fetch(`/api/series?tag=${encodeURIComponent(actualTag)}&limit=${ITEMS_PER_PAGE}&offset=${offset}&card=true`);
        if (seriesRes.ok) {
          const data = await seriesRes.json();
          setSeries(data.series || []);
          setSeriesTotal(data.total || 0);
        }
      } else if (actualCollection) {
        const moviesRes = await fetch(`/api/movies?collection=${encodeURIComponent(actualCollection)}&limit=${ITEMS_PER_PAGE}&offset=${offset}&card=true`);
        if (moviesRes.ok) {
          const data = await moviesRes.json();
          setMovies(data.movies || []);
          setMovieTotal(data.total || 0);
        }
        
        const seriesRes = await fetch(`/api/series?collection=${encodeURIComponent(actualCollection)}&limit=${ITEMS_PER_PAGE}&offset=${offset}&card=true`);
        if (seriesRes.ok) {
          const data = await seriesRes.json();
          setSeries(data.series || []);
          setSeriesTotal(data.total || 0);
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
    router.push(`/genres?tag=${encodeURIComponent(selectedTag)}&type=${selectedType}&page=1`);
  };

  const handleCollectionClick = (selectedCollection: string) => {
    router.push(`/genres?collection=${encodeURIComponent(selectedCollection)}&type=all&page=1`);
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

  // Pagination helpers
  const goToPage = (newPage: number) => {
    const params = new URLSearchParams();
    if (tag && !isShowTags) params.set('tag', tag);
    if (collection && !isShowCollections) params.set('collection', collection);
    params.set('type', type);
    params.set('page', String(newPage));
    router.push(`/genres?${params.toString()}`);
  };

  // Calculate total pages based on active content type
  const totalCount = type === 'movie' ? movieTotal : type === 'series' ? seriesTotal : Math.max(movieTotal, seriesTotal);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', page, '...', totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-1 py-4 mt-4">
        <button 
          onClick={() => goToPage(page - 1)} 
          disabled={page === 1}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button 
              key={idx} 
              onClick={() => goToPage(p)}
              className={cn('w-10 h-10 rounded-lg text-sm font-medium',
                page === p ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}
            >
              {p}
            </button>
          ) : <span key={idx} className="text-gray-500 px-2">...</span>
        ))}
        <button 
          onClick={() => goToPage(page + 1)} 
          disabled={page === totalPages}
          className="p-2 rounded-lg bg-gray-700 text-white disabled:opacity-40 hover:bg-gray-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

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
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {[...Array(30)].map((_, i) => (
                <div key={i}>
                  <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
                  <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
                  <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {(type === 'all' || type === 'movie') && movies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Film className="w-4 h-4 text-red-500" />
                    Movies ({movieTotal})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {movies.map((m) => (
                      <ContentCard key={m.id} {...m} type="movie" />
                    ))}
                  </div>
                  {type === 'movie' && renderPagination()}
                </div>
              )}
              
              {(type === 'all' || type === 'series') && series.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Tv className="w-4 h-4 text-red-500" />
                    Series ({seriesTotal})
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {series.map((s) => (
                      <ContentCard key={s.id} {...s} type="series" />
                    ))}
                  </div>
                  {type === 'series' && renderPagination()}
                </div>
              )}
              
              {movies.length === 0 && series.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No results found</p>
                </div>
              )}
              
              {type === 'all' && (movies.length > 0 || series.length > 0) && renderPagination()}
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
            <div className="space-y-4">
              {/* Search Collections */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={collectionSearch}
                  onChange={(e) => setCollectionSearch(e.target.value)}
                  className="w-full bg-[#1a1a1a] text-white rounded-lg pl-10 pr-10 py-2.5 text-sm border border-gray-700 focus:border-red-500 focus:outline-none transition-colors duration-200"
                />
                {collectionSearch && (
                  <button
                    onClick={() => setCollectionSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Total Count */}
              <p className="text-gray-500 text-xs">
                {collectionSearch
                  ? `${AUTO_COLLECTIONS.filter(c => c.toLowerCase().includes(collectionSearch.toLowerCase())).length} results found`
                  : `${AUTO_COLLECTIONS.length} collections in ${COLLECTION_CATEGORIES.length} categories`
                }
              </p>

              {/* Category Tabs - Horizontal Swipeable */}
              {!collectionSearch && (
                <div className="relative">
                  <div
                    className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                  >
                    {COLLECTION_CATEGORIES.map((category) => {
                      const tabStyle = CATEGORY_TAB_STYLES[category.id];
                      const isActive = activeCategoryTab === category.id;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategoryTab(category.id)}
                          className={cn(
                            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 border-b-2',
                            isActive
                              ? `${tabStyle.active} bg-white/5`
                              : `${tabStyle.inactive} hover:text-white hover:bg-white/5`
                          )}
                        >
                          <span className="text-base">{category.emoji}</span>
                          <span>{category.label}</span>
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded-full',
                            isActive ? 'bg-white/10' : 'bg-white/5'
                          )}>
                            {category.collections.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Collections Grid */}
              {collectionSearch ? (
                /* Search results across all categories */
                <div className="space-y-4">
                  {COLLECTION_CATEGORIES.map((category) => {
                    const filteredCollections = category.collections.filter(c =>
                      c.toLowerCase().includes(collectionSearch.toLowerCase())
                    );
                    if (filteredCollections.length === 0) return null;
                    const style = CATEGORY_STYLES[category.id];
                    return (
                      <section key={category.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{category.emoji}</span>
                          <h2 className="text-white font-semibold text-sm">{category.label}</h2>
                          <span className="text-gray-500 text-xs">({filteredCollections.length})</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {filteredCollections.map((c) => {
                            const isUniverse = UNIVERSE_COLLECTIONS.includes(c);
                            return (
                              <Link
                                key={c}
                                href={`/collection/${encodeURIComponent(c)}`}
                                className={`px-3 py-3 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between border ${style.bg} ${style.border} ${style.text} ${style.hover}`}
                              >
                                <span className="truncate">{c}</span>
                                {isUniverse && (
                                  <span className="text-[10px] bg-orange-500/30 px-1.5 py-0.5 rounded ml-1 flex-shrink-0">UNIVERSE</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>
              ) : (
                /* Show only active category */
                <section>
                  {(() => {
                    const category = COLLECTION_CATEGORIES.find(c => c.id === activeCategoryTab);
                    if (!category) return null;
                    const style = CATEGORY_STYLES[category.id];
                    const isUniverseCat = category.id === 'universe';
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{category.emoji}</span>
                          <h2 className="text-white font-semibold">{category.label}</h2>
                          <span className="text-gray-500 text-xs">({category.collections.length})</span>
                        </div>
                        {isUniverseCat && (
                          <p className="text-gray-400 text-xs mb-3">
                            Shows ALL universe content across franchises
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          {category.collections.map((c) => {
                            const isUniverse = UNIVERSE_COLLECTIONS.includes(c);
                            return (
                              <Link
                                key={c}
                                href={`/collection/${encodeURIComponent(c)}`}
                                className={`px-3 py-3 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between border ${style.bg} ${style.border} ${style.text} ${style.hover}`}
                              >
                                <span className="truncate">{c}</span>
                                {isUniverse && (
                                  <span className="text-[10px] bg-orange-500/30 px-1.5 py-0.5 rounded ml-1 flex-shrink-0">UNIVERSE</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GenresGridSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function GenresPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      <Suspense fallback={<GenresHeaderFallback />}>
        <GenresHeader />
      </Suspense>
      <Suspense fallback={<GenresGridSkeleton />}>
        <GenresContent />
      </Suspense>
    </div>
  );
}
