'use client';

import { useEffect, useState, useMemo, useCallback, memo, startTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, ChevronDown, Download, Lock, Server, ChevronRight, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CastCard } from '@/components/movie/CastCard';
import { MovieCard } from '@/components/movie/MovieCard';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';

// Optimized hook for series bookmark status - only re-renders when THIS series's status changes
const useIsSeriesBookmarked = (seriesId: string | null) => {
  const bookmarkIds = useAppStore(s => {
    const ids = new Set<string>();
    s.bookmarks.forEach(b => {
      if (b.seriesId) ids.add(b.seriesId);
    });
    return ids;
  });
  return seriesId ? bookmarkIds.has(seriesId) : false;
};

interface Cast { id: string; name: string; role: string; photo: string | null; }
interface Episode { id: string; season: number; episode: number; title: string; duration: number; fileSize: string | null; downloadLinks?: { server: string; quality: string; url: string; size?: string | null }[]; }
interface Series { id: string; title: string; year: number; rating: number; poster: string | null; backdrop: string | null; description: string; genres: string; quality4k: boolean; quality?: string | null; seasons: number; totalEpisodes: number; casts: Cast[]; episodes?: Episode[]; }
interface Similar { id: string; title: string; year: number; rating: number; poster: string | null; quality4k: boolean; quality?: string | null; }

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9Ijc1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZpbGw9IiM2NjYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
const TABS = [{ id: 'detail', label: 'Detail' }, { id: 'download', label: 'Download' }, { id: 'explore', label: 'Explore' }] as const;

