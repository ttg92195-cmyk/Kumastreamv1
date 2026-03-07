'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Film, Tv, Bookmark, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Series', href: '/series', icon: Tv },
  { name: 'Bookmark', href: '/bookmark', icon: Bookmark },
  { name: 'Recent', href: '/recent', icon: Clock },
];

export function BottomNav() {
  const pathname = usePathname();

  // Don't show on admin pages
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      {/* Solid background layer - covers safe area */}
      <div className="absolute inset-0 bg-[#0f0f0f]" />
      <div className="relative flex items-center h-16 max-w-lg mx-auto safe-area-bottom border-t border-[#262626]">
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
                isActive ? 'text-red-500' : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-red-500')} />
              <span className={cn('text-xs', isActive && 'text-red-500 font-medium')}>
                {item.name}
              </span>
              {/* Indicator line - centered under active icon */}
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
