export default function GenresLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
        <div className="flex items-center gap-4 p-4">
          <div className="w-6 h-6 bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      {/* Content Skeleton */}
      <div className="p-4 space-y-6">
        <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
