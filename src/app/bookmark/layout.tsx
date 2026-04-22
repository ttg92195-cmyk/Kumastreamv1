import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bookmark - CINE STREAM',
  description: 'Your saved movies and series on CINE STREAM.',
};

export default function BookmarkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">Bookmark - CINE STREAM</h1>
      {children}
    </>
  );
}
