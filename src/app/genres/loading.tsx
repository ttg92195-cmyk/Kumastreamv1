export default function GenresLoading() {
  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-3 gap-2">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
