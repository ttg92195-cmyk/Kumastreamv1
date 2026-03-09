'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Bookmark, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings-store';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Series', href: '/series', icon: Tv },
  { name: 'Bookmark', href: '/bookmark', icon: Bookmark },
  { name: 'Recent', href: '/recent', icon: Clock },
];

export function BottomNav() {
  const pathname = usePathname();
  const { themeColor, _hasHydrated } = useSettingsStore();
  
  // Use hydrated theme color or default red
  const currentColor = _hasHydrated ? themeColor : '#ef4444';

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      {/* Extended background layer - covers nav + extra space for rubber-banding */}
      <div className="absolute -top-4 left-0 right-0 bottom-0 bg-[#0f0f0f]" />
      <div className="absolute -bottom-20 left-0 right-0 h-24 bg-[#0f0f0f]" />
      <div className="relative flex items-center h-16 max-w-lg mx-auto safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full relative',
                'transition-colors duration-200',
                isActive ? '' : 'text-gray-500 hover:text-gray-300'
              )}
              style={isActive ? { color: currentColor } : {}}
            >
              <Icon className="w-5 h-5" />
              <span className={cn('text-xs', isActive && 'font-medium')}>
                {item.name}
              </span>
              {/* Indicator line - centered under active icon */}
              {isActive && (
                <span 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" 
                  style={{ backgroundColor: currentColor }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
