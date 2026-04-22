'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollHandler - Resets scroll and body styles on route change
 * This ensures scroll is never locked when navigating between pages
 */
export default function ScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Reset ALL body scroll styles when route changes
    const resetScroll = () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.bottom = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      
      // Remove any data attributes that might affect scroll
      document.body.removeAttribute('data-scroll-locked');
      document.body.removeAttribute('data-lock');
      document.body.removeAttribute('aria-hidden');
      
      // Reset html as well
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
    
    // Run reset immediately
    resetScroll();
    
    // Also run after a small delay to catch any async scroll locks
    const timeoutId = setTimeout(resetScroll, 100);
    
    return () => {
      clearTimeout(timeoutId);
      resetScroll();
    };
  }, [pathname]);

  return null;
}
