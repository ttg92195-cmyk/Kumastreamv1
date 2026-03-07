'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathRef = useRef(pathname);

  // End transition when pathname changes
  const endTransition = useCallback(() => {
    setIsTransitioning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Check if path actually changed
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      // End transition with a small delay for smoothness
      const timer = setTimeout(endTransition, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname, endTransition]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        // Only for internal navigation
        if (href && href.startsWith('/') && !href.startsWith('/admin')) {
          const currentPath = window.location.pathname;
          if (href !== currentPath) {
            // Start transition
            setIsTransitioning(true);
            
            // Safety timeout - end transition after 1s max
            timeoutRef.current = setTimeout(() => {
              setIsTransitioning(false);
            }, 1000);
          }
        }
      }
    };

    // Use capture phase
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {children}
      {/* Loading overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[9999] bg-[#0f0f0f] flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-gray-700 border-t-red-500 rounded-full animate-spin" />
        </div>
      )}
    </>
  );
}
