'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-white text-xl font-bold mb-2">Something went wrong!</h2>
      <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
        An error occurred while loading the page. Please try again.
      </p>
      {error?.message && (
        <p className="text-gray-500 text-xs mb-4 text-center max-w-md font-mono">
          {error.message}
        </p>
      )}
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
