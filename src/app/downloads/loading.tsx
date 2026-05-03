export default function DownloadsLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a]" />
          <div className="h-5 w-28 bg-[#1a1a1a] rounded" />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 bg-[#1a1a1a] rounded" />
            <div className="w-10 h-6 bg-[#1a1a1a] rounded-full" />
          </div>
          <div className="h-32 bg-[#1a1a1a] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
