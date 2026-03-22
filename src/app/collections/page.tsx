'use client';
// Collections filtering page

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FolderOpen, Loader2, Film, Tv } from 'lucide-react';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

// Universe Auto Collections - Only those with content in database
const UNIVERSE_AUTO_COLLECTIONS = [
  'DC',
  'Spider-Man',
  'Batman',
  'Saw',
  'Studio Ghibli',
  'Tom & Jerry',
  'Despicable Me',
  'Lord of the Rings',
];

// Simple Card Component
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
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 20vw"
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

interface Content {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality: string;
}

function CollectionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { themeColor } = useSettingsStore();

  const collection = searchParams.get('collection') || '';
  const type = searchParams.get('type') || 'all';

  const [movies, setMovies] = useState<Content[]>([]);
  const [series, setSeries] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collection) {
      fetchData();
    }
  }, [collection, type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const moviesRes = await fetch(`/api/movies?collection=${encodeURIComponent(collection)}&limit=50`);
      if (moviesRes.ok) {
        const data = await moviesRes.json();
        setMovies(data.movies || []);
      }

      const seriesRes = await fetch(`/api/series?collection=${encodeURIComponent(collection)}&limit=50`);
      if (seriesRes.ok) {
        const data = await seriesRes.json();
        setSeries(data.series || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCollection = (c: string) => {
    router.push(`/collections?collection=${encodeURIComponent(c)}&type=all`);
  };

  const clearCollection = () => {
    router.push('/collections');
  };

  return (
    <div className="p-4 space-y-6">
      {collection && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-400 text-sm">Filtering by:</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium bg-purple-500">
            <FolderOpen className="w-4 h-4" />
            <span>{collection}</span>
            <button onClick={clearCollection} className="ml-1 hover:bg-white/20 rounded-full p-0.5">×</button>
          </div>
        </div>
      )}

      {/* Universe Auto Collections Grid */}
      <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" style={{ color: themeColor }} />
          <h3 className="text-white font-semibold">Universe Collections</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">AUTO</span>
        </div>
        <p className="text-gray-400 text-xs">Click a collection to filter movies and series</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {UNIVERSE_AUTO_COLLECTIONS.map((c) => (
            <button
              key={c}
              onClick={() => selectCollection(c)}
              className={cn(
                'px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center justify-between',
                collection === c
                  ? 'text-white ring-2 ring-offset-2 ring-offset-[#0a0a0a]'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
              style={collection === c ? { backgroundColor: themeColor, ringColor: themeColor } : {}}
            >
              <span>{c}</span>
              <span className="text-[10px] opacity-60">UNIVERSE</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {collection && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
            </div>
          ) : (
            <>
              {(type === 'all' || type === 'movie') && movies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Film className="w-4 h-4" style={{ color: themeColor }} />
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
                    <Tv className="w-4 h-4" style={{ color: themeColor }} />
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
                  <p className="text-gray-400">No results found for collection &quot;{collection}&quot;</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!collection && (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Select a collection above to filter movies and series</p>
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const { themeColor } = useSettingsStore();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} style={{ color: themeColor }}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-bold text-lg">Collections</h1>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
        </div>
      }>
        <CollectionsContent />
      </Suspense>
    </div>
  );
}
