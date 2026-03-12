import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

interface Series {
  id: string;
  title: string;
  year: number;
  rating: number;
  poster: string;
  quality4k: boolean;
  quality?: string | null;
}

interface BookmarkItem {
  id: string;
  type: 'movie' | 'series';
  movieId?: string;
  seriesId?: string;
  movie?: Movie;
  series?: Series;
}

interface RecentItem {
  id: string;
  type: 'movie' | 'series';
  movieId?: string;
  seriesId?: string;
  movie?: Movie;
  series?: Series;
  viewedAt: string;
}

interface AdminUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface AppState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Sidebar state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Bookmarks (persisted)
  bookmarks: BookmarkItem[];
  addBookmark: (item: BookmarkItem) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string, type: 'movie' | 'series') => boolean;
  
  // Recent views (persisted)
  recents: RecentItem[];
  addRecent: (item: RecentItem) => void;
  clearRecents: () => void;
  
  // Admin auth (persisted)
  admin: AdminUser | null;
  setAdmin: (user: AdminUser | null) => void;
  isAdminLoggedIn: () => boolean;
  logoutAdmin: () => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Sidebar state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Bookmarks
      bookmarks: [],
      addBookmark: (item) => set((state) => {
        const exists = state.bookmarks.find(
          (b) => (item.type === 'movie' && b.movieId === item.movieId) ||
                 (item.type === 'series' && b.seriesId === item.seriesId)
        );
        if (exists) return state;
        return { bookmarks: [...state.bookmarks, item] };
      }),
      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter((b) => b.id !== id),
      })),
      isBookmarked: (id, type) => {
        const state = get();
        return state.bookmarks.some(
          (b) => (type === 'movie' && b.movieId === id) ||
                 (type === 'series' && b.seriesId === id)
        );
      },
      
      // Recent views
      recents: [],
      addRecent: (item) => set((state) => {
        // Remove existing item with same id and type, then add new one
        const filtered = state.recents.filter(
          (r) => !((item.type === 'movie' && r.movieId === item.movieId) ||
                   (item.type === 'series' && r.seriesId === item.seriesId))
        );
        return { recents: [item, ...filtered].slice(0, 20) }; // Keep only last 20
      }),
      clearRecents: () => set({ recents: [] }),
      
      // Admin auth
      admin: null,
      setAdmin: (user) => set({ admin: user }),
      isAdminLoggedIn: () => get().admin !== null,
      logoutAdmin: () => set({ admin: null }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'cine-stream-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        recents: state.recents,
        admin: state.admin,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
