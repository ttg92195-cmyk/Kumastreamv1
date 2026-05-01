import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search - CINE STREAM',
  description: 'Search for movies and series on CINE STREAM.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-20">
      {children}
    </div>
  );
}
