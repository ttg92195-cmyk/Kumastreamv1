import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collections - CINE STREAM',
  description: 'Browse movie and series collections on CINE STREAM.',
};

export default function CollectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
