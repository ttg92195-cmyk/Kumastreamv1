'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Film, Tv, Search } from 'lucide-react';
import { MovieCard } from '@/components/movie/MovieCard';
import { useSettingsStore } from '@/stores/settings-store';

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

// Known collection keywords with display names
const COLLECTION_NAMES: Record<string, string> = {
  'marvel': 'Marvel Universe',
  'dc': 'DC Universe',
  'harry potter': 'Harry Potter Collection',
  'lord of the rings': 'Lord of the Rings',
  'star wars': 'Star Wars',
  '007': 'James Bond (007)',
  'james bond': 'James Bond Collection',
  'batman': 'Batman Collection',
  'spider-man': 'Spider-Man Collection',
  'x-men': 'X-Men Collection',
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
  'dragon gate': 'Dragon Gate Collection',
  'ocean': "Ocean's Collection",
  'a24': 'A24 Movies',
  'christmas': 'Christmas Movies',
  'queen of kung fu': 'Queen Of Kung Fu',
  'thai gdh': 'Thai GDH',
  'sit-com': 'Sit-com Series',
  'sitcom': 'Sit-com Series',
  'sports documentaries': 'Sports Documentaries',
  // New Auto Collections
  'the conjuring universe': 'The Conjuring Universe',
  'jurassic': 'Jurassic Park / World',
  'pirates of the caribbean': 'Pirates of the Caribbean',
  'monsterverse': 'MonsterVerse',
  'despicable me': 'Despicable Me / Minions',
};

