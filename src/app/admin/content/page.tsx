'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Header } from '@/components/movie/Header';
import { Trash2, Loader2, Film, Tv, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ContentItem {
  id: string;
  title: string;
  year: number;
  poster: string;
  createdAt?: string;
}

interface ContentData {
  movies: ContentItem[];
  series: ContentItem[];
  movieCount: number;
  seriesCount: number;
}

export default function AdminContentPage() {
  const { admin } = useAppStore();
  const router = useRouter();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [showConfirm, setShowConfirm] = useState<'movies' | 'series' | 'all' | null>(null);

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    
    fetchContent();
  }, [admin, router]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tmdb-content');
      const data = await res.json();
      setContent(data);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'movies' | 'series' | 'all') => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/tmdb-content?type=${type}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message);
        fetchContent();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete'));
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    } finally {
      setDeleting(false);
      setShowConfirm(null);
    }
  };

  const handleDeleteSingle = async (id: string, type: 'movie' | 'series') => {
    try {
      const res = await fetch(`/api/admin/tmdb-content?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.success) {
        fetchContent();
      } else {
        alert('Error: ' + (data.error || 'Failed to delete'));
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete');
    }
  };

  if (!admin) return null;

  const currentItems = activeTab === 'movies' ? content?.movies : content?.series;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header title="Manage Content" showSearch={false} />

      <div className="p-4">
        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-yellow-500 font-medium">Warning</p>
              <p className="text-yellow-400/80 text-sm mt-1">
                This page allows you to delete TMDB imported content. Deletion is permanent and cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-white text-2xl font-bold">{content?.movieCount || 0}</p>
                <p className="text-gray-400 text-sm">TMDB Movies</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Tv className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-white text-2xl font-bold">{content?.seriesCount || 0}</p>
                <p className="text-gray-400 text-sm">TMDB Series</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setShowConfirm('all')}
            disabled={deleting}
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete All Content
          </button>
          <button
            onClick={fetchContent}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('movies')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'movies'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400'
            )}
          >
            Movies ({content?.movieCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'series'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400'
            )}
          >
            Series ({content?.seriesCount || 0})
          </button>
          
          {currentItems && currentItems.length > 0 && (
            <button
              onClick={() => setShowConfirm(activeTab)}
              disabled={deleting}
              className="ml-auto px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All {activeTab === 'movies' ? 'Movies' : 'Series'}
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Content List */}
            <div className="space-y-2">
              {currentItems && currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-700">
                        {item.poster && (
                          <img
                            src={item.poster}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        <p className="text-gray-500 text-xs">{item.year}</p>
                        <p className="text-gray-600 text-xs truncate max-w-[200px]">{item.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSingle(item.id, activeTab === 'movies' ? 'movie' : 'series')}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-500">No TMDB {activeTab} found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-white font-bold text-lg mb-2">
              Delete {showConfirm === 'all' ? 'All Content' : `All ${showConfirm}`}?
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {showConfirm === 'all' 
                ? 'This will delete ALL TMDB imported movies and series. This action cannot be undone.'
                : `This will delete all TMDB imported ${showConfirm}. This action cannot be undone.`
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showConfirm)}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
