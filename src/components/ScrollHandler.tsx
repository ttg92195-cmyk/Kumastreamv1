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
    // Reset body scroll styles when route changes
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
    
    // Scroll to top on page change (optional, can be removed if not wanted)
    // window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
