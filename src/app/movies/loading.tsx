export default function MoviesLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-56 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Content Grid Skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(20)].map((_, i) => (
            <div key={i}>
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
