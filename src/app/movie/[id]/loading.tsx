export default function MovieLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Skeleton Loader */}
      <div className="relative w-full h-[280px] bg-[#1a1a1a]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent" />
      </div>
      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-36 bg-[#1a1a1a] rounded-lg flex-shrink-0" />
          <div className="flex-1 pb-2">
            <div className="h-7 w-3/4 bg-[#1a1a1a] rounded mb-2" />
            <div className="flex items-center gap-4">
              <div className="h-4 w-10 bg-[#1a1a1a] rounded" />
              <div className="h-4 w-8 bg-[#1a1a1a] rounded" />
              <div className="h-4 w-14 bg-[#1a1a1a] rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
            <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
            <div className="h-6 w-16 bg-[#1a1a1a] rounded-full" />
          </div>
          <div className="flex gap-2 border-b border-gray-800 pb-4">
            <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
            <div className="h-6 w-20 bg-[#1a1a1a] rounded" />
            <div className="h-6 w-16 bg-[#1a1a1a] rounded" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-[#1a1a1a] rounded" />
            <div className="h-4 w-full bg-[#1a1a1a] rounded" />
            <div className="h-4 w-3/4 bg-[#1a1a1a] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
