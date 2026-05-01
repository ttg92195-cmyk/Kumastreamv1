import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genres & Tags - CINE STREAM',
  description: 'Browse movies and series by genre, tag, or collection on CINE STREAM.',
};

export default function GenresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">Genres & Tags - CINE STREAM</h1>
      {children}
    </>
  );
}
