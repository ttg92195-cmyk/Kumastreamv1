import Link from 'next/link';
import { FolderOpen, Home, ArrowLeft, Search } from 'lucide-react';

export default function CollectionNotFound() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Collection Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
            <FolderOpen className="w-12 h-12 text-red-500" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">
          Collection Not Found
        </h2>
        <p className="text-gray-400 mb-8">
          The collection you&apos;re looking for doesn&apos;t exist or has been removed.
          Browse our collections to find something you like.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/genres?collection=_show_collections"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            Browse Collections
          </Link>
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
          <p className="text-gray-500 text-sm mb-4">You might want to:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <Link href="/search" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Link>
            <Link href="/movies" className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:text-white hover:bg-gray-700 transition-colors">
              Movies
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
