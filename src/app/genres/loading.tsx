export default function GenresLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 p-4 space-y-6">
      <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
