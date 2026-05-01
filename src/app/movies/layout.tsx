import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movies - CINE STREAM',
  description: 'Browse all movies available on CINE STREAM. Watch your favorite movies in high quality.',
};

export default function MoviesLayout({
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
