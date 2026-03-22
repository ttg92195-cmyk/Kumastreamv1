'use client';

import { useEffect, useState, useMemo, useCallback, memo, startTransition, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Star, Calendar, Clock, ChevronDown, Download, Lock, Server, ExternalLink, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CastCard } from '@/components/movie/CastCard';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

// Shallow selector for bookmarks - only re-render when THIS movie's bookmark status changes
const useIsBookmarked = (movieId: string | null) => {
  const bookmarkIds = useAppStore(s => {
    const ids = new Set<string>();
    s.bookmarks.forEach(b => {
      if (b.movieId) ids.add(b.movieId);
    });
    return ids;
  });
  return movieId ? bookmarkIds.has(movieId) : false;
};

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
  genres: string;
  quality4k: boolean;
  director: string | null;
  fileSize: string | null;
  quality: string | null;
  format: string | null;
  subtitle: string | null;
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

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

const TABS = [{ id: 'detail', label: 'Detail' }, { id: 'download', label: 'Download' }, { id: 'explore', label: 'Explore' }] as const;

// Helper functions outside component
const formatDuration = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;

const getServerGroups = (links: { server: string; quality: string; url: string; size?: string | null }[]) => {
  const map: Record<string, typeof links> = {};
  links?.forEach(l => { const s = l.server || 'Server 1'; (map[s] || (map[s] = [])).push(l); });
  return Object.entries(map).sort(([a], [b]) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0)).map(([name, links]) => ({ name, links }));
};

