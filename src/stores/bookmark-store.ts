import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookmarkItem {
  id: string;
  movieId?: string;
  seriesId?: string;
}

interface BookmarkState {
  bookmarks: BookmarkItem[];
  addBookmark: (item: BookmarkItem) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (movieId?: string, seriesId?: string) => boolean;
  getBookmarkId: (movieId?: string, seriesId?: string) => string | null;
  setBookmarks: (bookmarks: BookmarkItem[]) => void;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (item) => set((state) => ({ 
        bookmarks: [...state.bookmarks, item] 
      })),
      removeBookmark: (id) => set((state) => ({ 
        bookmarks: state.bookmarks.filter((b) => b.id !== id) 
      })),
      isBookmarked: (movieId, seriesId) => {
        const { bookmarks } = get();
        return bookmarks.some((b) => 
          (movieId && b.movieId === movieId) || 
          (seriesId && b.seriesId === seriesId)
        );
      },
      getBookmarkId: (movieId, seriesId) => {
        const { bookmarks } = get();
        const bookmark = bookmarks.find((b) => 
          (movieId && b.movieId === movieId) || 
          (seriesId && b.seriesId === seriesId)
        );
        return bookmark?.id || null;
      },
      setBookmarks: (bookmarks) => set({ bookmarks }),
    }),
    {
      name: 'bookmark-storage',
    }
  )
);
