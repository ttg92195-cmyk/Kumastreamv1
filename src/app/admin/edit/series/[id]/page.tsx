'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X, Tv, Edit2, Trash2, Check, ChevronDown, ChevronUp, CheckCircle, Tag, FolderOpen, Server } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

// Server options (1-10)
const serverOptions = Array.from({ length: 10 }, (_, i) => `Server ${i + 1}`);

// Predefined quality options
const qualityOptions = ['4K UHD', '2K', '1080p', '720p', '480p', 'Blu-Ray', 'WEB-DL', 'HDRip'];

// Predefined tags for Series (Movies + Completed)
const SERIES_TAGS = [
  '4K', '2K', '1080p', '720p',
  'Anime', 'Bollywood', 'C Drama', 'Featured Movies',
  'K Drama', 'Reality Show', 'Thai Drama', 'Trending', 'Completed'
];

// Predefined collections for Series
const SERIES_COLLECTIONS = [
  // Auto-detected from title
  'Marvel', 'DC',
  // Series Collections
  'Sit-com', 'Sports Documentaries',
  // Franchises
  'Harry Potter', 'Lord of the Rings', 'Star Wars',
  'Fast & Furious', 'John Wick', 'Mission Impossible',
  'Transformers', 'X-Men', 'Spider-Man'
];

interface DownloadLink {
  id?: string;
  server: string;
  quality: string;
  url: string;
  size: string;
}

interface Episode {
  id: string;
  season: number;
  episode: number;
  title: string;
  duration: number;
  fileSize: string;
  quality: string;
  format: string;
  downloadLinks: DownloadLink[];
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  backdrop: string;
  description: string;
  genres: string;
  tags: string;
  collections: string;
  quality: string;
  quality4k: boolean;
  seasons: number;
  totalEpisodes: number;
  episodes: Episode[];
  downloadLinks: DownloadLink[];
}