// Ultra-memoized micro components
const TabBtn = memo(({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={cn('px-4 py-3 text-sm font-medium relative', active ? 'text-theme' : 'text-gray-400 hover:text-white')}>
    {label}
    {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme" />}
  </button>
));

const GenreTags = memo(({ genres }: { genres: string }) => {
  if (!genres) return null;
  const list = genres.split(',').filter(Boolean);
  return <div className="flex flex-wrap gap-2 mb-4">{list.map(g => <span key={g} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">{g.trim()}</span>)}</div>;
});

const MetaInfo = memo(({ year, rating, duration }: { year: number; rating: number; duration: number }) => (
  <div className="flex items-center gap-4 text-sm text-gray-400">
    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{year}</span>
    <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-theme text-theme" />{rating.toFixed(1)}</span>
    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{duration} min</span>
  </div>
));

const OverviewSection = memo(({ description, expanded, onToggle }: { description: string; expanded: boolean; onToggle: () => void }) => (
  <div>
    <h3 className="text-white font-semibold mb-2">Overview</h3>
    <p className={cn('text-gray-300 text-sm leading-relaxed whitespace-pre-line', !expanded && 'line-clamp-4')}>{description || 'No description available.'}</p>
    <button onClick={onToggle} className="text-sm mt-2 flex items-center gap-1 text-theme">
      {expanded ? 'View Less' : 'View More'}
      <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
    </button>
  </div>
));

const TechInfo = memo(({ fileSize, quality, format, genres, duration, subtitle, director }: Partial<Movie> & { duration: number }) => (
  <div className="space-y-2">
    {fileSize && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">File Size</span><span className="text-white text-sm">{fileSize}</span></div>}
    {quality && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Quality</span><span className="text-white text-sm">{quality}</span></div>}
    {format && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Format</span><span className="text-white text-sm">{format}</span></div>}
    {genres && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Genre</span><span className="text-white text-sm">{genres}</span></div>}
    <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Duration</span><span className="text-white text-sm">{formatDuration(duration)}</span></div>
    {subtitle && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Subtitle</span><span className="text-white text-sm">{subtitle}</span></div>}
    {director && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Director</span><span className="text-white text-sm">{director}</span></div>}
  </div>
));

const TagBadges = memo(({ quality4k, genres }: { quality4k: boolean; genres: string }) => {
  const list = genres?.split(',').filter(Boolean) || [];
  return (
    <div className="flex flex-wrap gap-2">
      {quality4k && <span className="px-2 py-1 text-xs rounded bg-theme-30 text-theme">4K</span>}
      {list.map(g => <span key={g} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">{g.trim()}</span>)}
    </div>
  );
});

const CastSection = memo(({ casts }: { casts: Cast[] }) => {
  if (!casts?.length) return null;
  return (
    <div>
      <h3 className="text-white font-semibold mb-3">Casts</h3>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">{casts.map(c => <CastCard key={c.id} name={c.name} role={c.role} photo={c.photo || undefined} />)}</div>
    </div>
  );
});

const SimilarGrid = memo(({ movies }: { movies: SimilarMovie[] }) => {
  if (!movies.length) return <p className="text-gray-500 text-center py-10">No similar movies found</p>;
  return <div className="grid grid-cols-3 gap-3">{movies.map(m => <MovieCard key={m.id} id={m.id} title={m.title} year={m.year} rating={m.rating} poster={m.poster || PLACEHOLDER} quality4k={m.quality4k} quality={m.quality} type="movie" />)}</div>;
});

const ServerItem = memo(({ server, idx, expanded, onToggle, fmt, sub }: { server: { name: string; links: { quality: string; url: string; size?: string | null }[] }; idx: number; expanded: boolean; onToggle: (i: number) => void; fmt?: string; sub?: string }) => (
  <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
    <button onClick={() => onToggle(idx)} className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-theme-20"><Server className="w-5 h-5 text-theme" /></div>
        <div className="text-left"><p className="text-white font-medium">{server.name}</p><p className="text-gray-400 text-xs">{[...new Set(server.links.map(l => l.quality))].join(', ')}</p></div>
      </div>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">{server.links.length} qualit{server.links.length > 1 ? 'ies' : 'y'}</span>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>
    </button>
    {expanded && <div className="border-t border-gray-700 p-3 space-y-2">{server.links.map((l, i) => (
      <div key={i} className="p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><span className="px-2 py-0.5 text-white text-xs font-bold rounded bg-theme">{l.quality}</span><span className="text-white text-sm font-medium">{l.quality.includes('4K') ? 'Ultra HD' : l.quality.includes('1080') ? 'Full HD' : 'HD'}</span></div>
          {l.size && <span className="text-gray-400 text-xs">{l.size}</span>}
        </div>
        <p className="text-gray-400 text-xs mb-3">{fmt || 'MKV'} • {sub || 'Subtitle'}</p>
        <a href={l.url} target="_blank" rel="noopener noreferrer" className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-90 bg-theme"><Download className="w-4 h-4" />Download {l.quality}<ExternalLink className="w-3 h-3" /></a>
      </div>
    ))}</div>}
  </div>
));

// Main component
export default function MovieDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [expandedServer, setExpandedServer] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Zustand - optimized selectors
  const dlEnabled = useSettingsStore(s => s.showAllDownloadLinks);
  const addRecent = useAppStore(s => s.addRecent);
  const addBm = useAppStore(s => s.addBookmark);
  const rmBm = useAppStore(s => s.removeBookmark);
  const removeBookmark = useAppStore(s => s.removeBookmark);
  
  // Use optimized bookmark hook - only re-renders when THIS movie's status changes
  const isBookmarked = useIsBookmarked(movie?.id || null);

  // Stable callbacks
  const handleBack = useCallback(() => router.back(), [router]);
  const handleToggleViewMore = useCallback(() => setViewMore(v => !v), []);
  const handleToggleServer = useCallback((i: number) => setExpandedServer(p => p === i ? null : i), []);
  const handleCloseModal = useCallback(() => setShowModal(false), []);
  const handleOpenModal = useCallback(() => setShowModal(true), []);
  const handleTabChange = useCallback((id: string) => startTransition(() => setActiveTab(id)), []);

  // Memoized computed
  const servers = useMemo(() => movie?.downloadLinks?.length ? getServerGroups(movie.downloadLinks) : [], [movie?.downloadLinks]);

  // Fetch
  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    let mounted = true;

    fetch(`/api/movies/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d.movie) {
          const m = { ...d.movie, poster: d.movie.poster || PLACEHOLDER, backdrop: d.movie.backdrop || d.movie.poster || PLACEHOLDER };
          setMovie(m);
          setSimilar((d.similarMovies || []).map((s: SimilarMovie) => ({ ...s, poster: s.poster || PLACEHOLDER })));
          // Defer non-critical
          queueMicrotask(() => mounted && addRecent({ id: `movie-${m.id}`, type: 'movie', movieId: m.id, movie: { id: m.id, title: m.title, year: m.year, rating: m.rating, poster: m.poster, quality4k: m.quality4k, quality: m.quality }, viewedAt: new Date().toISOString() }));
        } else setError('Not found');
        setLoading(false);
      })
      .catch(() => mounted && (setError('Error'), setLoading(false)));

    return () => { mounted = false; };
  }, [params.id, addRecent]);

  const handleBookmark = useCallback(() => {
    if (!movie) return;
    if (isBookmarked) {
      // Find and remove bookmark by movieId
      const bm = useAppStore.getState().bookmarks.find(b => b.movieId === movie.id);
      if (bm) rmBm(bm.id);
    } else {
      addBm({ id: `movie-${movie.id}`, type: 'movie', movieId: movie.id, movie: { id: movie.id, title: movie.title, year: movie.year, rating: movie.rating, poster: movie.poster || PLACEHOLDER, quality4k: movie.quality4k, quality: movie.quality } });
    }
  }, [movie, isBookmarked, addBm, rmBm]);

  // Modal scroll lock
  useEffect(() => { document.body.style.overflow = showModal ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [showModal]);

  if (loading) return <div className="min-h-screen bg-[#0f0f0f]"><div className="relative w-full h-[280px] bg-[#1a1a1a]"><div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" /></div><div className="px-4 -mt-16 relative z-10"><div className="flex items-end gap-4 mb-4"><div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" /><div className="flex-1 pb-2 space-y-3"><div className="h-7 w-3/4 bg-[#1a1a1a] rounded" /><div className="flex items-center gap-4"><div className="h-4 w-12 bg-[#1a1a1a] rounded" /><div className="h-4 w-8 bg-[#1a1a1a] rounded" /><div className="h-4 w-16 bg-[#1a1a1a] rounded" /></div></div></div></div></div>;
  if (error || !movie) return <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4"><p className="text-gray-500 mb-4">{error || 'Not found'}</p><button onClick={() => router.push('/')} className="px-4 py-2 text-white rounded-lg text-sm bg-theme">Go Home</button></div>;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[280px] bg-[#1a1a1a]">
        <Image src={movie.backdrop || movie.poster || PLACEHOLDER} alt={movie.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"><ArrowLeft className="w-5 h-5" /></button>
          <button onClick={handleBookmark} className={cn('w-10 h-10 rounded-full flex items-center justify-center', isBookmarked ? 'text-white bg-theme' : 'bg-black/50 text-white')}><Heart className={cn('w-5 h-5', isBookmarked && 'fill-current')} /></button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-xl border border-gray-700/30">
            <Image src={movie.poster || PLACEHOLDER} alt={movie.title} fill className="object-cover" />
            {movie.quality?.split('/')[0]?.trim() && <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[60px] truncate">{movie.quality.split('/')[0].trim()}</div>}
            {!movie.quality && movie.quality4k && <div className="absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-theme">4K</div>}
          </div>
          <div className="flex-1 pb-2">
            <h1 className="text-white text-xl font-bold mb-2">{movie.title}</h1>
            <MetaInfo year={movie.year} rating={movie.rating} duration={movie.duration} />
          </div>
        </div>

        <GenreTags genres={movie.genres} />

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-800 mb-4">
          {TABS.map(t => <TabBtn key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={() => handleTabChange(t.id)} />)}
        </div>

        {/* Content */}
        {activeTab === 'detail' && (
          <div className="space-y-6">
            <OverviewSection description={movie.description} expanded={viewMore} onToggle={handleToggleViewMore} />
            <TechInfo fileSize={movie.fileSize} quality={movie.quality} format={movie.format} genres={movie.genres} duration={movie.duration} subtitle={movie.subtitle} director={movie.director} />
            <TagBadges quality4k={movie.quality4k} genres={movie.genres} />
            <CastSection casts={movie.casts} />
          </div>
        )}

        {activeTab === 'download' && (
          !dlEnabled ? (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Options</h3>
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-12 h-12 mx-auto mb-3 text-theme" />
                <p className="text-white font-medium mb-2">Download Links are Hidden</p>
                <p className="text-gray-400 text-sm mb-4">Enable in Downloads page</p>
                <button onClick={() => router.push('/downloads')} className="px-4 py-2 text-white rounded-lg text-sm font-medium bg-theme">Go to Downloads</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Options</h3>
              <button onClick={handleOpenModal} className="w-full py-4 bg-gray-800/50 rounded-lg border border-gray-700 flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors">
                <Download className="w-5 h-5 text-theme" /><span className="text-white font-medium">View Download Links</span><span className="text-gray-400 text-sm">({servers.length || 2} servers)</span>
              </button>
            </div>
          )
        )}

        {activeTab === 'explore' && (
          <div>
            <h3 className="text-white font-semibold mb-4">You may also like</h3>
            <SimilarGrid movies={similar} />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && dlEnabled && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative w-full max-w-lg bg-[#0f0f0f] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-[#0f0f0f] z-10">
              <h2 className="text-white font-bold text-lg">Download Options</h2>
              <button onClick={handleCloseModal} className="p-2 rounded-full bg-gray-800 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {servers.length ? servers.map((s, i) => <ServerItem key={i} server={s} idx={i} expanded={expandedServer === i} onToggle={handleToggleServer} fmt={movie.format} sub={movie.subtitle} />) : (
                [{ n: 'Server 1', q: ['4K UHD', '1080p', '720p'] }, { n: 'Server 2', q: ['1080p', '720p', '480p'] }].map((s, i) => <ServerItem key={i} server={{ name: s.n, links: s.q.map((q, j) => ({ quality: q, url: '#', size: movie.fileSize?.split(' / ')[j] })) }} idx={i} expanded={expandedServer === i} onToggle={handleToggleServer} fmt={movie.format} sub={movie.subtitle} />)
              )}
            </div>
            <div className="h-16 bg-[#0f0f0f]" />
          </div>
        </div>
      )}
    </div>
  );
}
