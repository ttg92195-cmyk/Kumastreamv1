'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ContentSectionProps {
  title: string;
  moreHref?: string;
  children: React.ReactNode;
}

export function ContentSection({ title, moreHref, children }: ContentSectionProps) {
  return (
    <section className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-1 text-red-500 text-sm font-medium hover:text-red-400 transition-colors"
          >
            More
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Scroll Content */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-3 px-4 pb-2">
          {children}
        </div>
      </div>
    </section>
  );
}
