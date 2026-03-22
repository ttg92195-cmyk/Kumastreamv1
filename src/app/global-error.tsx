'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a]">
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Application Error</h2>
          <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
            A client-side exception has occurred. Please refresh the page or try again later.
          </p>
          {error?.message && (
            <p className="text-gray-500 text-xs mb-4 text-center max-w-md font-mono bg-gray-800 p-2 rounded">
              {error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