// Memoized micro components
const TabBtn = memo(({ id, label, active, onClick }: { id: string; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={cn('px-4 py-3 text-sm font-medium relative', active ? 'text-theme' : 'text-gray-400 hover:text-white')}>
    {label}{active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme" />}
  </button>
));

const GenreTags = memo(({ genres }: { genres: string }) => {
  if (!genres) return null;
  return <div className="flex flex-wrap gap-2 mb-4">{genres.split(',').filter(Boolean).map(g => <span key={g} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">{g.trim()}</span>)}</div>;
});

const MetaInfo = memo(({ year, rating, seasons }: { year: number; rating: number; seasons: number }) => (
  <div className="series-meta-row">
    <span className="series-meta-item">📅 {year}</span>
    <span className="series-meta-item series-meta-rating">⭐ {rating.toFixed(1)}</span>
    <span className="series-meta-item">⏱ {seasons} Seasons</span>
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

const InfoRows = memo(({ seasons, episodes, genres }: { seasons: number; episodes: number; genres?: string }) => (
  <div className="space-y-2">
    <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Seasons</span><span className="text-white text-sm">{seasons}</span></div>
    <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Episodes</span><span className="text-white text-sm">{episodes}</span></div>
    {genres && <div className="flex items-start gap-2"><span className="text-gray-500 text-sm min-w-[100px]">Genre</span><span className="text-white text-sm">{genres}</span></div>}
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

const SimilarGrid = memo(({ items }: { items: Similar[] }) => {
  if (!items.length) return <p className="text-gray-500 text-center py-10">No similar series found</p>;
  return <div className="grid grid-cols-3 gap-3">{items.map(s => <MovieCard key={s.id} id={s.id} title={s.title} year={s.year} rating={s.rating} poster={s.poster || PLACEHOLDER} quality4k={s.quality4k} quality={s.quality} type="series" />)}</div>;
});

const EpisodeItem = memo(({ ep, expanded, onToggle }: { ep: Episode; expanded: boolean; onToggle: () => void }) => (
  <div className="bg-gray-900/30">
    <button onClick={onToggle} className="w-full p-4 flex items-center justify-between hover:bg-gray-800/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-theme-20 text-theme">{ep.episode}</div>
        <div className="text-left"><p className="text-white text-sm">{ep.title}</p><p className="text-gray-500 text-xs">{ep.duration} min • {ep.fileSize || 'N/A'}</p></div>
      </div>
      <ChevronRight className={cn('w-5 h-5 text-gray-400 transition-transform', expanded && 'rotate-90')} />
    </button>
    {expanded && (
      <div className="px-4 pb-4">
        <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
          <div className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded flex items-center justify-center bg-theme-20"><Server className="w-4 h-4 text-theme" /></div>
              <div className="text-left"><p className="text-white text-sm font-medium">Server 1</p><p className="text-gray-400 text-xs">1080p, 720p</p></div>
            </div>
            <span className="text-xs text-gray-400">2 qualities</span>
          </div>
          <div className="border-t border-gray-700 p-2">
            {['1080p', '720p'].map((q, i) => (
              <div key={q} className="p-2 bg-gray-700/50 rounded flex items-center justify-between mb-2 last:mb-0">
                <div><p className="text-white text-sm font-medium">{q}</p><p className="text-gray-500 text-xs">{i === 0 ? (ep.fileSize || '1.2 GB') : '600 MB'}</p></div>
                <button className="px-3 py-1.5 text-white text-xs rounded font-medium flex items-center gap-1 bg-theme"><Download className="w-3 h-3" />Download</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </div>
));

const SeasonBlock = memo(({ season, episodes, expanded, expandedEp, onToggleSeason, onToggleEp }: { season: number; episodes: Episode[]; expanded: boolean; expandedEp: Record<string, boolean>; onToggleSeason: () => void; onToggleEp: (id: string) => void }) => (
  <div className="border border-gray-800 rounded-lg overflow-hidden">
    <button onClick={onToggleSeason} className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800 transition-colors">
      <span className="text-white font-medium">Season {season}</span>
      <div className="flex items-center gap-2 text-gray-400"><span className="text-sm">{episodes.length} episodes</span><ChevronRight className={cn('w-5 h-5 transition-transform', expanded && 'rotate-90')} /></div>
    </button>
    {expanded && <div className="divide-y divide-gray-800">{episodes.map(ep => <EpisodeItem key={ep.id} ep={ep} expanded={!!expandedEp[ep.id]} onToggle={() => onToggleEp(ep.id)} />)}</div>}
  </div>
));

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [series, setSeries] = useState<Series | null>(null);
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMore, setViewMore] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});
  const [expandedEpisodes, setExpandedEpisodes] = useState<Record<string, boolean>>({});

  const dlEnabled = useSettingsStore(s => s.showAllDownloadLinks);
  const addRecent = useAppStore(s => s.addRecent);
  const addBm = useAppStore(s => s.addBookmark);
  const rmBm = useAppStore(s => s.removeBookmark);

  const handleBack = useCallback(() => router.back(), [router]);
  const handleToggleViewMore = useCallback(() => setViewMore(v => !v), []);
  const handleToggleSeason = useCallback((s: number) => setExpandedSeasons(p => ({ ...p, [s]: !p[s] })), []);
  const handleToggleEpisode = useCallback((id: string) => setExpandedEpisodes(p => ({ ...p, [id]: !p[id] })), []);
  const handleTabChange = useCallback((id: string) => startTransition(() => setActiveTab(id)), []);

  // Use optimized bookmark hook - only re-renders when THIS series's bookmark status changes
  const isBookmarked = useIsSeriesBookmarked(series?.id || null);
  const epsBySeason = useMemo(() => {
    if (!series?.episodes) return {};
    return series.episodes.reduce((acc, ep) => { if (!acc[ep.season]) acc[ep.season] = []; acc[ep.season].push(ep); return acc; }, {} as Record<number, Episode[]>);
  }, [series?.episodes]);

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;
    let mounted = true;

    fetch(`/api/series/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!mounted) return;
        if (d.series) {
          const s = { ...d.series, poster: d.series.poster || PLACEHOLDER, backdrop: d.series.backdrop || d.series.poster || PLACEHOLDER };
          setSeries(s);
          setSimilar((d.similarSeries || []).map((x: Similar) => ({ ...x, poster: x.poster || PLACEHOLDER })));
          queueMicrotask(() => mounted && addRecent({ id: `series-${s.id}`, type: 'series', seriesId: s.id, series: { id: s.id, title: s.title, year: s.year, rating: s.rating, poster: s.poster, quality4k: s.quality4k, quality: s.quality }, viewedAt: new Date().toISOString() }));
        } else setError('Not found');
        setLoading(false);
      })
      .catch(() => mounted && (setError('Error'), setLoading(false)));

    return () => { mounted = false; };
  }, [params.id, addRecent]);

  const handleBookmark = useCallback(() => {
    if (!series) return;
    if (isBookmarked) {
      const bm = useAppStore.getState().bookmarks.find(b => b.seriesId === series.id);
      if (bm) rmBm(bm.id);
    } else {
      addBm({ id: `series-${series.id}`, type: 'series', seriesId: series.id, series: { id: series.id, title: series.title, year: series.year, rating: series.rating, poster: series.poster || PLACEHOLDER, quality4k: series.quality4k, quality: series.quality } });
    }
  }, [series, isBookmarked, addBm, rmBm]);

  if (loading) return <div className="min-h-screen bg-[#0f0f0f]"><div className="relative w-full h-[280px] bg-[#1a1a1a]"><div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" /></div><div className="px-4 -mt-16 relative z-10"><div className="flex items-end gap-4 mb-4"><div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" /><div className="flex-1 pb-2 space-y-3"><div className="h-7 w-3/4 bg-[#1a1a1a] rounded" /><div className="flex items-center gap-4"><div className="h-4 w-12 bg-[#1a1a1a] rounded" /><div className="h-4 w-8 bg-[#1a1a1a] rounded" /><div className="h-4 w-20 bg-[#1a1a1a] rounded" /></div></div></div></div></div>;
  if (error || !series) return <div className="min-h-screen bg-[#0f0f0f] flex flex-col items-center justify-center p-4"><p className="text-gray-500 mb-4">{error || 'Not found'}</p><button onClick={() => router.push('/')} className="px-4 py-2 text-white rounded-lg text-sm bg-theme">Go Home</button></div>;

  return (
    <div className="page-container min-h-screen bg-[#0f0f0f] pb-20">
      <div className="backdrop-container relative w-full h-[280px] bg-[#1a1a1a]">
        <Image src={series.backdrop || series.poster || PLACEHOLDER} alt={series.title} fill className="object-cover" sizes="100vw" priority loading="eager" />
        <div className="backdrop-overlay" />
        <div className="backdrop-buttons absolute top-4 left-4 right-4 flex items-center justify-between">
          <button onClick={handleBack} className="backdrop-btn w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"><ArrowLeft className="w-5 h-5" /></button>
          <button onClick={handleBookmark} className={cn('backdrop-btn w-10 h-10 rounded-full flex items-center justify-center', isBookmarked ? 'text-white bg-theme' : 'bg-black/50 text-white')}><Heart className={cn('w-5 h-5', isBookmarked && 'fill-current')} /></button>
        </div>
      </div>

      <div className="movie-content-wrapper px-4 -mt-16 relative z-10">
        <div className="series-info-header flex items-end gap-4 mb-4">
          <div className="poster-container relative w-24 h-36 flex-shrink-0 rounded-lg overflow-hidden shadow-xl border border-gray-700/30">
            <Image src={series.poster || PLACEHOLDER} alt={series.title} fill className="object-cover" sizes="96px 144px" loading="eager" />
            {series.quality?.split('/')[0]?.trim() && <div className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full max-w-[60px] truncate">{series.quality.split('/')[0].trim()}</div>}
            {!series.quality && series.quality4k && <div className="absolute top-1 left-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-theme">4K</div>}
          </div>
          <div className="movie-info-content flex-1 pb-2">
            <h1 className="movie-title text-white text-xl font-bold mb-2">{series.title}</h1>
            <MetaInfo year={series.year} rating={series.rating} seasons={series.seasons} />
          </div>
        </div>

        <GenreTags genres={series.genres} />

        <div className="tab-nav-container flex items-center gap-2 border-b border-gray-800 mb-4">
          {TABS.map(t => <TabBtn key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={() => handleTabChange(t.id)} />)}
        </div>

        {activeTab === 'detail' && (
          <div className="space-y-6">
            <OverviewSection description={series.description} expanded={viewMore} onToggle={handleToggleViewMore} />
            <InfoRows seasons={series.seasons} episodes={series.totalEpisodes} genres={series.genres} />
            <TagBadges quality4k={series.quality4k} genres={series.genres} />
            <CastSection casts={series.casts} />
          </div>
        )}

        {activeTab === 'download' && (
          !dlEnabled ? (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Episodes</h3>
              <div className="text-center py-10 bg-gray-800/50 rounded-lg border border-gray-700">
                <Lock className="w-12 h-12 mx-auto mb-3 text-theme" />
                <p className="text-white font-medium mb-2">Download Links are Hidden</p>
                <button onClick={() => router.push('/downloads')} className="px-4 py-2 text-white rounded-lg text-sm font-medium bg-theme">Go to Downloads</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-white font-semibold">Download Episodes</h3>
              {Object.keys(epsBySeason).length === 0 ? (
                <div className="text-center py-10 bg-gray-800 rounded-lg"><Download className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 text-sm">No episodes available</p></div>
              ) : (
                Object.entries(epsBySeason).sort(([a], [b]) => Number(a) - Number(b)).map(([s, eps]) => (
                  <SeasonBlock key={s} season={Number(s)} episodes={eps} expanded={!!expandedSeasons[Number(s)]} expandedEp={expandedEpisodes} onToggleSeason={() => handleToggleSeason(Number(s))} onToggleEp={handleToggleEpisode} />
                ))
              )}
            </div>
          )
        )}

        {activeTab === 'explore' && (
          <div>
            <h3 className="text-white font-semibold mb-4">You may also like</h3>
            <SimilarGrid items={similar} />
          </div>
        )}
      </div>
    </div>
  );
}
