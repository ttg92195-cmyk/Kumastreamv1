import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Series - CINE STREAM',
  description: 'Browse all TV series available on CINE STREAM. Watch your favorite shows in high quality.',
};

export default function SeriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">Series - CINE STREAM</h1>
      {children}
    </>
  );
}