export default function EditSeriesPage() {
  const router = useRouter();
  const params = useParams();
  const seriesId = params.id as string;
  const { admin, _hasHydrated } = useAppStore();
  const { themeColor } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [series, setSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  // Movie tags (selectable)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Movie collections (selectable)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // Quality tags (for poster display)
  const [qualityTags, setQualityTags] = useState<string[]>([]);
  const [newQualityTag, setNewQualityTag] = useState('');

  // Form state for adding new link
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [customQuality, setCustomQuality] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSize, setNewSize] = useState('');

  // Edit state
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ server: '', quality: '', url: '', size: '' });

  // Expand/collapse season
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set([1]));

  // Expanded servers state for grouped view (per episode)
  const [expandedEpisodeServers, setExpandedEpisodeServers] = useState<Map<string, Set<string>>>(new Map());

  // Series form state
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    rating: '',
    poster: '',
    backdrop: '',
    description: '',
    genres: '',
    quality4k: false,
    seasons: '',
    totalEpisodes: '',
  });

  // Track modified episodes for saving
  const [modifiedEpisodes, setModifiedEpisodes] = useState<Set<string>>(new Set());

  // Check admin authentication
  useEffect(() => {
    if (_hasHydrated && !admin) {
      router.push('/admin/login');
    }
  }, [_hasHydrated, admin, router]);

  // Fetch series data
  const fetchSeries = useCallback(async () => {
    if (!seriesId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/series/${seriesId}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.series;
        setSeries(s);
        // Ensure downloadLinks is always an array for each episode
        const episodesWithLinks = (s.episodes || []).map((ep: Episode) => ({
          ...ep,
          downloadLinks: Array.isArray(ep.downloadLinks) ? ep.downloadLinks : [],
        }));
        setEpisodes(episodesWithLinks);
        
        // Parse movie tags from tags field
        const tagsStr = s.tags || '';
        const sTags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
        setSelectedTags(sTags);
        
        // Parse collections from collections field
        const collectionsStr = s.collections || '';
        const sCollections = collectionsStr.split(',').map((c: string) => c.trim()).filter(Boolean);
        setSelectedCollections(sCollections);
        
        // Parse quality tags from quality field
        const qualityStr = s.quality || '';
        const qTags = qualityStr.split('/').map((q: string) => q.trim()).filter(Boolean);
        setQualityTags(qTags);
        
        setFormData({
          title: s.title || '',
          year: String(s.year || ''),
          rating: String(s.rating || ''),
          poster: s.poster || '',
          backdrop: s.backdrop || '',
          description: s.description || '',
          genres: s.genres || '',
          quality4k: s.quality4k || false,
          seasons: String(s.seasons || ''),
          totalEpisodes: String(s.totalEpisodes || ''),
        });
      } else {
        alert('Series not found');
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Error fetching series:', err);
      alert('Failed to load series');
    } finally {
      setLoading(false);
    }
  }, [seriesId, router]);

  useEffect(() => {
    if (admin && seriesId) {
      fetchSeries();
    }
  }, [admin, seriesId, fetchSeries]);

  // Toggle movie tag
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setSaveSuccess(false);
  };

  // Toggle movie collection
  const toggleCollection = (collection: string) => {
    if (selectedCollections.includes(collection)) {
      setSelectedCollections(selectedCollections.filter(c => c !== collection));
    } else {
      setSelectedCollections([...selectedCollections, collection]);
    }
    setSaveSuccess(false);
  };

  // Add quality tag
  const addQualityTag = () => {
    const tag = newQualityTag.trim();
    if (!tag) return;
    if (qualityTags.includes(tag)) {
      alert('This quality already exists');
      return;
    }
    setQualityTags([...qualityTags, tag]);
    setNewQualityTag('');
    setSaveSuccess(false);
  };

  // Remove quality tag
  const removeQualityTag = (tag: string) => {
    setQualityTags(qualityTags.filter(t => t !== tag));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!series) return;

    setSaving(true);
    setSaveSuccess(false);
    console.log('=== Starting Save ===');
    console.log('Modified episodes:', Array.from(modifiedEpisodes));
    console.log('Episodes with links:', episodes.filter(ep => ep.downloadLinks && ep.downloadLinks.length > 0).map(ep => ({ id: ep.id, links: ep.downloadLinks.length })));

    try {
      // Combine quality tags into quality string
      const qualityString = qualityTags.join(' / ');
      // Combine movie tags into tags string
      const tagsString = selectedTags.join(', ');
      // Combine collections into collections string
      const collectionsString = selectedCollections.join(', ');
      
      // First update series basic info
      const seriesUpdateData = {
        title: formData.title,
        year: parseInt(formData.year) || 0,
        rating: parseFloat(formData.rating) || 0,
        poster: formData.poster,
        backdrop: formData.backdrop,
        description: formData.description,
        genres: formData.genres,
        tags: tagsString,
        collections: collectionsString,
        quality4k: formData.quality4k,
        quality: qualityString,
        seasons: parseInt(formData.seasons) || 0,
        totalEpisodes: parseInt(formData.totalEpisodes) || 0,
      };

      console.log('Updating series with data:', seriesUpdateData);

      const seriesRes = await fetch(`/api/series/${series.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesUpdateData),
      });

      if (!seriesRes.ok) {
        const data = await seriesRes.json();
        console.error('Series update failed:', data);
        alert('Failed to update series: ' + (data.error || 'Unknown error'));
        setSaving(false);
        return;
      }

      console.log('Series updated successfully');

      // Update episodes with their download links
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const episode of episodes) {
        if (episode.downloadLinks && episode.downloadLinks.length > 0) {
          console.log(`Updating episode ${episode.id} with ${episode.downloadLinks.length} links`);

          try {
            const epRes = await fetch(`/api/episodes/${episode.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                downloadLinks: episode.downloadLinks,
              }),
            });

            if (epRes.ok) {
              console.log(`Episode ${episode.id} updated successfully`);
              successCount++;
            } else {
              const epData = await epRes.json();
              console.error(`Episode ${episode.id} update failed:`, epData);
              errors.push(`Episode ${episode.episode}: ${epData.error || 'Unknown error'}`);
              failCount++;
            }
          } catch (epErr: any) {
            console.error(`Episode ${episode.id} update error:`, epErr);
            errors.push(`Episode ${episode.episode}: ${epErr.message || 'Network error'}`);
            failCount++;
          }
        }
      }

      console.log(`=== Save Complete === Success: ${successCount}, Failed: ${failCount}`);

      if (failCount > 0) {
        alert(`Series updated but ${failCount} episodes failed to save.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }

      setModifiedEpisodes(new Set());
    } catch (err: any) {
      console.error('Error updating series:', err);
      alert('Failed to update series: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Get episodes for selected season
  const getEpisodesForSeason = (seasonNum: number) => {
    return episodes.filter(ep => ep.season === seasonNum).sort((a, b) => a.episode - b.episode);
  };

  // Get available seasons
  const getAvailableSeasons = () => {
    const seasonSet = new Set(episodes.map(ep => ep.season));
    return Array.from(seasonSet).sort((a, b) => a - b);
  };

  // Get episodes for dropdown
  const getEpisodesForDropdown = () => {
    if (!selectedSeason) return [];
    const seasonNum = parseInt(selectedSeason);
    return episodes.filter(ep => ep.season === seasonNum).sort((a, b) => a.episode - b.episode);
  };

  // Add new download link to episode
  const handleAddDownloadLink = () => {
    const quality = customQuality.trim() || selectedQuality;
    if (!selectedEpisodeId || !selectedServer || !quality || !newUrl.trim()) {
      alert('Please select Season, Episode, Server, Quality and enter URL');
      return;
    }

    const newLink: DownloadLink = {
      server: selectedServer,
      quality,
      url: newUrl.trim(),
      size: newSize.trim(),
    };

    console.log('Adding download link to episode:', selectedEpisodeId, newLink);

    setEpisodes(prev => prev.map(ep => {
      if (ep.id === selectedEpisodeId) {
        const updatedLinks = [...(ep.downloadLinks || []), newLink];
        console.log(`Episode ${ep.id} now has ${updatedLinks.length} links`);
        return {
          ...ep,
          downloadLinks: updatedLinks,
        };
      }
      return ep;
    }));

    // Mark this episode as modified
    setModifiedEpisodes(prev => new Set(prev).add(selectedEpisodeId));

    // Reset form
    setSelectedServer('');
    setSelectedQuality('');
    setCustomQuality('');
    setNewUrl('');
    setNewSize('');

    console.log('Download link added successfully');
  };

  // Remove download link from episode
  const removeDownloadLink = (episodeId: string, linkIndex: number) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id === episodeId) {
        return {
          ...ep,
          downloadLinks: ep.downloadLinks.filter((_, i) => i !== linkIndex),
        };
      }
      return ep;
    }));
    setModifiedEpisodes(prev => new Set(prev).add(episodeId));
  };

  // Start editing
  const startEditing = (episodeId: string, linkIndex: number) => {
    const episode = episodes.find(ep => ep.id === episodeId);
    if (episode && episode.downloadLinks[linkIndex]) {
      setEditingEpisodeId(episodeId);
      setEditingIndex(linkIndex);
      setEditForm({ ...episode.downloadLinks[linkIndex] });
    }
  };

  // Save edit
  const saveEdit = (episodeId: string, linkIndex: number) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id === episodeId) {
        const updatedLinks = [...ep.downloadLinks];
        updatedLinks[linkIndex] = {
          ...updatedLinks[linkIndex],
          ...editForm,
        };
        return { ...ep, downloadLinks: updatedLinks };
      }
      return ep;
    }));
    setEditingEpisodeId(null);
    setEditingIndex(null);
    setEditForm({ server: '', quality: '', url: '', size: '' });
    setModifiedEpisodes(prev => new Set(prev).add(episodeId));
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingEpisodeId(null);
    setEditingIndex(null);
    setEditForm({ server: '', quality: '', url: '', size: '' });
  };

  // Toggle season expand
  const toggleSeason = (seasonNum: number) => {
    setExpandedSeasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seasonNum)) {
        newSet.delete(seasonNum);
      } else {
        newSet.add(seasonNum);
      }
      return newSet;
    });
  };

  // Toggle server expansion for an episode
  const toggleEpisodeServer = (episodeId: string, serverName: string) => {
    setExpandedEpisodeServers(prev => {
      const newMap = new Map(prev);
      const episodeServers = newMap.get(episodeId) || new Set();
      const newSet = new Set(episodeServers);
      if (newSet.has(serverName)) {
        newSet.delete(serverName);
      } else {
        newSet.add(serverName);
      }
      newMap.set(episodeId, newSet);
      return newMap;
    });
  };

  // Check if server is expanded for an episode
  const isServerExpanded = (episodeId: string, serverName: string) => {
    return expandedEpisodeServers.get(episodeId)?.has(serverName) ?? false;
  };

  // Update form field helper
  const updateField = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  if (!_hasHydrated || !admin) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeColor }} />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-white">Series not found</p>
      </div>
    );
  }

  const availableSeasons = getAvailableSeasons();

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} style={{ color: themeColor }}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">Edit Series</h1>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1 text-green-500 text-sm">
                <CheckCircle className="w-4 h-4" />
                Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
                saving
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'text-white hover:opacity-90'
              )}
              style={saving ? {} : { backgroundColor: themeColor }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save All Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Poster Preview */}
        <div className="flex gap-4">
          <div className="w-24 h-36 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0 relative">
            {formData.poster ? (
              <img
                src={formData.poster}
                alt={formData.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Tv className="w-8 h-8 text-gray-600" />
              </div>
            )}
            {/* Quality Badge Preview */}
            {qualityTags[0] && (
              <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {qualityTags[0]}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${themeColor}`}
                onBlur={(e) => e.target.style.boxShadow = ''}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => updateField('year', e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Seasons</label>
                <input
                  type="number"
                  value={formData.seasons}
                  onChange={(e) => updateField('seasons', e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Episodes</label>
                <input
                  type="number"
                  value={formData.totalEpisodes}
                  onChange={(e) => updateField('totalEpisodes', e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tags Section - Clickable predefined tags */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color: themeColor }} />
            <h3 className="text-white font-semibold">Tags</h3>
          </div>
          <p className="text-gray-400 text-xs">Click to select tags for this series. Selected tags will be used for filtering.</p>
          
          <div className="flex flex-wrap gap-2">
            {SERIES_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    isSelected
                      ? 'text-white ring-2 ring-offset-2 ring-offset-[#0f0f0f]'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                  style={isSelected ? { backgroundColor: '#ef4444', ringColor: '#ef4444' } : {}}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          
          {selectedTags.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-500 text-xs mb-2">Selected: {selectedTags.length} tags</p>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Collections Section - Clickable predefined collections */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" style={{ color: themeColor }} />
            <h3 className="text-white font-semibold">Collections</h3>
          </div>
          <p className="text-gray-400 text-xs">Click to select collections for this series.</p>
          
          <div className="flex flex-wrap gap-2">
            {SERIES_COLLECTIONS.map((collection) => {
              const isSelected = selectedCollections.includes(collection);
              return (
                <button
                  key={collection}
                  onClick={() => toggleCollection(collection)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    isSelected
                      ? 'text-white ring-2 ring-offset-2 ring-offset-[#0f0f0f]'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  )}
                  style={isSelected ? { backgroundColor: '#8b5cf6', ringColor: '#8b5cf6' } : {}}
                >
                  {collection}
                </button>
              );
            })}
          </div>
          
          {selectedCollections.length > 0 && (
            <div className="pt-2 border-t border-gray-700">
              <p className="text-gray-500 text-xs mb-2">Selected: {selectedCollections.length} collections</p>
              <div className="flex flex-wrap gap-1">
                {selectedCollections.map((collection) => (
                  <span
                    key={collection}
                    className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded"
                  >
                    {collection}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quality Tags Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <h3 className="text-white font-semibold">Quality Available</h3>
          <p className="text-gray-400 text-xs">Add quality tags (e.g., 4K, 1080p, 720p). First tag shows on poster.</p>
          
          <div className="flex flex-wrap gap-2">
            {qualityTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: themeColor }}
              >
                <span>{tag}</span>
                <button
                  onClick={() => removeQualityTag(tag)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newQualityTag}
              onChange={(e) => setNewQualityTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQualityTag()}
              placeholder="e.g., 4K UHD, 1080p HEVC"
              className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={addQualityTag}
              disabled={!newQualityTag.trim()}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Episode Download Links Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Episode Download Links</h3>
            {modifiedEpisodes.size > 0 && (
              <span className="text-yellow-500 text-xs">
                {modifiedEpisodes.size} episode(s) modified
              </span>
            )}
          </div>

          {/* Add New Link Form */}
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 border border-gray-600">
            <h4 className="text-white text-sm font-medium">Add New Download Link</h4>

            {/* Season and Episode Selects */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Select Season *</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(e.target.value);
                    setSelectedEpisodeId('');
                  }}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">-- Select Season --</option>
                  {availableSeasons.map((s) => (
                    <option key={s} value={s}>Season {s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Select Episode *</label>
                <select
                  value={selectedEpisodeId}
                  onChange={(e) => setSelectedEpisodeId(e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  disabled={!selectedSeason}
                >
                  <option value="">-- Select Episode --</option>
                  {getEpisodesForDropdown().map((ep) => (
                    <option key={ep.id} value={ep.id}>
                      Episode {ep.episode}: {ep.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Server Select */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Select Server *</label>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              >
                <option value="">-- Select Server --</option>
                {serverOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Quality Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Quality *</label>
                <select
                  value={selectedQuality}
                  onChange={(e) => {
                    setSelectedQuality(e.target.value);
                    if (e.target.value) setCustomQuality('');
                  }}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                >
                  <option value="">-- Select Quality --</option>
                  {qualityOptions.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Or Custom Quality</label>
                <input
                  type="text"
                  value={customQuality}
                  onChange={(e) => {
                    setCustomQuality(e.target.value);
                    if (e.target.value) setSelectedQuality('');
                  }}
                  placeholder="e.g., 4K HDR"
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* URL and Size */}
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Download URL *</label>
              <input
                type="text"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/download"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs mb-1 block">Size (Optional)</label>
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="e.g., 500 MB"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <button
              onClick={handleAddDownloadLink}
              disabled={!selectedEpisodeId || !selectedServer || (!selectedQuality && !customQuality.trim()) || !newUrl.trim()}
              className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="w-4 h-4" />
              Add Download Link
            </button>
          </div>

          {/* Episodes by Season */}
          <div className="space-y-3">
            {availableSeasons.map((seasonNum) => (
              <div key={seasonNum} className="bg-gray-700/30 rounded-lg overflow-hidden">
                {/* Season Header */}
                <button
                  onClick={() => toggleSeason(seasonNum)}
                  className="w-full flex items-center justify-between p-3 text-white font-medium hover:bg-gray-700/50 transition-colors"
                >
                  <span>Season {seasonNum} ({getEpisodesForSeason(seasonNum).length} episodes)</span>
                  {expandedSeasons.has(seasonNum) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>

                {/* Episodes List */}
                {expandedSeasons.has(seasonNum) && (
                  <div className="border-t border-gray-700 divide-y divide-gray-700/50">
                    {getEpisodesForSeason(seasonNum).map((ep) => (
                      <div key={ep.id} className="p-3 space-y-2">
                        {/* Episode Title */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-white text-sm font-medium">
                              Episode {ep.episode}: {ep.title}
                            </span>
                            <span className="text-gray-500 text-xs ml-2">
                              {ep.downloadLinks?.length || 0} links
                            </span>
                            {modifiedEpisodes.has(ep.id) && (
                              <span className="text-yellow-500 text-xs ml-2">(modified)</span>
                            )}
                          </div>
                        </div>

                        {/* Episode Download Links - Grouped by Server */}
                        {ep.downloadLinks && ep.downloadLinks.length > 0 && (
                          <div className="space-y-2">
                            {/* Group links by server */}
                            {Array.from(new Set(ep.downloadLinks.map(l => l.server || 'N/A'))).map((serverName) => {
                              const serverLinks = ep.downloadLinks
                                .map((link, index) => ({ ...link, originalIndex: index }))
                                .filter(l => (l.server || 'N/A') === serverName);
                              const isExpanded = isServerExpanded(ep.id, serverName);
                              
                              return (
                                <div key={serverName} className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                                  {/* Server Header */}
                                  <button
                                    onClick={() => toggleEpisodeServer(ep.id, serverName)}
                                    className="w-full flex items-center justify-between p-2 hover:bg-gray-700 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-500/20">
                                        <Server className="w-3 h-3 text-blue-400" />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-white font-medium text-xs">{serverName}</p>
                                        <p className="text-gray-400 text-[10px]">{serverLinks.length} qualit{serverLinks.length > 1 ? 'ies' : 'y'}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-400">
                                        {serverLinks.map(l => l.quality).join(', ')}
                                      </span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                      )}
                                    </div>
                                  </button>
                                  
                                  {/* Quality Links - Collapsible */}
                                  {isExpanded && (
                                    <div className="border-t border-gray-600 p-1.5 space-y-1.5">
                                      {serverLinks.map((link) => (
                                        <div key={link.originalIndex} className="p-2 bg-gray-800/50 rounded flex items-center justify-between gap-2">
                                          {editingEpisodeId === ep.id && editingIndex === link.originalIndex ? (
                                            /* Edit Mode */
                                            <div className="flex-1 grid grid-cols-4 gap-2">
                                              <select
                                                value={editForm.server}
                                                onChange={(e) => setEditForm({ ...editForm, server: e.target.value })}
                                                className="bg-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none"
                                              >
                                                {serverOptions.map((s) => (
                                                  <option key={s} value={s}>{s}</option>
                                                ))}
                                              </select>
                                              <input
                                                type="text"
                                                value={editForm.quality}
                                                onChange={(e) => setEditForm({ ...editForm, quality: e.target.value })}
                                                placeholder="Quality"
                                                className="bg-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none"
                                              />
                                              <input
                                                type="text"
                                                value={editForm.url}
                                                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                                                placeholder="URL"
                                                className="col-span-2 bg-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none"
                                              />
                                              <input
                                                type="text"
                                                value={editForm.size}
                                                onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                                                placeholder="Size"
                                                className="bg-gray-700 text-white rounded px-2 py-1 text-xs focus:outline-none"
                                              />
                                            </div>
                                          ) : (
                                            /* View Mode */
                                            <>
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="px-2 py-0.5 text-white text-xs font-bold rounded flex-shrink-0" style={{ backgroundColor: themeColor }}>
                                                  {link.quality}
                                                </span>
                                                <p className="text-gray-300 text-xs truncate flex-1">{link.url || 'No URL'}</p>
                                                {link.size && (
                                                  <span className="text-gray-400 text-xs flex-shrink-0">{link.size}</span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            {editingEpisodeId === ep.id && editingIndex === link.originalIndex ? (
                                              <>
                                                <button onClick={() => saveEdit(ep.id, link.originalIndex)} className="p-1 text-green-400 hover:bg-green-500/20 rounded">
                                                  <Check className="w-3 h-3" />
                                                </button>
                                                <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-600 rounded">
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button onClick={() => startEditing(ep.id, link.originalIndex)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                                  <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button onClick={() => removeDownloadLink(ep.id, link.originalIndex)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded">
                                                  <Trash2 className="w-3 h-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* No links message */}
                        {(!ep.downloadLinks || ep.downloadLinks.length === 0) && (
                          <p className="text-gray-500 text-xs text-center py-2">No download links</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {episodes.length === 0 && (
            <div className="text-center py-8 bg-gray-700/30 rounded-lg">
              <p className="text-gray-400 text-sm">No episodes found</p>
            </div>
          )}
        </div>

        {/* Other Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Poster URL</label>
            <input
              type="text"
              value={formData.poster}
              onChange={(e) => updateField('poster', e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Backdrop URL</label>
            <input
              type="text"
              value={formData.backdrop}
              onChange={(e) => updateField('backdrop', e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Genres (comma separated)</label>
            <input
              type="text"
              value={formData.genres}
              onChange={(e) => updateField('genres', e.target.value)}
              placeholder="Action, Drama, Thriller"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Rating</label>
            <input
              type="number"
              step="0.1"
              value={formData.rating}
              onChange={(e) => updateField('rating', e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          {/* 4K Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-white text-sm">4K Quality Available</span>
            <button
              onClick={() => updateField('quality4k', !formData.quality4k)}
              className={cn(
                'w-12 h-6 rounded-full transition-colors',
                formData.quality4k ? '' : 'bg-gray-600'
              )}
              style={formData.quality4k ? { backgroundColor: themeColor } : {}}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full bg-white transition-transform',
                  formData.quality4k ? 'translate-x-6' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end gap-3 pb-8">
          {saveSuccess && (
            <span className="flex items-center gap-1 text-green-500 text-sm">
              <CheckCircle className="w-4 h-4" />
              All changes saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
              saving
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'text-white hover:opacity-90'
            )}
            style={saving ? {} : { backgroundColor: themeColor }}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
