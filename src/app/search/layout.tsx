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
    <>
      <h1 className="sr-only">Search - CINE STREAM</h1>
      {children}
    </>
  );
}
