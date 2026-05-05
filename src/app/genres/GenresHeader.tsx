'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function GenresHeaderFallback() {
  return (
    <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
      <div className="flex items-center gap-4 p-4">
        <div className="w-6 h-6" />
        <div className="h-5 w-24" />
      </div>
    </div>
  );
}

export function GenresHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tag = searchParams.get('tag') || '';
  const collection = searchParams.get('collection') || '';
  
  const isShowTags = tag === '_show_tags';
  const isShowCollections = collection === '_show_collections';
  const hasRealFilter = (tag && !isShowTags) || (collection && !isShowCollections);
  
  let title = 'Genres';
  if (hasRealFilter) {
    if (tag && !isShowTags) {
      title = `Tag: ${tag}`;
    } else if (collection && !isShowCollections) {
      title = `Collection: ${collection}`;
    }
  } else if (isShowTags) {
    title = 'Tags';
  } else if (isShowCollections) {
    title = 'Collections';
  }

  return (
    <div className="sticky top-0 z-20 bg-[#0f0f0f] border-b border-gray-800">
      <div className="flex items-center gap-4 p-4">
        <button onClick={() => router.back()} className="text-red-500">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white font-bold text-lg">{title}</h1>
      </div>
    </div>
  );
}
