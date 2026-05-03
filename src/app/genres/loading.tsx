export default function GenresLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a]" />
          <div className="h-5 w-32 bg-[#1a1a1a] rounded" />
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Tab buttons skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-8 w-20 bg-[#1a1a1a] rounded-full" />
          <div className="h-8 w-16 bg-[#1a1a1a] rounded-full" />
          <div className="h-8 w-24 bg-[#1a1a1a] rounded-full" />
        </div>

        {/* Section skeleton */}
        <div className="mb-6">
          <div className="h-6 w-20 bg-[#1a1a1a] rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-[#1a1a1a] rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="h-6 w-20 bg-[#1a1a1a] rounded mb-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-[#1a1a1a] rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
