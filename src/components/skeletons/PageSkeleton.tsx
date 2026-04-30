/**
 * Simple Skeleton Components
 * Only shows: Poster, Title, Year - matching the actual content cards
 */

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
          <div className="h-10 w-56 bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(20)].map((_, i) => (
            <div key={i}>
              {/* 1. Poster Skeleton */}
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              {/* 2. Title Skeleton */}
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              {/* 3. Year Skeleton */}
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookmarkSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              {/* 1. Poster Skeleton */}
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              {/* 2. Title Skeleton */}
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              {/* 3. Year Skeleton */}
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="h-7 w-24 bg-gray-800 rounded animate-pulse" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {[...Array(15)].map((_, i) => (
            <div key={i}>
              {/* 1. Poster Skeleton */}
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              {/* 2. Title Skeleton */}
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              {/* 3. Year Skeleton */}
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CollectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {/* Header Skeleton */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur-sm border-b border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-800 rounded animate-pulse" />
          <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-2">
          {[...Array(20)].map((_, i) => (
            <div key={i}>
              {/* 1. Poster Skeleton */}
              <div className="aspect-[2/3] bg-gray-800 rounded-md animate-pulse" />
              {/* 2. Title Skeleton */}
              <div className="mt-1.5 h-3 bg-gray-800 rounded animate-pulse w-4/5" />
              {/* 3. Year Skeleton */}
              <div className="mt-1 h-2.5 bg-gray-800 rounded animate-pulse w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
