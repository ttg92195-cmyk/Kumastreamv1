'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useSettingsStore } from '@/stores/settings-store';
import {
  Home,
  Film,
  Tv,
  Bookmark,
  Grid3X3,
  Clock,
  Download,
  Settings,
  Shield,
  X,
  LogOut,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const isClient = typeof window !== 'undefined';

// Menu items defined outside component to prevent recreation
const BASE_MENU_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Series', href: '/series', icon: Tv },
  { name: 'Bookmark', href: '/bookmark', icon: Bookmark },
  { name: 'Genres/Tags/Collections', href: '/genres', icon: Grid3X3 },
  { name: 'Recent', href: '/recent', icon: Clock },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const;

const ADMIN_MENU_ITEMS = [
  { name: 'TMDB Generator', href: '/admin/tmdb', icon: Database },
] as const;

// Memoized menu item component for better performance
const MenuItem = memo(function MenuItem({ 
  item, 
  isActive, 
  themeColor, 
  onClick 
}: { 
  item: typeof BASE_MENU_ITEMS[number];
  isActive: boolean;
  themeColor: string;
  onClick: () => void;
}) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
        isActive
          ? 'text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      )}
      style={isActive ? { backgroundColor: `${themeColor}25`, color: themeColor } : {}}
    >
      <Icon className={cn('w-5 h-5', isActive && 'text-current')} />
      <span className="text-sm font-medium">{item.name}</span>
    </Link>
  );
});

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, admin, logoutAdmin, _hasHydrated } = useAppStore();
  const { themeColor } = useSettingsStore();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted] = useState(isClient);
  
  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  // Memoized handlers
  const handleClose = useCallback(() => setSidebarOpen(false), [setSidebarOpen]);
  
  const handleLogout = useCallback(() => {
    logoutAdmin();
    setSidebarOpen(false);
    router.push('/');
  }, [logoutAdmin, setSidebarOpen, router]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed'; // Additional fix for iOS
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [sidebarOpen]);

  if (!mounted) return null;

  const currentAdmin = _hasHydrated ? admin : null;

  return (
    <>
      {/* Backdrop with smooth fade */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60",
          "transition-all duration-300 ease-out",
          sidebarOpen 
            ? "opacity-100 visible" 
            : "opacity-0 invisible"
        )}
        onClick={handleClose}
      />

      {/* Sidebar with slide animation */}
      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 w-72 z-50 overflow-y-auto",
          "transition-transform duration-300 ease-out",
          "will-change-transform"
        )}
        style={{ 
          backgroundColor: '#0f0f0f',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: themeColor }}
            >
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">CINE</h1>
              <p className="text-gray-500 text-xs">STREAMING</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Badge */}
        {currentAdmin && (
          <div 
            className="mx-4 mt-4 p-3 rounded-lg border"
            style={{ 
              backgroundColor: `${themeColor}20`,
              borderColor: `${themeColor}50`
            }}
          >
            <p className="text-sm font-medium" style={{ color: themeColor }}>Admin Mode</p>
            <p className="text-gray-400 text-xs">Logged in as {currentAdmin.username}</p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {BASE_MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.name}
              item={item}
              isActive={pathname === item.href}
              themeColor={themeColor}
              onClick={handleClose}
            />
          ))}

          {/* Admin Only Items */}
          {currentAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-gray-500 text-xs font-medium px-4">Admin Tools</p>
              </div>
              {ADMIN_MENU_ITEMS.map((item) => (
                <MenuItem
                  key={item.name}
                  item={item}
                  isActive={pathname === item.href}
                  themeColor={themeColor}
                  onClick={handleClose}
                />
              ))}
            </>
          )}

          {/* Login/Logout */}
          <div className="pt-4 border-t border-gray-800 mt-4">
            {currentAdmin ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            ) : (
              <MenuItem
                item={{ name: 'Login', href: '/admin/login', icon: Shield }}
                isActive={pathname === '/admin/login'}
                themeColor={themeColor}
                onClick={handleClose}
              />
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 mt-4">
          <p className="text-gray-500 text-xs text-center">
            © 2024 CINE STREAM
          </p>
        </div>
      </aside>
    </>
  );
}
