import type { Metadata } from 'next';
import Link from 'next/link';
import { Film, Tv, Bookmark, Grid3X3, Clock, Download, Settings, Home, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sitemap - CINE STREAM',
  description: 'Complete sitemap of CINE STREAM website with links to all pages.',
};

const mainPages = [
  { name: 'Home', href: '/', description: 'Main page with latest movies and series', icon: Home },
  { name: 'Movies', href: '/movies', description: 'Browse all movies', icon: Film },
  { name: 'Series', href: '/series', description: 'Browse all TV series', icon: Tv },
  { name: 'Bookmark', href: '/bookmark', description: 'Your saved movies and series', icon: Bookmark },
  { name: 'Genres, Tags & Collections', href: '/genres', description: 'Browse content by genre, tag, or collection', icon: Grid3X3 },
  { name: 'Recent', href: '/recent', description: 'Your recently viewed content', icon: Clock },
  { name: 'Downloads', href: '/downloads', description: 'Download settings and options', icon: Download },
  { name: 'Settings', href: '/settings', description: 'Account and app settings', icon: Settings },
  { name: 'Search', href: '/search', description: 'Search for movies and series', icon: Search },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-white font-bold text-2xl mb-2">Sitemap</h1>
        <p className="text-gray-400 text-sm mb-6">
          Complete list of all pages on CINE STREAM website.
        </p>

        {/* Main Pages */}
        <section className="mb-8">
          <h2 className="text-gray-300 text-sm font-medium uppercase mb-3">Main Pages</h2>
          <nav aria-label="Sitemap navigation">
            <ul className="space-y-2">
              {mainPages.map((page) => {
                const Icon = page.icon;
                return (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-red-500/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/15 flex-shrink-0">
                        <Icon className="w-5 h-5 text-red-500" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{page.name}</div>
                        <div className="text-gray-400 text-sm">{page.description}</div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </section>

        {/* Additional Info */}
        <section className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <h2 className="text-gray-300 text-sm font-medium mb-2">About This Sitemap</h2>
          <p className="text-gray-400 text-sm">
            This sitemap provides links to all the main sections of CINE STREAM. 
            For specific content, use the search feature or browse through categories.
          </p>
        </section>
      </div>
    </div>
  );
}
