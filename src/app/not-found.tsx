'use client';

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-[150px] font-bold text-gray-800/50 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
              <Search className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4">You might want to check:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/movies" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Movies
            </Link>
            <Link href="/series" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Series
            </Link>
            <Link href="/genres" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Genres
            </Link>
            <Link href="/search" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Search
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
