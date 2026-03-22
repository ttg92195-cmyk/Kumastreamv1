'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollHandler - Minimal scroll reset on route change
 * Only resets body overflow to prevent stuck scroll locks from modals
 */
export default function ScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    // Only reset overflow - this prevents scroll locks from modals
    // Don't reset other styles to avoid visual disruptions
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }, [pathname]);

  return null;
}
