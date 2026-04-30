/**
 * Simple Skeleton Components
 * Only shows: Poster, Title, Year - matching the actual content cards
 * No header skeletons - clean minimal loading state
 */

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 p-4">
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
  );
}

export function BookmarkSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 p-4">
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
  );
}

export function SearchSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 p-4">
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
  );
}

export function CollectionSkeleton() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20 p-4">
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
  );
}
