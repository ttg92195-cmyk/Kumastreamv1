import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  
  // Theme color (persisted)
  themeColor: string;
  setThemeColor: (color: string) => void;
  
  // Show all download links (persisted) - used in Downloads page
  showAllDownloadLinks: boolean;
  setShowAllDownloadLinks: (show: boolean) => void;
  
  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  
  downloadNotifications: boolean;
  setDownloadNotifications: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Hydration state
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      
      // Theme color
      themeColor: '#ef4444',
      setThemeColor: (color) => {
        // Update CSS variable
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--theme-color', color);
        }
        set({ themeColor: color });
      },
      
      // Show download links - THIS IS THE MAIN TOGGLE
      showAllDownloadLinks: false,
      setShowAllDownloadLinks: (show) => set({ showAllDownloadLinks: show }),
      
      // Notifications
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      
      downloadNotifications: false,
      setDownloadNotifications: (enabled) => set({ downloadNotifications: enabled }),
    }),
    {
      name: 'kumastream-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        themeColor: state.themeColor,
        showAllDownloadLinks: state.showAllDownloadLinks,
        notificationsEnabled: state.notificationsEnabled,
        downloadNotifications: state.downloadNotifications,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Apply theme color on rehydration
        if (state?.themeColor && typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--theme-color', state.themeColor);
        }
      },
    }
  )
);
