import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - CINE STREAM',
  description: 'Learn about CINE STREAM - Your ultimate streaming destination for movies and TV series with Myanmar subtitles.',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="sr-only">About - CINE STREAM</h1>
      {children}
    </>
  );
}
