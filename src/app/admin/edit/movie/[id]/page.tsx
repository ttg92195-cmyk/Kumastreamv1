'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Plus, X, Film, Edit2, Trash2, Check, CheckCircle, Tag, FolderOpen, ChevronDown, ChevronUp, Server } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

// Server options (1-10)
const serverOptions = Array.from({ length: 10 }, (_, i) => `Server ${i + 1}`);

// Predefined quality options
const qualityOptions = ['4K UHD', '2K', '1080p', '720p', '480p', 'Blu-Ray', 'WEB-DL', 'HDRip'];

// Predefined tags for Movies
const MOVIE_TAGS = [
  '4K', '2K', '1080p', '720p',
  'Anime', 'Bollywood', 'C Drama', 'Featured Movies',
  'K Drama', 'Reality Show', 'Thai Drama', 'Trending'
];

// Predefined collections for Movies
const MOVIE_COLLECTIONS = [
  // Auto-detected from title
  'Marvel', 'DC',
  // Movie Collections
  '007', 'A24 movies', 'American Pie', 'Batman',
  'CHRISTMAS MOVIES', 'Detective Chinatown', 'Dragon Gate Posthouse',
  'Final Destination', 'Harry Potter', 'Lord of the Rings',
  'Ocean\'s Collection', 'Queen Of Kung Fu', 'Saw Collection',
  'Scooby-Doo', 'Star Wars', 'Studio Ghibli',
  'Thai GDH', 'Tom & Jerry',
  // Franchises
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

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  duration: number;
  poster: string;
  backdrop: string;
  description: string;
  review: string;
  genres: string;
  tags: string;
  collections: string;
  quality4k: boolean;
  director: string;
  fileSize: string;
  quality: string;
  format: string;
  subtitle: string;
  imdbRating: number;
  rtRating: number;
  downloadLinks: DownloadLink[];
}

