export default function RecentLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a]" />
          <div className="h-5 w-20 bg-[#1a1a1a] rounded" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-[#1a1a1a] rounded-lg" />
              <div className="mt-1.5 h-3 w-3/4 bg-[#1a1a1a] rounded" />
              <div className="mt-1 h-3 w-1/3 bg-[#1a1a1a] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
