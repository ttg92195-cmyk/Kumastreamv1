export default function MoviesLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header — always visible */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Movies</h1>
          <div className="relative w-56">
            <input
              type="text"
              placeholder="Search movies..."
              disabled
              className="w-full bg-[#1a1a1a] text-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm border border-gray-700"
            />
          </div>
        </div>
      </div>
      {/* Poster grid skeleton */}
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