export default function EditMoviePage() {
  const router = useRouter();
  const params = useParams();
  const movieId = params.id as string;
  const { admin, _hasHydrated } = useAppStore();
  const { themeColor } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);

  // Quality tags (for poster display)
  const [qualityTags, setQualityTags] = useState<string[]>([]);
  const [newQualityTag, setNewQualityTag] = useState('');

  // Movie tags (selectable)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Movie collections (selectable)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  // New link form state
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [customQuality, setCustomQuality] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newSize, setNewSize] = useState('');

  // Edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ server: '', quality: '', url: '', size: '' });
  
  // Expanded servers state for grouped view
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    rating: '',
    duration: '',
    poster: '',
    backdrop: '',
    description: '',
    review: '',
    genres: '',
    director: '',
    fileSize: '',
    format: '',
    subtitle: '',
    imdbRating: '',
    rtRating: '',
  });

  // Check admin authentication
  useEffect(() => {
    if (_hasHydrated && !admin) {
      router.push('/admin/login');
    }
  }, [_hasHydrated, admin, router]);

  // Fetch movie data
  const fetchMovie = useCallback(async () => {
    if (!movieId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/movies/${movieId}`);
      if (res.ok) {
        const data = await res.json();
        const m = data.movie;
        setMovie(m);
        setDownloadLinks(m.downloadLinks || []);
        
        // Parse quality tags from quality field
        const qualityStr = m.quality || '';
        const qTags = qualityStr.split('/').map((q: string) => q.trim()).filter(Boolean);
        setQualityTags(qTags);
        
        // Parse movie tags from tags field
        const tagsStr = m.tags || '';
        const mTags = tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean);
        setSelectedTags(mTags);
        
        // Parse collections from collections field
        const collectionsStr = m.collections || '';
        const mCollections = collectionsStr.split(',').map((c: string) => c.trim()).filter(Boolean);
        setSelectedCollections(mCollections);
        
        setFormData({
          title: m.title || '',
          year: String(m.year || ''),
          rating: String(m.rating || ''),
          duration: String(m.duration || ''),
          poster: m.poster || '',
          backdrop: m.backdrop || '',
          description: m.description || '',
          review: m.review || '',
          genres: m.genres || '',
          director: m.director || '',
          fileSize: m.fileSize || '',
          format: m.format || '',
          subtitle: m.subtitle || '',
          imdbRating: String(m.imdbRating || ''),
          rtRating: String(m.rtRating || ''),
        });
      } else {
        alert('Movie not found');
        router.push('/admin/dashboard');
      }
    } catch (err) {
      console.error('Error fetching movie:', err);
      alert('Failed to load movie');
    } finally {
      setLoading(false);
    }
  }, [movieId, router]);

  useEffect(() => {
    if (admin && movieId) {
      fetchMovie();
    }
  }, [admin, movieId, fetchMovie]);

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
  };

  // Remove quality tag
  const removeQualityTag = (tag: string) => {
    setQualityTags(qualityTags.filter(t => t !== tag));
  };

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

  const handleSave = async () => {
    if (!movie) return;

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      // Combine quality tags into quality string
      const qualityString = qualityTags.join(' / ');
      // Combine movie tags into tags string
      const tagsString = selectedTags.join(', ');
      // Combine collections into collections string
      const collectionsString = selectedCollections.join(', ');
      
      const updateData = {
        title: formData.title,
        year: parseInt(formData.year) || 0,
        rating: parseFloat(formData.rating) || 0,
        duration: parseInt(formData.duration) || 0,
        poster: formData.poster,
        backdrop: formData.backdrop,
        description: formData.description,
        review: formData.review,
        genres: formData.genres,
        tags: tagsString,
        collections: collectionsString,
        director: formData.director,
        fileSize: formData.fileSize,
        quality: qualityString,
        format: formData.format,
        subtitle: formData.subtitle,
        imdbRating: parseFloat(formData.imdbRating) || 0,
        rtRating: parseInt(formData.rtRating) || 0,
        downloadLinks: downloadLinks,
      };

      const res = await fetch(`/api/movies/${movie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const data = await res.json();
        alert('Failed to update: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating movie:', err);
      alert('Failed to update movie');
    } finally {
      setSaving(false);
    }
  };

  // Add new download link
  const handleAddDownloadLink = () => {
    const quality = customQuality.trim() || selectedQuality;
    if (!selectedServer || !quality || !newUrl.trim()) {
      alert('Please select Server, Quality and enter URL');
      return;
    }

    const newLink: DownloadLink = {
      server: selectedServer,
      quality,
      url: newUrl.trim(),
      size: newSize.trim(),
    };

    setDownloadLinks([...downloadLinks, newLink]);

    // Reset form
    setSelectedServer('');
    setSelectedQuality('');
    setCustomQuality('');
    setNewUrl('');
    setNewSize('');
  };

  // Remove download link
  const removeDownloadLink = (index: number) => {
    setDownloadLinks(downloadLinks.filter((_, i) => i !== index));
  };

  // Start editing
  const startEditing = (index: number) => {
    const link = downloadLinks[index];
    setEditingIndex(index);
    setEditForm({ server: link.server, quality: link.quality, url: link.url, size: link.size });
  };

  // Save edit
  const saveEdit = (index: number) => {
    const updated = [...downloadLinks];
    updated[index] = {
      ...updated[index],
      server: editForm.server,
      quality: editForm.quality,
      url: editForm.url,
      size: editForm.size,
    };
    setDownloadLinks(updated);
    setEditingIndex(null);
    setEditForm({ server: '', quality: '', url: '', size: '' });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm({ server: '', quality: '', url: '', size: '' });
  };

  // Update form field helper
  const updateField = (field: string, value: string) => {
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

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <p className="text-white">Movie not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} style={{ color: themeColor }}>
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-bold text-lg">Edit Movie</h1>
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
                <Film className="w-8 h-8 text-gray-600" />
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
              <label className="text-gray-400 text-xs mb-1 block">Title *</label>
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
                <label className="text-gray-400 text-xs mb-1 block">Rating</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => updateField('rating', e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Duration (min)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
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

        {/* Tags Section - Clickable predefined tags */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" style={{ color: themeColor }} />
            <h3 className="text-white font-semibold">Tags</h3>
          </div>
          <p className="text-gray-400 text-xs">Click to select tags for this movie. Selected tags will be used for filtering.</p>
          
          <div className="flex flex-wrap gap-2">
            {MOVIE_TAGS.map((tag) => {
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
          <p className="text-gray-400 text-xs">Click to select collections for this movie.</p>
          
          <div className="flex flex-wrap gap-2">
            {MOVIE_COLLECTIONS.map((collection) => {
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

        {/* Download Links Section */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <h3 className="text-white font-semibold">Download Links</h3>

          {/* Add New Link Form */}
          <div className="bg-gray-700/50 rounded-lg p-4 space-y-3 border border-gray-600">
            <h4 className="text-white text-sm font-medium">Add New Download Link</h4>

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
                placeholder="e.g., 2.5 GB"
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <button
              onClick={handleAddDownloadLink}
              disabled={!selectedServer || (!selectedQuality && !customQuality.trim()) || !newUrl.trim()}
              className="w-full py-2.5 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="w-4 h-4" />
              Add Download Link
            </button>
          </div>

          {/* Download Links Grouped by Server */}
          {downloadLinks.length > 0 && (
            <div className="space-y-3">
              {/* Group links by server */}
              {Array.from(new Set(downloadLinks.map(l => l.server || 'N/A'))).map((serverName) => {
                const serverLinks = downloadLinks
                  .map((link, index) => ({ ...link, originalIndex: index }))
                  .filter(l => (l.server || 'N/A') === serverName);
                const isExpanded = expandedServers.has(serverName);
                
                return (
                  <div key={serverName} className="bg-gray-700/50 rounded-lg overflow-hidden border border-gray-600">
                    {/* Server Header */}
                    <button
                      onClick={() => {
                        const newExpanded = new Set(expandedServers);
                        if (isExpanded) {
                          newExpanded.delete(serverName);
                        } else {
                          newExpanded.add(serverName);
                        }
                        setExpandedServers(newExpanded);
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center bg-blue-500/20">
                          <Server className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium text-sm">{serverName}</p>
                          <p className="text-gray-400 text-xs">{serverLinks.length} qualit{serverLinks.length > 1 ? 'ies' : 'y'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {serverLinks.map(l => l.quality).join(', ')}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {/* Quality Links - Collapsible */}
                    {isExpanded && (
                      <div className="border-t border-gray-600 p-2 space-y-2">
                        {serverLinks.map((link) => (
                          <div key={link.originalIndex} className="p-2 bg-gray-800/50 rounded flex items-center justify-between gap-2">
                            {editingIndex === link.originalIndex ? (
                              /* Edit Mode */
                              <div className="flex-1 grid grid-cols-4 gap-2">
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
                              {editingIndex === link.originalIndex ? (
                                <>
                                  <button onClick={() => saveEdit(link.originalIndex)} className="p-1 text-green-400 hover:bg-green-500/20 rounded">
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button onClick={cancelEdit} className="p-1 text-gray-400 hover:bg-gray-600 rounded">
                                    <X className="w-3 h-3" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditing(link.originalIndex)} className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button onClick={() => removeDownloadLink(link.originalIndex)} className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded">
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

          {downloadLinks.length === 0 && (
            <div className="text-center py-8 bg-gray-700/30 rounded-lg">
              <p className="text-gray-400 text-sm">No download links added yet</p>
            </div>
          )}
        </div>

        {/* Other Fields */}
        <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
          <h3 className="text-white font-semibold">Movie Details</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Poster URL</label>
              <input
                type="text"
                value={formData.poster}
                onChange={(e) => updateField('poster', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Backdrop URL</label>
              <input
                type="text"
                value={formData.backdrop}
                onChange={(e) => updateField('backdrop', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={5}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs mb-1 block">Genres (comma separated)</label>
            <input
              type="text"
              value={formData.genres}
              onChange={(e) => updateField('genres', e.target.value)}
              placeholder="Action, Drama, Thriller"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Director</label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => updateField('director', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">File Size</label>
              <input
                type="text"
                value={formData.fileSize}
                onChange={(e) => updateField('fileSize', e.target.value)}
                placeholder="e.g., 7.7 GB / 3.4 GB / 1.5 GB"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Format</label>
              <input
                type="text"
                value={formData.format}
                onChange={(e) => updateField('format', e.target.value)}
                placeholder="MKV, MP4"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => updateField('subtitle', e.target.value)}
                placeholder="Myanmar Subtitle (Hardsub)"
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">IMDB Rating</label>
              <input
                type="number"
                step="0.1"
                value={formData.imdbRating}
                onChange={(e) => updateField('imdbRating', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Rotten Tomatoes (%)</label>
              <input
                type="number"
                value={formData.rtRating}
                onChange={(e) => updateField('rtRating', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
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
