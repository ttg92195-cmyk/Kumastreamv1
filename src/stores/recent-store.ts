import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentViewItem {
  id: string;
  movieId?: string;
  seriesId?: string;
  viewedAt: string;
}

interface RecentState {
  recentViews: RecentViewItem[];
  addRecentView: (item: RecentViewItem) => void;
  removeRecentView: (id: string) => void;
  clearRecentViews: () => void;
  setRecentViews: (views: RecentViewItem[]) => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      recentViews: [],
      addRecentView: (item) => set((state) => {
        // Remove existing entry for same movie/series
        const filtered = state.recentViews.filter((v) => 
          !((item.movieId && v.movieId === item.movieId) || 
            (item.seriesId && v.seriesId === item.seriesId))
        );
        // Add new entry at beginning
        return { recentViews: [item, ...filtered].slice(0, 50) }; // Keep only last 50
      }),
      removeRecentView: (id) => set((state) => ({ 
        recentViews: state.recentViews.filter((v) => v.id !== id) 
      })),
      clearRecentViews: () => set({ recentViews: [] }),
      setRecentViews: (views) => set({ recentViews: views }),
    }),
    {
      name: 'recent-storage',
    }
  )
);
