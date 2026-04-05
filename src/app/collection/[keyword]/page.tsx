'use client';

import { Suspense, useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Film, Tv, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { MovieCard } from '@/components/movie/MovieCard';
import { cn } from '@/lib/utils';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string | null;
  quality4k: boolean;
  quality: string | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string | null;
  quality4k: boolean;
  quality: string | null;
}

const PLACEHOLDER_POSTER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

const ITEMS_PER_PAGE = 30;

// Known collection keywords with display names
const COLLECTION_NAMES: Record<string, string> = {
  'marvel': 'Marvel Universe',
  'dc': 'DC Universe',
  'harry potter': 'Harry Potter Universe',
  'lord of the rings': 'Lord of the Rings Universe',
  'star wars': 'Star Wars Universe',
  '007': 'James Bond (007)',
  'james bond': 'James Bond Collection',
  'batman': 'Batman Collection',
  'spider-man': 'Spider-Man Universe',
  'x-men': 'X-Men Universe',
  'fast & furious': 'Fast & Furious',
  'fast and furious': 'Fast & Furious',
  'john wick': 'John Wick Collection',
  'mission impossible': 'Mission Impossible',
  'transformers': 'Transformers Collection',
  'american pie': 'American Pie Collection',
  'final destination': 'Final Destination Collection',
  'saw': 'Saw Collection',
  'scooby-doo': 'Scooby-Doo Collection',
  'studio ghibli': 'Studio Ghibli',
  'tom & jerry': 'Tom & Jerry',
  'tom and jerry': 'Tom & Jerry',
  'detective chinatown': 'Detective Chinatown',
  "ocean's": "Ocean's Collection",
  'ocean': "Ocean's Collection",
  'pirates of the caribbean': 'Pirates of the Caribbean',
  'a24': 'A24 Movies',
  'christmas': 'Christmas Movies',
  'the conjuring universe': 'The Conjuring Universe',
  'jurassic': 'Jurassic Universe',
  'monsterverse': 'MonsterVerse',
  'despicable me': 'Despicable Me / Minions',
};

// Special universe collections that need multiple keyword searches
const UNIVERSE_KEYWORDS: Record<string, string[]> = {
  'marvel': ['Marvel', 'Iron Man', 'Thor', 'Captain America', 'Avengers', 'Guardians of the Galaxy', 'Spider-Man', 'Spiderman', 'X-Men', 'Deadpool', 'Ant-Man', 'Doctor Strange', 'Black Panther', 'Captain Marvel', 'Black Widow', 'WandaVision', 'Loki', 'Hawkeye', 'Moon Knight', 'Eternals', 'Shang-Chi', 'Venom', 'Wolverine', 'Hulk', 'Fantastic Four', 'Blade', 'Daredevil', 'Punisher', 'Ghost Rider'],
  'dc': ['DC', 'Batman', 'Superman', 'Wonder Woman', 'Aquaman', 'Flash', 'Justice League', 'Joker', 'Suicide Squad', 'Shazam', 'Green Lantern', 'Arrow', 'Supergirl', 'Black Adam', 'Constantine', 'Catwoman', 'Birds of Prey', 'Doom Patrol', 'Titans', 'Peacemaker', 'Blue Beetle', 'Man of Steel'],
  'harry potter': ['Harry Potter', 'Fantastic Beasts'],
  'star wars': ['Star Wars'],
  'x-men': ['X-Men', 'Wolverine', 'Deadpool', 'Logan'],
  'spider-man': ['Spider-Man', 'Spiderman', 'Venom', 'Morbius', 'Madame Web', 'Kraven'],
  'the conjuring universe': ['Conjuring', 'Annabelle', 'Nun', 'La Llorona', 'Crooked Man'],
  'jurassic': ['Jurassic Park', 'Jurassic World', 'Jurassic'],
  'monsterverse': ['Godzilla', 'King Kong', 'Kong', 'Skull Island', 'Monarch'],
  'despicable me': ['Despicable Me', 'Minions'],
  'lord of the rings': ['Lord of the Rings', 'Hobbit', 'Middle-earth'],
  'tom & jerry': ['Tom & Jerry', 'Tom and Jerry'],
  'james bond': ['James Bond', '007', 'Bond', 'Skyfall', 'Spectre', 'No Time to Die', 'Casino Royale', 'Quantum of Solace', 'Die Another Day', 'GoldenEye', 'Tomorrow Never Dies', 'Thunderball', 'Goldfinger', 'Dr. No', 'From Russia with Love', 'You Only Live Twice', 'On Her Majesty', 'The Spy Who Loved Me', 'Moonraker', 'For Your Eyes Only', 'Octopussy', 'A View to a Kill', 'The Living Daylights', 'Licence to Kill', 'Never Say Never Again'],
  'fast & furious': ['Fast & Furious', 'Fast and Furious', 'Furious', 'Fast Five', 'Hobbs & Shaw', 'Fast X', 'F9', 'The Fate of the Furious', 'Tokyo Drift', '2 Fast', 'Los Bandoleros'],
  'mission impossible': ['Mission Impossible', 'Mission: Impossible'],
  'transformers': ['Transformers', 'Bumblebee'],
  'batman': ['Batman', 'Dark Knight', 'Joker'],
  'scooby-doo': ['Scooby-Doo', 'Scooby Doo'],
};

function CollectionContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = decodeURIComponent(params.keyword as string).toLowerCase();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [allSeries, setAllSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        const universeKeywords = UNIVERSE_KEYWORDS[keyword];
        
        if (universeKeywords) {
          const movieMap = new Map<string, Movie>();
          const seriesMap = new Map<string, Series>();
          
          const fetchPromises = universeKeywords.map(async (searchKeyword) => {
            const [moviesRes, seriesRes] = await Promise.all([
              fetch(`/api/movies?search=${encodeURIComponent(searchKeyword)}&limit=100`),
              fetch(`/api/series?search=${encodeURIComponent(searchKeyword)}&limit=100`)
            ]);
            
            if (moviesRes.ok) {
              const data = await moviesRes.json();
              for (const m of data.movies) {
                if (!movieMap.has(m.id)) {
                  movieMap.set(m.id, { ...m, poster: m.poster || PLACEHOLDER_POSTER });
                }
              }
            }
            
            if (seriesRes.ok) {
              const data = await seriesRes.json();
              for (const s of data.series) {
                if (!seriesMap.has(s.id)) {
                  seriesMap.set(s.id, { ...s, poster: s.poster || PLACEHOLDER_POSTER });
                }
              }
            }
          });
          
          await Promise.all(fetchPromises);
          
          const movies = Array.from(movieMap.values()).sort((a, b) => b.year - a.year);
          const series = Array.from(seriesMap.values()).sort((a, b) => b.year - a.year);
          
          setAllMovies(movies);
          setAllSeries(series);
        } else {
          const [moviesRes, seriesRes] = await Promise.all([
            fetch(`/api/movies?search=${encodeURIComponent(keyword)}&limit=100`),
            fetch(`/api/series?search=${encodeURIComponent(keyword)}&limit=100`)
          ]);
          
          if (moviesRes.ok) {
            const data = await moviesRes.json();
            setAllMovies(data.movies.map((m: Movie) => ({ ...m, poster: m.poster || PLACEHOLDER_POSTER })));
          }
          
          if (seriesRes.ok) {
            const data = await seriesRes.json();
            setAllSeries(data.series.map((s: Series) => ({ ...s, poster: s.poster || PLACEHOLDER_POSTER })));
          }
        }
      } catch (error) {
        console.error('Error fetching collection:', error);
      } finally {
        setLoading(false);
      }
    };

    if (keyword) {
      fetchCollection();
    }
  }, [keyword]);

  // Combine and paginate
  const allItems = useMemo(() => {
    const items = [
      ...allMovies.map(m => ({ ...m, itemType: 'movie' as const })),
      ...allSeries.map(s => ({ ...s, itemType: 'series' as const }))
    ].sort((a, b) => b.year - a.year);
    return items;
  }, [allMovies, allSeries]);

  const totalItems = allItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages || 1));

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allItems.slice(start, start + ITEMS_PER_PAGE);
  }, [allItems, currentPage]);

  const movieCount = allMovies.length;
  const seriesCount = allSeries.length;

  const goToPage = (newPage: number) => {
    router.push(`/collection/${encodeURIComponent(keyword)}?page=${newPage}`);
  };

  const renderPagination = () => {
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
        {pages.map((p, idx) => (
          typeof p === 'number' ? (
            <button 
              key={idx} 
              onClick={() => goToPage(p)}
              className={cn('w-10 h-10 rounded-lg text-sm font-medium',
                currentPage === p ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600')}
            >
              {p}
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

  const displayName = COLLECTION_NAMES[keyword] || keyword.charAt(0).toUpperCase() + keyword.slice(1);

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">{displayName}</h1>
            <p className="text-gray-400 text-sm">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} found
              {movieCount > 0 && seriesCount > 0 && (
                <span className="text-gray-500"> ({movieCount} movies, {seriesCount} series)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(30)].map((_, i) => (
              <div key={i}>
                <div className="relative aspect-[2/3] bg-gray-800 rounded-md animate-pulse">
                  <div className="absolute top-1 left-1 w-8 h-4 bg-gray-700 rounded" />
                  <div className="absolute top-1 right-1 w-10 h-4 bg-gray-700 rounded" />
                </div>
                <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
                <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
              </div>
            ))}
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-white text-lg font-medium mb-2">No results found</p>
            <p className="text-gray-400 text-sm mb-6">
              No movies or series found with "{keyword}" in the title
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Combined Grid */}
            <div className="grid grid-cols-3 gap-3">
              {paginatedItems.map((item) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  year={item.year}
                  rating={item.rating}
                  poster={item.poster}
                  quality4k={item.quality4k}
                  quality={item.quality}
                  type={item.itemType}
                />
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f0f0f] pb-20">
        <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800 p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-800 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {[...Array(30)].map((_, i) => (
            <div key={i}>
              <div className="relative aspect-[2/3] bg-gray-800 rounded-md animate-pulse">
                <div className="absolute top-1 left-1 w-8 h-4 bg-gray-700 rounded" />
                <div className="absolute top-1 right-1 w-10 h-4 bg-gray-700 rounded" />
              </div>
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    }>
      <CollectionContent />
    </Suspense>
  );
}
