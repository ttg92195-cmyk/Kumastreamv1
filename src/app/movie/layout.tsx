import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Movie Details - CINE STREAM',
  description: 'Watch movies in high quality on CINE STREAM.',
};

export default function MovieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
