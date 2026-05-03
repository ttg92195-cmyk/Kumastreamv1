'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Something Went Wrong
        </h2>
        <p className="text-gray-400 mb-8">
          An unexpected error occurred while loading this page. 
          This might be a temporary issue, please try again.
        </p>

        {/* Error Details (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-left">
            <p className="text-red-400 text-xs font-mono break-all">
              {error?.message || 'Unknown error'}
            </p>
            {error?.digest && (
              <p className="text-gray-500 text-xs mt-2 font-mono">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm mb-4">You might want to try:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link href="/movies" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Movies
            </Link>
            <Link href="/series" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Series
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
