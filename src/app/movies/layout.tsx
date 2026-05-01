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
    <>
      <h1 className="sr-only">Movies - CINE STREAM</h1>
      {children}
    </>
  );
}
