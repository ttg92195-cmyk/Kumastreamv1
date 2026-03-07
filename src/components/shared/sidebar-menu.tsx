'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores';
import { 
  Home, 
  Film, 
  Tv, 
  Bookmark, 
  Tags, 
  Clock, 
  Download, 
  Settings, 
  Shield,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movies', icon: Film },
  { name: 'Series', href: '/series', icon: Tv },
  { name: 'Bookmark', href: '/bookmark', icon: Bookmark },
  { name: 'Genres/Tags/Collections', href: '/genres', icon: Tags },
  { name: 'Recent', href: '/recent', icon: Clock },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin Login', href: '/admin/login', icon: Shield },
];

export function SidebarMenu() {
  const { isOpen, close } = useSidebarStore();
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        onClick={close}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 bg-neutral-950 z-50 transform transition-transform duration-300 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">CINE STREAM</span>
          </Link>
          <button 
            onClick={close}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-2 mt-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors my-1",
                  isActive 
                    ? "bg-red-600 text-white" 
                    : "text-gray-300 hover:bg-neutral-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 text-red-500" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
