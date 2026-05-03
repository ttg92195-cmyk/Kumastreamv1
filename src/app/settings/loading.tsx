export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="w-10 h-10 rounded-lg bg-[#1a1a1a]" />
          <div className="h-5 w-20 bg-[#1a1a1a] rounded" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <div className="h-4 w-20 bg-[#1a1a1a] rounded mb-3" />
          <div className="space-y-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-48 bg-[#1a1a1a] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-4 w-16 bg-[#1a1a1a] rounded mb-3" />
          <div className="space-y-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-800">
                <div className="w-10 h-10 rounded-full bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-40 bg-[#1a1a1a] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