// Special universe collections that need multiple keyword searches
// These franchises have movies that don't contain the main keyword in their title
const UNIVERSE_KEYWORDS: Record<string, string[]> = {
  'marvel': [
    'Marvel', 'Iron Man', 'Thor', 'Captain America', 'Avengers', 
    'Guardians of the Galaxy', 'Spider-Man', 'Spiderman', 'X-Men', 
    'Deadpool', 'Ant-Man', 'Doctor Strange', 'Black Panther', 
    'Captain Marvel', 'Black Widow', 'WandaVision', 'Loki', 
    'Hawkeye', 'Moon Knight', 'Eternals', 'Shang-Chi', 'Venom',
    'Wolverine', 'Hulk', 'Fantastic Four', 'Blade', 'Daredevil',
    'Punisher', 'Ghost Rider'
  ],
  'dc': [
    'DC', 'Batman', 'Superman', 'Wonder Woman', 'Aquaman', 
    'Flash', 'Justice League', 'Joker', 'Suicide Squad', 
    'Shazam', 'Green Lantern', 'Arrow', 'Supergirl', 'Black Adam',
    'Constantine', 'Catwoman', 'Birds of Prey', 'Doom Patrol',
    'Titans', 'Peacemaker', 'Blue Beetle', 'Man of Steel'
  ],
  'the conjuring universe': [
    'Conjuring', 'Annabelle', 'Nun', 'La Llorona', 'Crooked Man'
  ],
  'jurassic': [
    'Jurassic Park', 'Jurassic World', 'Jurassic'
  ],
  'monsterverse': [
    'Godzilla', 'King Kong', 'Kong', 'Skull Island', 'Monarch'
  ],
  'despicable me': [
    'Despicable Me', 'Minions'
  ],
  // James Bond / 007 Universe
  '007': [
    'James Bond', '007', 'Bond', 'Dr. No', 'From Russia with Love',
    'Goldfinger', 'Thunderball', 'You Only Live Twice',
    'On Her Majesty\'s Secret Service', 'Diamonds Are Forever',
    'Live and Let Die', 'The Man with the Golden Gun',
    'The Spy Who Loved Me', 'Moonraker', 'For Your Eyes Only',
    'Octopussy', 'A View to a Kill', 'The Living Daylights',
    'Licence to Kill', 'GoldenEye', 'Tomorrow Never Dies',
    'The World Is Not Enough', 'Die Another Day', 'Casino Royale',
    'Quantum of Solace', 'Skyfall', 'Spectre', 'No Time to Die'
  ],
  // Lord of the Rings / Middle Earth Universe
  'lord of the rings': [
    'Lord of the Rings', 'The Hobbit', 'Middle Earth',
    'Fellowship of the Ring', 'Two Towers', 'Return of the King',
    'An Unexpected Journey', 'The Desolation of Smaug',
    'The Battle of the Five Armies', 'Gandalf', 'Frodo',
    'Bilbo', 'Aragorn', 'Legolas', 'Gimli', 'Gollum',
    'Rings of Power'
  ],
};

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const { themeColor } = useSettingsStore();
  const keyword = decodeURIComponent(params.keyword as string).toLowerCase();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      try {
        // Check if this is a special universe collection
        const universeKeywords = UNIVERSE_KEYWORDS[keyword];
        
        if (universeKeywords) {
          // Fetch all keywords in PARALLEL for faster loading
          const allMovies: Movie[] = [];
          const allSeries: Series[] = [];
          const movieIds = new Set<string>();
          const seriesIds = new Set<string>();
          
          // Create all fetch promises at once
          const fetchPromises = universeKeywords.map(async (searchKeyword) => {
            const [moviesRes, seriesRes] = await Promise.all([
              fetch(`/api/movies?search=${encodeURIComponent(searchKeyword)}&limit=500`),
              fetch(`/api/series?search=${encodeURIComponent(searchKeyword)}&limit=500`)
            ]);
            
            const results: { movies: Movie[]; series: Series[] } = { movies: [], series: [] };
            
            if (moviesRes.ok) {
              const data = await moviesRes.json();
              results.movies = data.movies.map((m: Movie) => ({
                ...m,
                poster: m.poster || PLACEHOLDER_POSTER,
              }));
            }
            
            if (seriesRes.ok) {
              const data = await seriesRes.json();
              results.series = data.series.map((s: Series) => ({
                ...s,
                poster: s.poster || PLACEHOLDER_POSTER,
              }));
            }
            
            return results;
          });
          
          // Wait for all requests to complete in parallel
          const allResults = await Promise.all(fetchPromises);
          
          // Combine and deduplicate results
          for (const result of allResults) {
            for (const m of result.movies) {
              if (!movieIds.has(m.id)) {
                movieIds.add(m.id);
                allMovies.push(m);
              }
            }
            for (const s of result.series) {
              if (!seriesIds.has(s.id)) {
                seriesIds.add(s.id);
                allSeries.push(s);
              }
            }
          }
          
          // Sort by year descending
          allMovies.sort((a, b) => b.year - a.year);
          allSeries.sort((a, b) => b.year - a.year);
          
          setMovies(allMovies);
          setSeries(allSeries);
        } else {
          // Standard single keyword search
          const moviesRes = await fetch(`/api/movies?search=${encodeURIComponent(keyword)}&limit=9999`);
          if (moviesRes.ok) {
            const data = await moviesRes.json();
            setMovies(data.movies.map((m: Movie) => ({
              ...m,
              poster: m.poster || PLACEHOLDER_POSTER,
            })));
          }

          const seriesRes = await fetch(`/api/series?search=${encodeURIComponent(keyword)}&limit=9999`);
          if (seriesRes.ok) {
            const data = await seriesRes.json();
            setSeries(data.series.map((s: Series) => ({
              ...s,
              poster: s.poster || PLACEHOLDER_POSTER,
            })));
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

  const displayName = COLLECTION_NAMES[keyword] || keyword.charAt(0).toUpperCase() + keyword.slice(1);
  const totalItems = movies.length + series.length;

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
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
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
              className="px-4 py-2 text-white rounded-lg text-sm font-medium"
              style={{ backgroundColor: themeColor }}
            >
              Go Home
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Movies Section */}
            {movies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4" style={{ color: themeColor }} />
                  <h2 className="text-white font-semibold">Movies ({movies.length})</h2>
                </div>
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
              </div>
            )}

            {/* Series Section */}
            {series.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tv className="w-4 h-4" style={{ color: themeColor }} />
                  <h2 className="text-white font-semibold">Series ({series.length})</h2>
                </div>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
