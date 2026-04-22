import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Show all download links (persisted) - used in Downloads page
  showAllDownloadLinks: boolean;
  setShowAllDownloadLinks: (show: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Show download links
      showAllDownloadLinks: false,
      setShowAllDownloadLinks: (show) => set({ showAllDownloadLinks: show }),
    }),
    {
      name: 'kumastream-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        showAllDownloadLinks: state.showAllDownloadLinks,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
